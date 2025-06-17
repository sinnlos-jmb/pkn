
const express = require('express');
const { body } = require('express-validator');

const lib_c = require("../consts_pkn");
const lib = require("../funciones_pkn");
const clases = require("../class_ubicaciones");

const router = express.Router();

router.get('/', async function (req, res) {

//router.get('/', isAuthenticated, dashboardController.showDashboard);
//router.get('/stock', isAuthenticated, dashboardController.showStock);
//router.get('/movements', isAuthenticated, dashboardController.showMovements);

	const p_offsets={abiertas:req.query.of_abiertas || '0', cerradas:req.query.of_cerradas || '0', canceladas:req.query.of_canceladas || '0'};
	const op = req.query.op || '', op2 = req.query.op2 || '', id_orden= req.query.id_orden || '1';
	const pag_mov = req.query.pag_mov || 0;
	let agente, rta, cond=true;
	try {
		agente=new clases.Agente (req.query.id_agente || '', req.query.nom_agente || '', req.query.ape_agente || '', req.query.tipo_agente || 'u', req.query.ubicacion || '', req.query.ubic_comp || '', 
		req.query.cuit_agente || '', req.query.user || '', req.query.nacimiento || '01/01/2001', req.query.domicilio || '', req.query.email || '', req.query.celular || '');
		rta = "<!DOCTYPE html><html lang='es'><head>";
		cond=!req.session.logged || (req.session.agente.id != agente.id && (req.session.agente.tipo.toLowerCase() != 'a' && req.session.agente.tipo.toLowerCase() != 'v'));
		}
	catch (er) { 
		const value = await lib.insert_blank(["insert into Logs (ruta, text) values ('tablero - zona prohibida', '"+er.toString()+"')"]);
		const temp= value.obj_rta[0];//.affectedRows;
		console.log("exception detected in /tablero, msg: "+er.toString());
		}
	
	
	if (cond) {
	  rta += "\n <meta http-equiv='refresh' content='2; url=/'></head> \n<body><h1>ZONA PROHIBIDA</h1>";
	  try {
		rta+="agente tipo: "+req.session.agente.tipo;
		//parece que da un error en este bloque: referencial: undefined en req.session.agente.tipo o req.qery.tipo_agentee
	  	}
	catch (er) {
		const value = await lib.insert_blank(["insert into Logs (ruta, text) values ('tablero - zona prohibida II', '"+er.toString().replace(/[^\w\s]/gi, '') +"')"]);
		const temp= value.obj_rta[0].affectedRows;
		console.log("exception detected in /tablero, msg: "+er);
	  }
	  rta+="</body></html>"
	  res.send(rta);
		}

	else if (op == "ok") {
		const adm=(req.session.agente.tipo=='a' || req.session.agente.tipo=='v');
		let params = { 	//en parametro op va siempre 'all' x ahora filtrando antes de llamar getOrdenes, tal vez para filtros avanzados cambie, puede ir 'id' si es sobre un agente(con o sin data_agente al principio, y otros valores para filtros)
			op: "all", op2:op2, agente: agente, vec_nogales: lib_c.arrays_consts.vec_nogales, agente_logged:req.session.agente,
			logged:true, //muestro stocks
			query: "select  o.id_orden, o.valor_plantin, o.cantidad_plantines, o.valor_orden, o.id_comprador, a.apellido_agente, a.cuit_agente, "+
					"o.id_vendedor, o.con_iva, DATE_FORMAT(o.fecha_entrega, '%d/%m/%Y') fecha_entrega, "+
					"DATE_FORMAT(o.fecha_orden, '%d/%m/%Y') fecha_orden, o.observaciones_orden, estado_orden, o.cierre_vendedor, o.cierre_monto, " +
					"GROUP_CONCAT(CONCAT(do.id_variedad, '_', do.cantidad_variedad) SEPARATOR '|') as detalle, o.senia, o.observaciones_comerciales, "+
					"if (DATE_ADD(CURDATE() , INTERVAL 5 DAY)>=o.fecha_entrega and CURDATE() <= o.fecha_entrega, true, false) as por_vencer, if (CURDATE() > o.fecha_entrega, true, false) as vencida  " +
				" from Ordenes o left join Detalle_orden do on  o.id_orden = do.id_orden, Agentes a "+
				" where a.id_agente=o.id_comprador ", //limit 1000 o filtrar por año de generacion de ordenes para no traer un recordset gigangte
			semaforo:{data_agente: false, ordenes_vendedor:true, ordenes_comprador:true, grid_stock:true, nueva_orden:false, stocks_edit:adm, stock_moves:adm},
			id_comprador:agente.id, id_vendedor:req.session.agente.id, offsets:p_offsets 
			};
		// filtros

		if (op2=="data_agente" || req.session.agente.tipo=='u') { //x comprador
			params.op=op2;
			params.query+=" and id_comprador =" + agente.id;
			params.semaforo={data_agente: true, ordenes_vendedor:false, ordenes_comprador:true, grid_stock:false, nueva_orden:(req.session.agente.tipo.toLowerCase()=='a' || req.session.agente.tipo=='v'), stocks_edit:adm, stock_moves:adm};
			}
		else if (op2=="mes_actual") {
			params.op=op2;
			params.query+=" and MONTH (o.fecha_entrega) = MONTH (curdate()) and YEAR (o.fecha_entrega) = YEAR (curdate()) ";
			params.semaforo={data_agente: false, ordenes_vendedor:true, ordenes_comprador:false, grid_stock:true, nueva_orden:false, stocks_edit:adm, stock_moves:adm};
			}
		else if (op2=="data_vendedor") { //x vendedor (caute que pueden ser otros vendedores: admins y viveristas..)
			params.op=op2;
			params.query+=" and id_vendedor =" + agente.id;
			params.semaforo={data_agente: true, ordenes_vendedor:true, ordenes_comprador:false, grid_stock:true, nueva_orden:false, stocks_edit:adm, stock_moves:adm};
			}
		else if (op2=="id_orden") {
			params.op=op2;
			params.query+=" and o.id_orden =" + id_orden;
			params.semaforo={data_agente: false, ordenes_vendedor:false, ordenes_comprador:false, grid_stock:true, nueva_orden:false, stocks_edit:adm, stock_moves:adm};
			}
			params.query+=" group by o.id_orden order by o.estado_orden, o.fecha_entrega desc limit 1000";
		//console.log("nueva_orden ("+req.session.agente.tipo+"): "+params.semaforo.nueva_orden);

			try {
				const value = await lib.pkn_getOrdenes(params);

				rta = lib_c.consts.head + " </head> \n" +
					"<body> \n " +
					lib_c.consts.grids_main.header +
					lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido }) ;
				const adm=(req.session.agente.tipo.toLowerCase() == 'a' || req.session.agente.tipo == 'v');
				if(adm){rta+=req.session.nav_bar_mi_t;}
				else{rta+=req.session.nav_bar;}
				 
				rta+="</div> \n " +

					"</header><article id='mainArticle'>\n" +//grids_main.article+
					"<div class='grid_main_public'>\n" +//grids_publics.start+
					" <header_flex id='publicHeaderFlex'>\n\n"; //post_nav

				if (params.semaforo.data_agente) {
					rta+="<h2>Datos Personales</h2>\n<br> "+
						"<table style='width:100%; border:2px solid teal; border-radius: 8px; margin-left:5px;'><tbody>"+
						"<tr><td style='height:15px;'></td></tr>"+
						"<tr><td style='width:5%;'></td><td style='background-color: #adff2f7d; display: inline-block;'><div style='padding:5px;'>"+params.agente.nombre+" "+params.agente.apellido+" <a href='"+clases.Agente.getLinksAgente("abm?op=edit_a", params.agente)+"'><img src='/images/edit_doc.png' alt='editar agente' style='vertical-align: bottom;'></a></div></td><td>CUIT: "+params.agente.cuit+"</td><td>celular: "+params.agente.celular+"</td><td style='width:5%;'></td></tr>"+
						"<tr><td></td><td>nacimiento: "+params.agente.nacimiento+"</td><td colspan='2'>domicilio: "+params.agente.domicilio+" ("+params.agente.provincia+")</td><td></td></tr>"+
						"<tr><td style='height:15px;'></td></tr> \n</tbody></table><br>";
					}
				rta +="<h2>Ordenes</h2>"+
					"</header_flex><div id='publicArticle'>" +
					value + "<br>\n<br> <h2 id='edit_stocks'>Stock</h2>" +
					"<div class='grid_publicaciones_offset'><div class='publicaciones'>";

				try {
					const value = await lib.pkn_getNogales ({ op: "all", query: "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales", logged:req.session.logged });
					vec_variedades = value.vec;
					if (params.semaforo.stocks_edit) {rta += lib_c.get_grid_stocks(vec_variedades) ;}
						
	
					rta+= "</div> <!--cierro grid_publicaciones de stocks--> </div> <!--cierro grid_publicaciones_offset-->\n" +
						"<br>\n<br><h2 id='movimientos'>Movimientos stock</h2>" +
						"<div class='grid_publicaciones_offset'><div class='publicaciones'>";
					const movs = await lib.pkn_getMovimientos({op:'all', vec_nogales: lib_c.arrays_consts.vec_nogales, pag:pag_mov});
					if (params.semaforo.stock_moves){rta+=movs.rta_html+"</div> ";}

					if (pag_mov>0) { rta+="<div id='prev' style='text-align:center;'><a href='"+clases.Agente.getLinksAgente("tablero?op=ok&pag_mov="+(pag_mov-1), agente)+"#movimientos'><--</a></div>";}
					if (movs.next) { rta+="<div id='nexxt' style='text-align:center;'><a href='"+clases.Agente.getLinksAgente("tablero?op=ok&pag_mov="+(pag_mov+1), agente)+"#movimientos'>--></a></div>";}

					rta+= "<!--cierro grid_publicaciones de movs--> </div> <!--cierro grid_publicaciones_offset-->\n" +
						"</div></div> " +
						"</article>"+
						"<nav id='mainNav'>\n " +//grids_main.nav+
						"</nav><div id='stocks'>\n ";//grids_main.stocks+
	
					rta += "<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'> </div>";
					rta += "</div><footer id='pageFooter'><br>Footer<br></footer>\n" +//grids_main.footer+
						" \n </body>\n</html>";
					res.send(rta);
					} 
				catch (error) {
					console.log(error);
					res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>");
					}
				} 
			catch (error)  { console.log(error); res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }
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

				rta = lib_c.consts.head + " </head> \n" +
					"<body> \n " +
					lib_c.consts.grids_main.header + 
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
					catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }
				} 
			catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }
			}
		else{ res.redirect(clases.Agente.getLinksAgente("tablero?op=ok&op2=id_orden&id_orden="+busca, req.session.agente));} //redirect a tablero
	}
	else { res.send("valor de parametro op sin funciones: " + op); }
});


module.exports = router;