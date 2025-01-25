const express = require('express');
require('dotenv').config()
const session = require("express-session");
const fs = require('fs');
const https = require('https');

const lib = require("./funciones_pkn");
const lib_c = require("./consts_pkn");
const clases = require("./class_ubicaciones");
const { request } = require('http');



///////////////////////////
//////// rutas ////////////
///////////////////////////
var app = express();
let options = { maxAge: '2h', etag: false };  //cambiar a 2d
app.use(express.static('public', options));
app.use(session({ secret: "1234", resave: false, saveUninitialized: false, }));

let vec_variedades = [];



// root
app.get('/', async function (req, res) {
	if (req.session.nav_bar == null) { req.session.nav_bar = '' };
	const pwd=req.query.pwd_usuario || '';

	const agente=new clases.Agente(req.query.id_agente || '', req.query.nom_agente || '', req.query.ape_agente || '', req.query.tipo_agente || 'u', req.query.ubicacion || '', req.query.ubic_comp || '', 
		req.query.cuit_agente || '', req.query.user || '', req.query.nacimiento || '01/01/2001', req.query.domicilio || '', req.query.email || '', req.query.celular || '');
	let params = { op: req.query.op || '', query: '' , logged:true}, rta = "";

	if (typeof app.locals.objs_static === "undefined") {
	try {
		const value = await lib_c.pkn_engage();
		app.locals.objs_static = value;
		head = value.consts.head;
		res.redirect('/');
		}
	catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }

	}

	else if (params.op == '') {
		params.op = "all";
		params.query = "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales";
		if (typeof req.session.logged === "undefined") {req.session.logged=false;};
		params.logged=req.session.logged;

		try {
			const value = await lib.pkn_getNogales(params);
				vec_variedades = value.vec;
				rta = app.locals.objs_static.consts.head + "</head><body>" +
					app.locals.objs_static.consts.grids_main.header;
				if (!req.session.logged) {
					rta += lib_c.html_form_login;
					is_logged=false;
					}
				else {
					rta += lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido });
				}
				rta += req.session.nav_bar + "</div> \n " + //cierro div del header.login

					app.locals.objs_static.consts.grids_main.article + //</header><article id='mainArticle'>
					app.locals.objs_static.consts.grids_publics.start + // <div class='grid_main_public'> 

					app.locals.objs_static.consts.grids_publics.post_nav + // <header_flex id='publicHeaderFlex'>
					"</header_flex>" +
					"<div id='publicArticleHome'> <div class='intro' style='text-align: center;'><h2 style='padding-top:0px;'>PKN - gesti&oacute;n</h2><h3>Manejo de stock y registro de actividades</h3>" +
					" <img src='/images/PKN01_min.webp' alt='nogales IA' width='100%'> </div> <div class='links'>";
				let temp_rta = "Debe loguearse para acceder al sistema. ";
				if (req.session.logged) {
					temp_rta = "Bienvenido: " + req.session.agente.nombre + ", " + req.session.agente.apellido;
				}

				rta += temp_rta + "</div> <div class='destacados'>anuncios - recordatorios<br><br>valor plantin: $" + app.locals.objs_static.consts.valor_plantin + "<br>validez de reservas: " + app.locals.objs_static.consts.dias_reserva + " dias.</div> " +
					"<div class='new'>noticias</div> <div class='jornadas'>Jornadas - Agenda</div>" +
					"<div class='clima'>clima</div> \n" +
					"</div></div>" + app.locals.objs_static.consts.grids_main.nav +
					app.locals.objs_static.consts.grids_main.stocks +
					"<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'></div>" +
					app.locals.objs_static.consts.grids_main.footer + " \n </body>\n</html>";

				//res.set('Cache-Control', 'public, max-age=31557600'); // one year
				res.send(rta);
			} 
		catch (error) { res.send(app.locals.objs_static.consts.error + error + "</body></html>"); }

	}
	else if (params.op == 'login') {
		params.query = clases.Agente.getQueryLogin(agente.user, pwd);
		try {
			const value = await lib.asyncDB_getAgentes(params);

			if (value.agente.id != null) {// encontró al usuario.
				req.session.logged = true;
				req.session.agente = value.agente;
				let temp_functions = "</ul>";
				if (value.agente.tipo.toLowerCase() == 'a' || value.agente.tipo == 'v') {
					temp_functions = app.locals.objs_static.consts.f_admins;
				}
				if (value.agente.tipo != 'u') { /*agregaba funcion nueva public*/ }
				req.session.functions = temp_functions;
				req.session.nav_bar = "<ul>" + app.locals.objs_static.consts.nav_bar.home + " <li><a href='" + clases.Agente.getLinksAgente("tablero?op=ok", value.agente) + "'>Mi Tablero</a><li> " + temp_functions;
				let temp="tablero?op=ok";
				if (value.agente.tipo=='u'){
					temp+="&op2=data_agente";
					}
				res.redirect(clases.Agente.getLinksAgente(temp, value.agente));
			}
			else { res.redirect("/"); }
			}
		catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }

	}

	else if (params.op == 'logout') {
		req.session.logged = false;
		req.session.nav_bar = "";
		req.session.agente = null;
		res.redirect("/");
	}
},);




//abm (formularios y queries: inserts / updates) para todas las tablas.
app.get('/abm', async function (req, res) {
	const date = new Date();
	if (req.session.logged && app.locals.objs_static.engaged) {
		let sql = "", sql1 = "", sql2 = "", sql3 = "";
		const op = req.query.op || '*', op2 = req.query.op2 || '*', op3 = req.query.op3 || '*';

		const orden = {
			id: req.query.id_orden || '', agente: req.session.agente || '', k_plantines: req.query.k_plantines || '', v_plantin: req.query.v_plantin || '', v_total: req.query.v_total || '', cuit_comprador: req.query.cuit_agente || '', id_comprador: req.query.id_comprador || '', apellido_comprador: req.query.ape_agente || '',
			fecha_entrega: req.query.fecha_entrega || '', fecha_orden: req.query.fecha_orden || '', id_vendedor: req.query.id_vendedor || '', observaciones: req.query.observaciones || '', estado: req.query.estado_orden || '', con_iva: req.query.con_iva || '0', detalle: req.query.detalle || '',
			valor_plantin: app.locals.objs_static.consts.valor_plantin, senia: req.query.senia || '', observaciones_c: req.query.observaciones_c || '', cerrar_vendedor: req.query.cerrar_vendedor || '', cerrar_monto: req.query.cerrar_monto || '', cerrar_observaciones: req.query.cerrar_observaciones || '' };

		const agente=new clases.Agente(req.query.id_agente || '', req.query.nom_agente || '', req.query.ape_agente || '', req.query.tipo_agente || 'u', req.query.ubicacion || '', req.query.ubic_comp || '', 
				req.query.cuit_agente || '', req.query.user || '', req.query.nacimiento || '01/01/2001', req.query.domicilio || '', req.query.email || '', req.query.celular || '', req.query.pwd || '');

		let rta = "";

		if (op == "na") { //nuevo agente
			if (req.session.agente.tipo.toLowerCase()=='a') { 
				const o_rta = lib_c.get_form_agente("new_a", agente);
				rta = app.locals.objs_static.consts.head + "<script>" + clases.Ubicaciones.js_deptos() + " </script>\n </head>\n" +
					"<body>" +
					app.locals.objs_static.consts.grids_main.header +
					lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) +
					req.session.nav_bar + "</div> \n " +
					"</header><article id='mainArticle'>\n" +//grids_main.article+
					"<div class='grid_main_public'>\n" +//grids_publics.start+
					" <header_flex id='publicHeaderFlex'>\n\n" + //post_nav
					"<h2>Nuevo Agente</h2></header_flex> \n <div id='publicArticle' >" +
					o_rta.inic + app.locals.objs_static.opts_provincias + o_rta.final +
					"</div> \n\n </div> \n" +
					"</article><nav id='mainNav'>\n </nav> <div id='stocks'>\n " ;

				try {
					const value = await lib.pkn_getNogales({ op: "all", query: "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales", logged:req.session.logged });


					vec_variedades = value.vec;
					rta += "<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'> </div>";
					rta += "</div><footer id='pageFooter'>Footer</footer>\n" +//grids_main.footer+
						" \n </body>\n</html>";
					res.send(rta);
					}
				catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }
			}
			else {res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", agente));}
		}
		else if (op == "new_a") { //insert nuevo agente

			try {
				const value = await lib.insert_blank([clases.Agente.getQueryInsert(agente)]);
				console.log("objeto de la rta: JSON.stringify(value.obj_rta[0])):  "+JSON.stringify(value.obj_rta[0]));
				agente.id = value.obj_rta[0].insertId;
				res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", agente));
				}
			catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }

		}
		else if (op == "edit_a") { //editar agente
			if (req.session.agente.tipo.toLowerCase()=='a') { 
				const o_rta = lib_c.get_form_agente("update_a", agente);
				rta = app.locals.objs_static.consts.head + "<script>" + clases.Ubicaciones.js_deptos() + " </script>\n </head>\n" +
				"<body onload='setUbic("+agente.ubicacion+");'>" +
				app.locals.objs_static.consts.grids_main.header +
				lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) +
				req.session.nav_bar + "</div> \n " +
				"</header><article id='mainArticle'>\n" +//grids_main.article+
				"<div class='grid_main_public'>\n" +//grids_publics.start+
				" <header_flex id='publicHeaderFlex'>\n\n" + //post_nav
				"<h2>Nuevo Agente</h2></header_flex> \n <div id='publicArticle' >" +
				o_rta.inic + app.locals.objs_static.opts_provincias + o_rta.final +
				"</div> \n\n </div> \n" +
				"</article><nav id='mainNav'>\n </nav> <div id='stocks'>\n " ;
				
				try {
					const value = await lib.pkn_getNogales({ op: "all", query: "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales", logged:req.session.logged });			
						vec_variedades = value.vec;
						rta += "<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'> </div>";
						rta += "</div><footer id='pageFooter'>Footer</footer>\n" +//grids_main.footer+
							" \n </body>\n</html>";
						res.send(rta);
					}
				catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }
				}
			else {res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", agente));}
		}
		else if (op == "update_a") {
			try {
				const value = await lib.insert_blank([clases.Agente.getQueryUpdate(agente)]);
				res.redirect(clases.Agente.getLinksAgente("tablero?op=ok&op2=data_agente&affected_rows="+value.obj_rta[0].affectedRows, agente));
				}
			catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }
		}


		else if (op == "nq") {  //nueva orden
			rta = app.locals.objs_static.consts.head + "\n</head>\n\n " +
				"<body>\n " +
				app.locals.objs_static.consts.grids_main.header +
				lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) +
				req.session.nav_bar + "</div> \n " +

				"</header><article id='mainArticle'>\n" +//grids_main.article+
				"<div class='grid_main_public'>\n" +//grids_publics.start+
				" <header_flex id='publicHeaderFlex'>\n\n" + //post_nav

				"<h2>Nueva Orden</h2> \n </header_flex> \n <div id='publicArticle'>";
			orden.fecha_orden = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
			orden.v_plantin = orden.valor_plantin;
			orden.estado = 'A';
			const rta_o = lib_c.get_form_orden('new_q', orden);
			rta += rta_o +
				"\n </div></div>\n " + //grids_public.end
				"</article><nav id='mainNav'>\n " +//grids_main.nav+
				"</nav><div id='stocks'>\n ";//grids_main.stocks+
			
			try {
				const value = await lib.pkn_getNogales({ op: "all", query: "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales", logged:req.session.logged });			
				vec_variedades = value.vec;
				rta += "<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'> </div>";
				rta += "</div><footer id='pageFooter'>Footer</footer>\n" +//grids_main.footer+
					" \n </body>\n</html>";
				res.send(rta);
				}
			catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }
		}
		else if (op == "new_q") {
			sql = "insert into Ordenes (id_vendedor, cantidad_plantines, valor_plantin, valor_orden, observaciones_orden, id_comprador, fecha_entrega, fecha_orden, estado_orden, senia, observaciones_comerciales, con_iva) " +
				" Values (" + orden.id_vendedor + ", " + orden.k_plantines + ", " + orden.v_plantin + ", " + orden.v_total + ", '" + orden.observaciones + "', " + orden.id_comprador + ", STR_TO_DATE('" + orden.fecha_entrega + "', '%d/%m/%Y'), curdate(), '" + orden.estado + "', '" + orden.senia + "', '" + orden.observaciones_c + "', "+orden.con_iva+")";
			let id_new_orden = 0, rta = "<html><head></head><body>",
				sql2 = "insert into Detalle_orden (id_orden, id_variedad, cantidad_variedad) values ",
				sql3 = "INSERT INTO Nogales (id_variedad, reserva) VALUES ", 
				sql4 = "insert into Movimientos_stock (id_agente, tipo_operacion, id_variedad, cantidad, descripcion) values ";
			console.log("detalle que recibo: "+orden.detalle);
			/*res.send("<html><body><p>falta eliminar detalle orden del orden id e insertar los nuevos</p><p>" + sql + "</p><p>" + sql2 + "</p><p>" + sql3 + "</p><p>" + orden.detalle + "</p><p>" + detalle + "</p><br><br>" + lib_c.get_links_agente("tablero?op=ok", req.session.agente) + "&new_public_id=??</body></html>");*/
			try {
				const value = await lib.insert_blank([sql]);
				id_new_orden = value.obj_rta[0].insertId;
				let detalle = lib_c.splitDetalle(orden.detalle);
				console.log("sql1: "+sql+"\ndetalle: "+detalle+"\nid_orden: "+id_new_orden);
				for (let i = 1, prim = true; i < detalle.length; i++) {
					if (detalle[i] != "0") {
						if (prim) { prim = false; }
						else { sql2 += ", "; sql3 += ", "; sql4 += ", "; }
						sql2 += "(" + id_new_orden + ", " + i + ", " + detalle[i] + ")";
						sql3 += "(" + i + ", " + detalle[i] + ")";
						sql4 += "("+req.session.agente.id+", 'A', "+i+", "+detalle[i]+", 'nueva orden: "+id_new_orden+"')";
						}
					}
				sql3 += " ON DUPLICATE KEY UPDATE reserva =reserva+VALUES(reserva), nombre_variedad=nombre_variedad";
				console.log("triple insert:\nsql2: "+sql2+"\nsql3: "+sql3+"\nsql4: "+sql4);
				try {
					const value = await lib.insert_blank([sql2, sql3, sql4]);
					console.log("triple insert rtas: "+value.s_rta);
					}
				catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }

					res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", req.session.agente) + "&new_orden_id=" + id_new_orden);
				}
				catch (error) { console.log("sql2: " + sql2); console.log("sql3: " + sql3); console.log("sql4: " + sql4); res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }

			//res.redirect(lib_c.get_links_agente("tablero?op=ok", req.session.agente)+"&new_public_id="+value.insertId);

		}
		else if (op == "edit_q") {
			rta = app.locals.objs_static.consts.head + "</head>\n\n " +
				"<body>\n " +
				app.locals.objs_static.consts.grids_main.header +
				lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) +
				req.session.nav_bar + "</div> \n " +

				"</header><article id='mainArticle'>\n" +//grids_main.article+
				"<div class='grid_main_public'>\n" +//grids_publics.start+
				"\n <header_flex id='publicHeaderFlex' style='margin-bottom:0px;'>" +
				"<h2>Editar orden</h2> \n </header_flex> \n <div id='publicArticle'>";


			orden.valor_plantin = orden.v_plantin;
			const rta_o = lib_c.get_form_orden('update_q', orden);
			rta += rta_o +
				"\n </div></div>\n " + //grids_public.end
				"</article><nav id='mainNav'>\n " +//grids_main.nav+
				"</nav><div id='stocks'>\n ";//grids_main.stocks+

			try {
				const value = await lib.pkn_getNogales({ op: "all", query: "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales", logged:req.session.logged });
				vec_variedades = value.vec;

				rta += "<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'> </div>" +
					"</div><footer id='pageFooter'>Footer</footer>\n" +//grids_main.footer+
					" \n </body>\n</html>";
				res.send(rta);
				}
			catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }
		}

		else if (op == "update_q") { //update orden
			sql = "update Ordenes set " +
				"cantidad_plantines=" + orden.k_plantines + ", valor_plantin=" +
				orden.v_plantin + ", valor_orden=" + orden.v_total + ", observaciones_orden='" + orden.observaciones + "', con_iva=" +orden.con_iva +
				", fecha_entrega=STR_TO_DATE('" + orden.fecha_entrega + "', '%d/%m/%Y'), senia='" + orden.senia + "', observaciones_comerciales='" + orden.observaciones_c + "' " +
				" where id_orden=" + orden.id;

			sql1 = "delete from Detalle_orden where id_orden=" + orden.id;
			sql2 = "insert into Detalle_orden (id_orden, id_variedad, cantidad_variedad) values ",
			sql3 = "INSERT INTO Nogales (id_variedad, reserva) VALUES ";
			let sql4="insert into Movimientos_stock (id_agente, tipo_operacion, id_variedad, cantidad, descripcion) values ";

			let detalle = lib_c.splitDetalle(orden.detalle), vec_sql3_params=[];
			for (let i = 1, prim = true; i < detalle.length; i++) {
				if (detalle[i] !== "0") {
					if (prim) { prim = false; }
					else { sql2 += ", "; sql4 += ", ";}
					sql2 += "(" + orden.id + ", " + i + ", " + detalle[i].sum + ")";
					sql4 += "("+req.session.agente.id+", 'A', "+detalle[i].id_variedad+", "+detalle[i].cant+", 'edit orden: "+orden.id+"')";
					if (detalle[i].reserva0 == "0") { vec_sql3_params.push( "(" + i + ", " + detalle[i].sum + ")" ); }
					else if (detalle[i].reserva0 == detalle[i].sum) { }
					else { vec_sql3_params.push( "(" + i + ", " + (parseInt(detalle[i].sum) - detalle[i].reserva0) + ")" ); }
				}
			}
			if (vec_sql3_params.length>0) {
				sql3 += vec_sql3_params.join(", ")+" ON DUPLICATE KEY UPDATE reserva =reserva+VALUES(reserva), nombre_variedad=nombre_variedad";
				}
			else { sql1 = ""; sql3 = ""; sql2 = ""; }			

			//**/res.send("<html><body><p>editar orden</p><p>" + sql + "</p><p>sql1: " + sql1 + "</p><p>sql2: " + sql2 + "</p><p>sql3: " + sql3 + "</p><p>vec_detalle: "+detalle+"</p><p>" + orden.detalle + "</p><br><br>" + lib_c.get_links_agente("tablero?op=ok", req.session.agente) + "&new_public_id=??</body></html>");
			try {
				const value =await lib.insert_blank([sql, sql1, sql2, sql3]);
				console.log("execution sqls... 1,2,3 y 4: "+value.s_rta);
				res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", req.session.agente));
				}
			catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }

		}
		else if (op == "estado_q") {
			let sql2 = "";
			if (op2 == "reactivar") {//reactivar publicacion
				sql = "update Publicaciones_agente set " +
					"fecha_publicacion=CURRENT_DATE(), estado_publicacion='1' " +
					" where id_publicacion=" + publicacion.id;
			}
			else if (op2 == "c") { //cerrar
				sql = "update Ordenes set estado_orden='C', cierre_vendedor='" + orden.cerrar_vendedor + "', cierre_monto='" + orden.cerrar_monto + "', observaciones_orden = CONCAT(observaciones_orden,'\n----\n" + orden.cerrar_observaciones + "') where id_orden=" + orden.id;
				sql2 = "INSERT INTO Nogales (id_variedad , reserva) values ";

				let detalle = lib_c.splitDetalle(orden.detalle);

				for (let i = 1, prim = true; i < detalle.length; i++) {
					if (detalle[i] != "0") {
						if (prim) { prim = false; }
						else { sql2 += ", "; }
						sql2 += "(" + i + ", " + detalle[i] + ")";
					}
				}
				sql2 += " ON DUPLICATE KEY UPDATE reserva =reserva-VALUES(reserva), stock=stock-values(reserva), nombre_variedad=nombre_variedad";
			}
			else if (op2 == "x") { //cancel
				sql = "update Ordenes set estado_orden='X', cierre_vendedor='" + orden.cerrar_vendedor + "', observaciones_orden = CONCAT(observaciones_orden,'\n----\n" + orden.cerrar_observaciones + "')  where id_orden=" + orden.id;
				sql2 = "INSERT INTO Nogales (id_variedad , reserva) values ";

				detalle = lib_c.splitDetalle(orden.detalle);
				for (let i = 1, prim = true; i < detalle.length; i++) {
					if (detalle[i] != "0") {
						if (prim) { prim = false; }
						else { sql2 += ", "; }
						sql2 += "(" + i + ", " + detalle[i] + ")";
					}
				}
				sql2 += " ON DUPLICATE KEY UPDATE reserva=reserva+VALUES(reserva), nombre_variedad=nombre_variedad";
			}
			else if (op2 == "reopen") { //cancel
				sql = "update Ordenes set estado_orden='A' where id_orden=" + orden.id;
				sql2 = "INSERT INTO Nogales (id_variedad , reserva) values ";

				detalle = lib_c.splitDetalle(orden.detalle);
				for (let i = 1, prim = true; i < detalle.length; i++) {
					if (detalle[i] != "0") {
						if (prim) { prim = false; }
						else { sql2 += ", "; }
						sql2 += "(" + i + ", " + detalle[i] + ")";
					}
				}
				sql2 += " ON DUPLICATE KEY UPDATE reserva=reserva+VALUES(reserva), nombre_variedad=nombre_variedad";
			}

			else if (op2 == "edit_stock") {
				sql = "update Nogales set ";
				let alta_baja="A";
				if (op3 == "more_s") { sql += "stock=stock+"; }
				else if (op3 == "less_s") { sql += "stock=stock-"; alta_baja="B";}
				else if (op3 == "more_r") { sql += "reserva=reserva+"; }
				else if (op3 == "less_r") { sql += "reserva=reserva-"; alta_baja="B";}
				sql += orden.k_plantines + " where id_variedad=" + orden.v_plantin
				sql2 = "insert into Movimientos_stock (id_agente, tipo_operacion, id_variedad, cantidad, descripcion) values ("+req.session.agente.id+", '"+alta_baja+"', "+orden.v_plantin+", "+orden.k_plantines+", 'modificacion directa de stock')";
				}
				
			

			try {
				const value = await lib.insert_blank([sql, sql2]);
				console.log("value\nrtas 1y2: "+value.s_rta);
				res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", req.session.agente));
			} catch (error) {
				res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>");
				}

		}

	}
	else { res.redirect("/"); }  //not logged
});





//agents dashboard (segun el tipo de agente muestra distintas opciones).
app.get('/tablero', async function (req, res) {
	const p_offsets={abiertas:req.query.of_abiertas || '0', cerradas:req.query.of_cerradas || '0', canceladas:req.query.of_canceladas || '0'};
	const op = req.query.op || '', op2 = req.query.op2 || '', id_orden= req.query.id_orden || '1';
	const agente=new clases.Agente(req.query.id_agente || '', req.query.nom_agente || '', req.query.ape_agente || '', req.query.tipo_agente || 'u', req.query.ubicacion || '', req.query.ubic_comp || '', 
		req.query.cuit_agente || '', req.query.user || '', req.query.nacimiento || '01/01/2001', req.query.domicilio || '', req.query.email || '', req.query.celular || '');
	let rta = "<!DOCTYPE html><html lang='es'><head>";
	if (!req.session.logged || (req.session.agente.id != agente.id && req.session.agente.tipo.toLowerCase() != 'a')) {
		rta += "\n <meta http-equiv='refresh' content='2; url=/'></head> \n<body><h1>ZONA PROHIBIDA</h1></body></html>";
		res.send(rta);
	}
	else if (op == "ok") {
		let params = { //en parametro op va siempre 'all' x ahora filtrando antes de llamar getOrdenes, tal vez para filtros avanzados cambie, puede ir 'id' si es sobre un agente(con o sin data_agente al principio, y otros valores para filtros)
			op: "all", op2:op2, agente: agente, vec_nogales: app.locals.objs_static.vec_nogales, agente_logged:req.session.agente,
			logged:true, //muestro stocks
			query: "select  o.id_orden, o.valor_plantin, o.cantidad_plantines, o.valor_orden, o.id_comprador, a.apellido_agente, a.cuit_agente, "+
					"o.id_vendedor, o.con_iva, DATE_FORMAT(o.fecha_entrega, '%d/%m/%Y') fecha_entrega, "+
					"DATE_FORMAT(o.fecha_orden, '%d/%m/%Y') fecha_orden, o.observaciones_orden, estado_orden, o.cierre_vendedor, o.cierre_monto, " +
					"GROUP_CONCAT(CONCAT(do.id_variedad, '_', do.cantidad_variedad) SEPARATOR '|') as detalle, o.senia, o.observaciones_comerciales, "+
					"if (DATE_ADD(CURDATE() , INTERVAL 5 DAY)>=o.fecha_entrega and CURDATE() <= o.fecha_entrega, true, false) as por_vencer, if (CURDATE() > o.fecha_entrega, true, false) as vencida  " +
				" from Ordenes o left join Detalle_orden do on  o.id_orden = do.id_orden, Agentes a "+
				" where a.id_agente=o.id_comprador ", //limit 1000 o filtrar por año de generacion de ordenes para no traer un recordset gigangte
			semaforo:{data_agente: false, ordenes_vendedor:true, ordenes_comprador:true, grid_stock:true, nueva_orden:false},
			id_comprador:agente.id, id_vendedor:req.session.agente.id, offsets:p_offsets 
			};
		// filtros

		if (op2=="data_agente" || req.session.agente.tipo=='u') { //x comprador
			params.op=op2;
			params.query+=" and id_comprador =" + agente.id;
			params.semaforo={data_agente: true, ordenes_vendedor:false, ordenes_comprador:true, grid_stock:false, nueva_orden:(req.session.agente.tipo.toLowerCase()=='a' || req.session.agente.tipo=='v')};
			}
		else if (op2=="data_vendedor") { //x vendedor (caute que pueden ser otros vendedores: admins y viveristas..)
			params.op=op2;
			params.query+=" and id_vendedor =" + agente.id;
			params.semaforo={data_agente: true, ordenes_vendedor:true, ordenes_comprador:false, grid_stock:true, nueva_orden:false};
			}
		else if (op2=="id_orden") {
			params.op=op2;
			params.query+=" and o.id_orden =" + id_orden;
			params.semaforo={data_agente: false, ordenes_vendedor:false, ordenes_comprador:false, grid_stock:true, nueva_orden:false};
			}
			params.query+=" group by o.id_orden order by o.estado_orden, o.fecha_entrega desc limit 1000";
		//console.log("nueva_orden ("+req.session.agente.tipo+"): "+params.semaforo.nueva_orden);

			try {
				const value = await lib.pkn_getOrdenes(params);

				rta = app.locals.objs_static.consts.head + " </head> \n" +
					"<body> \n " +
					app.locals.objs_static.consts.grids_main.header +
					lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) +
					req.session.nav_bar + "</div> \n " +

					"</header><article id='mainArticle'>\n" +//grids_main.article+
					"<div class='grid_main_public'>\n" +//grids_publics.start+
					" <header_flex id='publicHeaderFlex'>\n\n"; //post_nav

				if (params.semaforo.data_agente) {
					rta+="<h2>Datos Personales</h2>\n<br> "+
						"<table style='width:100%; border:2px solid teal; border-radius: 8px; margin-left:5px;'><tbody>"+
						"<tr><td style='height:15px;'></td></tr>"+
						"<tr><td style='width:5%;'></td><td style='background-color: #adff2f7d; display: inline-block;'><div style='padding:5px;'>"+params.agente.nombre+" "+params.agente.apellido+"<button type='button' style='font-size:25px; height:34px; font-size: 25px; vertical-align: sub;' onclick='location.href=\""+clases.Agente.getLinksAgente("abm?op=edit_a", params.agente)+"\"' aria-label='pen'>&#9997;</button></div></td><td>CUIT: "+params.agente.cuit+"</td><td>celular: "+params.agente.celular+"</td><td style='width:5%;'></td></tr>"+
						"<tr><td></td><td>nacimiento: "+params.agente.nacimiento+"</td><td colspan='2'>domicilio: "+params.agente.domicilio+" ("+params.agente.provincia+")</td><td></td></tr>"+
						"<tr><td style='height:15px;'></td></tr> \n</tbody></table><br>";
					}
				rta +="<h2>Ordenes</h2>"+
					"</header_flex><div id='publicArticle'>" +
					value + "<br>\n<br><h2 id='edit_stocks'>Stock</h2>" +
					"<div class='grid_publicaciones_offset'><div class='publicaciones'>";

				try {
					const value = await lib.pkn_getNogales ({ op: "all", query: "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales", logged:req.session.logged });
					vec_variedades = value.vec;
	
					rta += lib_c.get_grid_stocks(vec_variedades) +
	
						"</div> <!--cierro grid_publicaciones de stocks--> </div> <!--cierro grid_publicaciones_offset-->\n" +
						"<br>\n<br><h2 id='movimientos'>Movimientos stock</h2>" +
						"<div class='grid_publicaciones_offset'><div class='publicaciones'>";
					const movs = await lib.pkn_getMovimientos({op:'all'});
					console.log("recibo de getMovimientos: "+movs);
					rta+=movs+
						"<div style='border:2px solid chocolate;'><table width='100%'><tr><td>fede</td><td>mahan: 5</td><td>22/01/2025</td></tr></table></div><div style='border:2px solid green;'>mov6</div>"+
						"</div> <!--cierro grid_publicaciones de movs--> </div> <!--cierro grid_publicaciones_offset-->\n" +
						"</div></div> " +
						"</article>"+
						"<nav id='mainNav'>\n " +//grids_main.nav+
						"</nav><div id='stocks'>\n ";//grids_main.stocks+
	
					rta += "<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'> </div>";
					rta += "</div><footer id='pageFooter'>Footer<br>&#128366;&phi;&malt;&Xopf;&#127963;&1F589;&#270D;&#2695;&#2696;<br>vec_agentes: JSON.stringify (clases.Agente.vec_vendedores)</footer>\n" +//grids_main.footer+
						" \n </body>\n</html>";
					res.send(rta);
					} 
				catch (error) {
					console.log(error);
					res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>");
					}
				} 
			catch (error)  { console.log(error); res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }
	}
	else if (op == "sa") { //buscar agente 
		const busca = req.query.busca_agente || '';
		let op2="";
		if (busca.charAt(2)=='-') {op2="cuit";}
		else if (!isNaN(busca)) {op2="id_orden";}
		else {op2="ape";}
		let params = { op: "sa", query: clases.Agente.getQueryBusca(busca, op2) };
		if (op2=='ape' || op2=='cuit') { 
		
			try {
				const value = await lib.asyncDB_getAgentes(params);

				rta = app.locals.objs_static.consts.head + " </head> \n" +
					"<body> \n " +
					app.locals.objs_static.consts.grids_main.header + 
					lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) +
					req.session.nav_bar + "</div> \n " +
					"</header><article id='mainArticle'>\n" +//grids_main.article+
					"<div class='grid_main_public'>\n" +//grids_publics.start+
					" <header_flex id='publicHeaderFlex'>\n\n"; //post_nav
					//cambia según texto a buscar: nro=>id_orden, segundo char=='-'=> cuit, else apellido

					rta+="<h2>Busqueda Agente</h2>\n </header_flex> \n <div id='publicArticle' >" +
					value +
					"</div> \n\n </div> \n" +
					"</article><nav id='mainNav'>\n </nav> <div id='stocks'>\n " ;

					try {
						const value = await lib.pkn_getNogales({ op: "all", query: "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales", logged:req.session.logged });

						vec_variedades = value.vec;
						rta += "<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'> </div>";
						rta += "</div><footer id='pageFooter'>Footer</footer>\n" +//grids_main.footer+
							" \n </body>\n</html>";
						res.send(rta);

						} 
					catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }
				} 
			catch (error) { res.send(app.locals.objs_static.consts.error + error + "</p>" + app.locals.objs_static.consts.nav_bar.home + "</body></html>"); }
			}
		else{ res.redirect(clases.Agente.getLinksAgente("tablero?op=ok&op2=id_orden&id_orden="+busca, req.session.agente));} //redirect a tablero
	}
	else { res.send("valor de parametro op sin funciones: " + op); }

});




app.listen(lib_c.port, function () {
	console.log('PKN running on port: ' + lib_c.port);
});