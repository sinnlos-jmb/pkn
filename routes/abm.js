
const express = require('express');

const lib_c = require("../consts_pkn");
const lib = require("../funciones_pkn");
const clases = require("../class_ubicaciones");

const router = express.Router();

router.get('/', async function (req, res) {
    //console.log("entro a abm\nlogged? "+req.session.logged+"\nengaged: "+lib_c.consts.engaged);

	const date = new Date();
	if (req.session.logged && lib_c.consts.engaged) {
		let sql = "", sql1 = "", sql2 = "", sql3 = "";
		const op = req.query.op || '*', op2 = req.query.op2 || '*', op3 = req.query.op3 || '*';
        console.log("op: "+op);

		const orden = {
			id: req.query.id_orden || '', agente: req.session.agente || '', k_plantines: req.query.k_plantines || '', v_plantin: req.query.v_plantin || '', v_total: req.query.v_total || '', cuit_comprador: req.query.cuit_agente || '', id_comprador: req.query.id_comprador || '', apellido_comprador: req.query.ape_agente || '',
			fecha_entrega: req.query.fecha_entrega || '', fecha_orden: req.query.fecha_orden || '', id_vendedor: req.query.id_vendedor || '', observaciones: req.query.observaciones || '', estado: req.query.estado_orden || '', con_iva: req.query.con_iva || '0', detalle: req.query.detalle || '',
			valor_plantin: lib_c.consts.valor_plantin, senia: req.query.senia || '', observaciones_c: req.query.observaciones_c || '', cerrar_vendedor: req.query.cerrar_vendedor || '', cerrar_monto: req.query.cerrar_monto || '', cerrar_observaciones: req.query.cerrar_observaciones || '' };

		const agente=new clases.Agente(req.query.id_agente || '', req.query.nom_agente || '', req.query.ape_agente || '', req.query.tipo_agente || 'u', req.query.ubicacion || '', req.query.ubic_comp || '', 
				req.query.cuit_agente || '', req.query.user || '', req.query.nacimiento || '01/01/2001', req.query.domicilio || '', req.query.email || '', req.query.celular || '', req.query.pwd || '');

		let rta = "";

		if (op == "na") { //nuevo agente
			if (req.session.agente.tipo.toLowerCase()=='a') { 
				const o_rta = lib_c.get_form_agente("new_a", agente);
				rta = lib_c.consts.head + "<script>" + clases.Ubicaciones.js_deptos() + " </script>\n </head>\n" +
					"<body>" +
					lib_c.consts.grids_main.header +
					lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) +
					req.session.nav_bar + "</div> \n " +
					"</header><article id='mainArticle'>\n" +//grids_main.article+
					"<div class='grid_main_public'>\n" +//grids_publics.start+
					" <header_flex id='publicHeaderFlex'>\n\n" + //post_nav
					"<h2>Nuevo Agente</h2></header_flex> \n <div id='publicArticle' >" +
					o_rta.inic + lib_c.arrays_consts.opts_provincias + o_rta.final +
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
				catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }
			}
			else {res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", agente));}
		}
		else if (op == "new_a") { //insert nuevo agente

			try {
				const value = await lib.insert_blank([clases.Agente.getQueryInsert(agente)]);
				//console.log("objeto de la rta: JSON.stringify(value.obj_rta[0])):  "+JSON.stringify(value.obj_rta[0]));
				agente.id = value.obj_rta[0].insertId;
				res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", agente));
				}
			catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }

		}
		else if (op == "edit_a") { //editar agente
			if (req.session.agente.tipo.toLowerCase()=='a') { 
				const o_rta = lib_c.get_form_agente("update_a", agente);
				rta = lib_c.consts.head + "<script>" + clases.Ubicaciones.js_deptos() + " </script>\n </head>\n" +
				"<body onload='setUbic("+agente.ubicacion+");'>" +
				lib_c.consts.grids_main.header +
				lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) +
				req.session.nav_bar + "</div> \n " +
				"</header><article id='mainArticle'>\n" +//grids_main.article+
				"<div class='grid_main_public'>\n" +//grids_publics.start+
				" <header_flex id='publicHeaderFlex'>\n\n" + //post_nav
				"<h2>Nuevo Agente</h2></header_flex> \n <div id='publicArticle' >" +
				o_rta.inic + lib_c.arrays_consts.opts_provincias + o_rta.final +
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
				catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }
				}
			else {res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", agente));}
		}
		else if (op == "update_a") {
			try {
				const value = await lib.insert_blank([clases.Agente.getQueryUpdate(agente)]);
				res.redirect(clases.Agente.getLinksAgente("tablero?op=ok&op2=data_agente&affected_rows="+value.obj_rta[0].affectedRows, agente));
				}
			catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }
		}


		else if (op == "nq") {  //nueva orden
			rta = lib_c.consts.head + "\n</head>\n\n " +
				"<body>\n " +
				lib_c.consts.grids_main.header +
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
			catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }
		}
		else if (op == "new_q") {
			sql = "insert into Ordenes (id_vendedor, cantidad_plantines, valor_plantin, valor_orden, observaciones_orden, id_comprador, fecha_entrega, fecha_orden, estado_orden, senia, observaciones_comerciales, con_iva) " +
				" Values (" + orden.id_vendedor + ", " + orden.k_plantines + ", " + orden.v_plantin + ", " + orden.v_total + ", '" + orden.observaciones + "', " + orden.id_comprador + ", STR_TO_DATE('" + orden.fecha_entrega + "', '%d/%m/%Y'), curdate(), '" + orden.estado + "', '" + orden.senia + "', '" + orden.observaciones_c + "', "+orden.con_iva+")";
			let id_new_orden = 0, rta = "<html><head></head><body>",
				sql2 = "insert into Detalle_orden (id_orden, id_variedad, cantidad_variedad) values ",
				sql3 = "INSERT INTO Nogales (id_variedad, reserva) VALUES ", 
				sql4 = "insert into Movimientos_stock (id_agente, tipo_operacion, id_variedad, cantidad, descripcion) values ";
			//console.log("detalle que recibo: "+orden.detalle);
			/*res.send("<html><body><p>falta eliminar detalle orden del orden id e insertar los nuevos</p><p>" + sql + "</p><p>" + sql2 + "</p><p>" + sql3 + "</p><p>" + orden.detalle + "</p><p>" + detalle + "</p><br><br>" + lib_c.get_links_agente("tablero?op=ok", req.session.agente) + "&new_public_id=??</body></html>");*/
			try {
				const value = await lib.insert_blank([sql]);
				id_new_orden = value.obj_rta[0].insertId;
				let detalle = lib_c.splitDetalle(orden.detalle);
				for (let i = 1, prim = true; i < detalle.length; i++) {
					if (detalle[i] != "0") {
						if (prim) { prim = false; }
						else { sql2 += ", "; sql3 += ", "; sql4 += ", "; }
						sql2 += "(" + id_new_orden + ", " + i + ", " + detalle[i] + ")";
						sql3 += "(" + i + ", " + detalle[i] + ")";
						sql4 += "("+req.session.agente.id+", 'B', "+i+", "+detalle[i]+", 'nueva orden: "+id_new_orden+"')";
						}
					}
				sql3 += " ON DUPLICATE KEY UPDATE reserva =reserva+VALUES(reserva), nombre_variedad=nombre_variedad";
				//console.log("triple insert:\nsql2: "+sql2+"\nsql3: "+sql3+"\nsql4: "+sql4);
				try {
					const value = await lib.insert_blank([sql2, sql3, sql4]);
					//console.log("triple insert rtas: "+value.s_rta);
					}
				catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }

					res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", req.session.agente) + "&new_orden_id=" + id_new_orden);
				}
				catch (error) { console.log("sql2: " + sql2); console.log("sql3: " + sql3); console.log("sql4: " + sql4); res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }

			//res.redirect(lib_c.get_links_agente("tablero?op=ok", req.session.agente)+"&new_public_id="+value.insertId);

		}
		else if (op == "edit_q") {
			rta = lib_c.consts.head + "</head>\n\n " +
				"<body>\n " +
				lib_c.consts.grids_main.header +
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
			catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }
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
			let vec_param=[sql];

			let detalle = lib_c.splitDetalle(orden.detalle), vec_sql3_params=[], vec_sql4_params=[];
			for (let i = 1, prim = true; i < detalle.length; i++) {
				if (detalle[i] !== "0") {
					if (prim) { prim = false; }
					else { sql2 += ", "; }
					sql2 += "(" + orden.id + ", " + i + ", " + detalle[i].sum + ")";
					const A_B= parseInt(detalle[i].cant)>0? 'B':'A';
					if (detalle[i].cant!="0"){
						vec_sql4_params.push( "("+req.session.agente.id+", '"+A_B+"', "+detalle[i].id_variedad+", "+detalle[i].cant+", 'edit orden: "+orden.id+"')");
						}
					
					if (detalle[i].reserva0 == "0" ) { vec_sql3_params.push( "(" + i + ", " + detalle[i].sum + ")" ); }
					else if (detalle[i].reserva0 == detalle[i].sum  ) { }
					else { vec_sql3_params.push( "(" + i + ", " + (parseInt(detalle[i].sum) - detalle[i].reserva0) + ")" ); }
				}
			}

			if (vec_sql3_params.length>0) {
				sql4+=vec_sql4_params.join(", ");
				sql3 += vec_sql3_params.join(", ")+" ON DUPLICATE KEY UPDATE reserva =reserva+VALUES(reserva), nombre_variedad=nombre_variedad";
				vec_param=[sql, sql1, sql2, sql3, sql4];
				}
			//else { sql1 = ""; sql3 = ""; sql2 = ""; }
			console.log("vec_param: "+vec_param);

			//**/res.send("<html><body><p>editar orden</p><p>" + sql + "</p><p>sql1: " + sql1 + "</p><p>sql2: " + sql2 + "</p><p>sql3: " + sql3 + "</p><p>vec_detalle: "+detalle+"</p><p>" + orden.detalle + "</p><br><br>" + lib_c.get_links_agente("tablero?op=ok", req.session.agente) + "&new_public_id=??</body></html>");
			try {
				const value =await lib.insert_blank(vec_param);
				//console.log("execution sqls... 1,2,3 y 4: "+value.s_rta);
				res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", req.session.agente));
				}
			catch (error) {
						console.log("execution sqls... 1,2,3 y 4: "+[sql, sql1, sql2, sql3, sql4]+"\nvec_param: "+vec_param);
						res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }

		}
		else if (op == "estado_q") {
			let sql2 = "", sql3="", vec_rta=[]; // actualizo tabla movimientos_stock solo al cancelar y reopen, no al cerrar la orden
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
				sql2 = "INSERT INTO Nogales (id_variedad , stock) values ";
				sql3 = "insert into Movimientos_stock (id_agente, tipo_operacion, id_variedad, cantidad, descripcion) "+
							"values ";

				console.log("orden.detalle: "+orden.detalle);
				detalle = lib_c.splitDetalle(orden.detalle);
				console.log("detalle: "+JSON.stringify(detalle));
				for (let i = 1, prim = true; i < detalle.length; i++) {
					if (detalle[i] != "0") {
						if (prim) { prim = false; }
						else { sql2 += ", "; sql3+=", ";}
						sql2 += "(" + i + ", " + detalle[i] + ")";
						sql3 += "("+req.session.agente.id+", 'A', "+i+", "+detalle[i]+", 'orden cancelada:"+orden.id+"')";
					}
				}
				sql2 += " ON DUPLICATE KEY UPDATE stock=stock+VALUES(stock), nombre_variedad=nombre_variedad";
				vec_rta.push(sql3);
			}
			else if (op2 == "reopen") {
				sql = "update Ordenes set estado_orden='A' where id_orden=" + orden.id;
				sql2 = "INSERT INTO Nogales (id_variedad , stock) values ";
				sql3 = "insert into Movimientos_stock (id_agente, tipo_operacion, id_variedad, cantidad, descripcion) "+
							"values ";
				detalle = lib_c.splitDetalle(orden.detalle);
				for (let i = 1, prim = true; i < detalle.length; i++) {
					if (detalle[i] != "0") {
						if (prim) { prim = false; }
						else { sql2 += ", "; sql3 += ", "; }
						sql2 += "(" + i + ", " + detalle[i] + ")";
						sql3 += "("+req.session.agente.id+", 'B', "+i+", "+detalle[i]+", 'orden reabierta:"+orden.id+"')";
					}
				}
				sql2 += " ON DUPLICATE KEY UPDATE stock=stock-VALUES(stock), nombre_variedad=nombre_variedad";
				vec_rta.push(sql3);
			}

			else if (op2 == "edit_stock") {
				sql = "update Nogales set ";
				let alta_baja="A";
				if (op3 == "more_s") { sql += "stock=stock+"; }
				else if (op3 == "less_s") { sql += "stock=stock-"; alta_baja="B";}
				else if (op3 == "more_r") { sql += "reserva=reserva+"; }
				else if (op3 == "less_r") { sql += "reserva=reserva-"; alta_baja="B";}
				sql += orden.k_plantines + " where id_variedad=" + orden.v_plantin
				sql2 = "insert into Movimientos_stock (id_agente, tipo_operacion, id_variedad, cantidad, descripcion) "+
							"values ("+req.session.agente.id+", '"+alta_baja+"', "+orden.v_plantin+", "+orden.k_plantines+", 'modificacion directa.')";
				}
			
			vec_rta.push(sql);
			vec_rta.push(sql2);
			
			try {
				const value = await lib.insert_blank(vec_rta);
				//console.log("value\nrtas 1y2: "+value.s_rta);
				res.redirect(clases.Agente.getLinksAgente("tablero?op=ok", req.session.agente)+"#edit_stocks");
				}
			catch (error) {
				res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>");
				}

		}

	}
	else { res.redirect("/"); }  //not logged

});

module.exports = router;