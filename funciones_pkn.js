const lib_c = require("./consts_pkn");
const clases = require("./class_ubicaciones");

 //.inserts
 async function asyncDB_insert(p_sql) {
	const conn = await lib_c.get_connection();
	try {
		 const res = await conn.query(p_sql);
		 return res;
		} 
	catch (err) {
		console.log(err);
		rta="error!"+err;
		} 
	finally { if (conn)  await conn.end();  }
   }


 async function asyncDB_insert2(p_sql, p_sql2) { //reformular para n queries con n rtas de las affected rows... registrar operacion en tabla Movimientos_stock
	let sql1=true, sql2=true, rta={rta1:0, rta2:0}, rta1=0, rta2=0;
	if (p_sql2.length==0) {sql2=false;}
	if (p_sql.length==0) {sql1=false;}

	const conn = await lib_c.get_connection();

	try {
		 if (sql1){const res = await conn.query(p_sql); rta1=res.affectedRows;}
		 if (sql2) {const res2= await conn.query(p_sql2); rta2=res2.affectedRows;} 

		rta= {rta1:rta1, rta2:rta2};
		}
	catch (err) {console.log(err);} 
	finally { 
		if (conn)  await conn.end();
		return rta;
		}
   }


// recibe objeto con operacion y query. Carga el objeto agente de la sesion, devuelve tabla html.
 async function asyncDB_getAgentes(p_params) {
    let conn, rta="<table>", agente=new clases.Agente(0, "", "", "", "", "", "", "", "", "", "", "");
	
	if (p_params.op=="all") { res.redirect("/"); }
	else if (p_params.op=="login") {
		let rta="ok";
		try {
			conn=await lib_c.pool.getConnection();
			const rows = await conn.query(p_params.query);
			for (var i in rows) { //(id, nom, ape, tipo, ubic, prov, cuit, user, nacimiento, domicilio, email, celu)
				agente=new clases.Agente(rows[i].id_agente, rows[i].nombre_agente, rows[i].apellido_agente, rows[i].tipo_agente, 
										rows[i].id_ubicacion_agente, clases.Ubicaciones.getUbic(rows[i].id_ubicacion_agente), rows[i].cuit_agente, rows[i].usuario,
										rows[i].fecha_nacimiento_agente, rows[i].domicilio_agente, rows[i].email_agente, rows[i].celular_agente);
				//console.log(agente.ubicacion);
				}
			} 
		catch (err) {
			console.log(err);
			rta="error! "+err;
			} 
		finally {
			if (conn)  await conn.release();
			return {rta:rta, agente:agente};
			}
		}
	else if (p_params.op=="sa") {  //search agente 
		let rta="<table class='table_forms' style='text-align:center;'><tr><th>ID</th><th style='width:225px;'>Nombre</th><th>Tipo</th><th style='width:115px;'>CUIT</th><th style='width:115px;'>Celular</th><th>Editar</th></tr>";
		try {
			conn=await lib_c.pool.getConnection();
			const rows = await conn.query(p_params.query);
			for (var i in rows) {
				agente.id=rows[i].id_agente;
				agente.tipo=rows[i].tipo_agente;
				agente.nombre=rows[i].nombre_agente;
				agente.apellido=rows[i].apellido_agente;
				agente.cuit=rows[i].cuit_agente;
				agente.email=rows[i].email_agente;
				agente.celular=rows[i].celular_agente;
				agente.domicilio=rows[i].domicilio_agente;
				agente.ubicacion=rows[i].id_ubicacion_agente;
				agente.provincia=clases.Ubicaciones.getUbic(agente.ubicacion);
				agente.nacimiento=rows[i].fecha_nacimiento_agente;
				agente.tipo.toLowerCase()=='a'||agente.tipo.toLowerCase()=='v'?op2="data_vendedor":op2="data_agente";
				rta+="<tr><td>"+agente.id+"</td> <td><a href='"+clases.Agente.getLinksAgente("tablero?op=ok&op2="+op2, agente)+"'>"+ agente.nombre+", "+agente.apellido+"</a></td><td>"+agente.tipo+"</td><td>"+agente.cuit+"</td><td>"+agente.celular+"</td><td><a href='"+clases.Agente.getLinksAgente("abm?op=edit_a", agente)+"'>edit</a></td></tr>";
				}
			rta+="\n </table><br>";
			} 
		catch (err) {
			console.log(err);
			rta="error!"+err;
			} 
		finally {
			if (conn)  await conn.release();
			return rta;
			}
		}
   }


 //portal de publicaciones común para todos los tipos de agente se accede a publicaciones según varios filtros
 async function pkn_getNogales(params) {
 let sql="", conds="", conds_p="", conds_m="", vec_variedades=[{id:0, nom_variedad:"", stock:0, reserva:0}];
 if (params.op=='query') {
	console.log("query");
	}
 else if (params.op=='search') {
	console.log("search");
	}
 else if (params.op=='all') {
	sql=params.query;}
 let conn, rta="<div class='title'>Variedades</div>";//<table style='width: 80%; margin-left: 10px; margin-top: 5px; border-collapse: collapse;'><tbody>";
 //console.log("\n SQL portal: \n"+sql);
 try {
	conn=await lib_c.pool.getConnection();
	rows = await conn.query(sql);
	let agente_actual=0, k_agentes=1, id_variedad=1;
	rta+="<div class='items'>";
	for (var i in rows) {
			if (params.logged) {
				rta+="<div class='item_pkn'>"+rows[i].nombre_variedad+": "+(rows[i].stock-rows[i].reserva)+"</div>";
				vec_variedades[id_variedad]={id:id_variedad++, nom_variedad: rows[i].nombre_variedad, stock:rows[i].stock, reserva:rows[i].reserva};
				}
			else {
				rta+="<div class='item_pkn'>"+rows[i].nombre_variedad+"</div>";
				vec_variedades[id_variedad]={id:id_variedad++, nom_variedad: rows[i].nombre_variedad, stock:rows[i].stock, reserva:rows[i].reserva};
				}
			}
	rta+="</div>";
   } catch (err) {
	console.log(err);
	rta="error!"+err;
   } finally { if (conn)  await conn.release(); } //no usar conn.end() porque cierra la conexion en la base... pool.end() sí habría que usar cuando termino la app principal
 return {rta:rta, vec:vec_variedades};
 }
 
  
  // objeto p_params tiene atributos: op y query
  async function pkn_getOrdenes (p_params) { //guardar en variable url hasta &op2= y al click() completar con cerrar o cancelar, después se agregará según el caso cerrar_monto, cerrar_vendedor y cerrar_observaciones
    let conn, rta=" "+
					//"function prn () {alert(id_orden+',index: '+index+', '+document.getElementById('cerrar_vendedor').value+', '+document.getElementById('cerrar_monto').value);}</script>\n"+
					"function prn (indice, op2) {let opp2='c', vec_div=document.getElementById('closing'+indice).children; if (op2==1) {opp2='x'; vec_ordenes[indice].cerrar_monto=0; vec_ordenes[indice].cerrar_vendedor="+p_params.agente.id+"; vec_ordenes[indice].cerrar_observaciones=vec_div[1].value;} else {vec_ordenes[indice].cerrar_monto=vec_div[1].value; vec_ordenes[indice].cerrar_vendedor=vec_div[4].value; vec_ordenes[indice].cerrar_observaciones=vec_div[7].value;} let msg='/abm?op=estado_q&op2='+opp2+'&id_orden='+vec_ordenes[indice].id+'&cerrar_monto='+vec_ordenes[indice].cerrar_monto+'&cerrar_vendedor='+vec_ordenes[indice].cerrar_vendedor+'&cerrar_observaciones='+vec_ordenes[indice].cerrar_observaciones+'&detalle='+vec_ordenes[indice].detail; location.href=msg;}\n"+
					"</script>\n"+
					"<table style='width:100%;'><tbody><tr><td>Ordenes abiertas:</td><td></td><td style='text-align:end;'>"+
					"<select id='s_filtros1' onchange='location.href=this.value;' style='border: 2px solid teal; border-radius: 8px;'><option value='"+clases.Agente.getLinksAgente('tablero?op=ok', p_params.agente_logged)+"'";
	if (p_params.op=='all'){rta+=" selected";}
	rta+=">mostrar todas las ordenes</option><option value='"+clases.Agente.getLinksAgente('tablero?op=ok&op2=data_vendedor', p_params.agente_logged)+"'";
	if (p_params.op=='data_vendedor'){rta+=" selected";}
	rta+=">mostrar mis ordenes</option><option value='inminentes'>mostrar las ordenes por vencer</option><option value='mes_actual'>mostrar las ordenes del mes actual</option>";
	if (p_params.op=='data_agente' || p_params.agente.id!=p_params.agente_logged.id){rta+="<option value='' selected>mostrar las ordenes de un cliente</option>";}
	if (p_params.op=='id_orden'){rta+="<option value='' selected>mostrar una orden</option>";}
	
	rta+="</select> </td></tr></tbody></table>"+
				"<div class='grid_publicaciones_offset'> <div class='publicaciones'>";
	if (p_params.semaforo.nueva_orden) {rta+="<div style='text-align: center; padding-top: 30px;'><button onclick=\"document.location='/abm?op=nq&id_comprador="+p_params.agente.id+"&id_vendedor="+p_params.id_vendedor+"&id_agente="+ p_params.agente.id+"&cuit_agente="+ p_params.agente.cuit+
												"&tipo_agente="+ p_params.agente.tipo+ "&nom_agente="+ p_params.agente.nombre+"&ape_agente="+ p_params.agente.apellido+"'\">Nueva orden</button> </div>";}

	try {
		conn=await lib_c.pool.getConnection();
		const rows = await conn.query(p_params.query);
		const ordenes_pagina=16;
		let offset=p_params.offsets, cont_offset=0, cont_offset_closed=0, first_closed=true, first_canceled=true, rta_js="<script>let k=0, id_orden=0, index=0, msg='', prox, vec_ordenes=[], nro_detalle=0;";
		for (var i in rows) {
			let detail=rows[i].detalle||'';
			if (rows[i].estado_orden=='A') { //abiertas
				if (cont_offset>=offset.abiertas*16 && cont_offset<(+offset.abiertas+1)*16){
				let vec_temp=lib_c.splitDetalle(detail), rta_vec_ordenes="cantidad: "+rows[i].cantidad_plantines+"<br>";
				for  (let i=0; i<vec_temp.length; i++) {
					if (vec_temp[i]!=0) { rta_vec_ordenes+=p_params.vec_nogales[i]+": "+vec_temp[i]+"<br>";}
				}
				rta_js+="vec_ordenes["+i+"]={id:"+rows[i].id_orden+", pag:1, detail:'"+detail+"', detail_html:'"+rta_vec_ordenes+"', vendedor:'', monto:'', "+
						"observaciones:'observaciones: "+ rows[i].observaciones_orden.replaceAll(/\r?\n|\r/g, '')+"<br>obs. comerciales: "+rows[i].observaciones_comerciales.replaceAll(/\r?\n|\r/g, '')+"', "+
						"finance: 'precio: $"+rows[i].valor_plantin+"(x"+rows[i].cantidad_plantines+"), total: $"+(rows[i].valor_plantin*rows[i].cantidad_plantines)+", seña: "+rows[i].senia+", "+
						"fecha orden: "+rows[i].fecha_orden+"'}; \n";
				
				let card_fixed="<tr height='1px'><td width='45%'></td><td width='45%'></td><td width='10%'></td></tr>"+
						"<tr><td colspan='2'>cliente: "+rows[i].apellido_agente+"</td> </tr>"+
						"<tr><td colspan='2'>entrega: "+rows[i].fecha_entrega+"</td> <td rowspan='3' style='vertical-align: bottom;'> <button type='button' onclick='if (vec_ordenes["+i+"].pag==0) {document.getElementById(\"intra_orden"+i+"\").innerHTML=vec_ordenes["+i+"].detail_html;} else if(vec_ordenes["+i+"].pag==1) {document.getElementById(\"intra_orden"+i+"\").innerHTML=vec_ordenes["+i+"].finance;} else if(vec_ordenes["+i+"].pag==2) {document.getElementById(\"intra_orden"+i+"\").innerHTML=vec_ordenes["+i+"].observaciones; vec_ordenes["+i+"].pag=-1;}  vec_ordenes["+i+"].pag++;'>=></button>  </td></tr>"+
						"<tr><td colspan='2'>vendedor: "+clases.Agente.getNomVendedor(rows[i].id_vendedor)+"</td> </tr>"+
						"<tr><td colspan='2'>orden: "+rows[i].id_orden;
				let add_html="";
				if(rows[i].por_vencer) {rta+="<div><table style='background-color:lavender; border-radius: 8px; border: 1px solid chocolate;'>"+card_fixed;}
				else if (rows[i].vencida) {rta+="<div><i><table style='background-color:lightgray; border-radius: 8px;'>"+card_fixed+" (V)"; add_html="</i>";}
				else {rta+="<div><table style='background-color:lavender; border-radius: 8px; border: 1px solid darkseagreen;'>"+card_fixed;}
				rta+="</td></tr></table>"+add_html+" \n <p id='intra_orden"+i+"'> "+rta_vec_ordenes+
					"</p>";
					//"<br><select id='s_detalle' onchange='location.href=this.value' class='select1 s_hov'>"+
				rta+= "<select id='s_detalle' onchange='if (this.value==\"-\") {document.getElementById(\"closing"+i+"\").innerHTML=\"\";} "+
						"else if (this.value==\"c\") { document.getElementById(\"closing"+i+"\").innerHTML=\"<label for=\\\"cerrar_monto\\\">monto final:<br></label><input type=\\\"text\\\" id=\\\"cerrar_monto\\\" class=\\\"input1\\\"><br><label for=\\\"cerrar_vendedor\\\">vendedor:<br></label><select id=\\\"cerrar_vendedor\\\" class=\\\"select1\\\">"+clases.Agente.getOptionVendedores(p_params.agente_logged.id)+"</select><br><label for=\\\"cerrar_observaciones\\\">observaciones:<br></label><textarea id=\\\"cerrar_observaciones\\\" class=\\\"input_area\\\"> </textarea><br><button type=\\\"button\\\" id=\\\"btn_cerrar\\\" onclick=\\\"prn("+i+", 11)\\\">cerrar</button>\"} \n "+
						"else if (this.value==\"x\") { document.getElementById(\"closing"+i+"\").innerHTML=\"<label for=\\\"cerrar_observaciones\\\">observaciones:<br></label><textarea id=\\\"cerrar_observaciones\\\" class=\\\"input_area\\\"> </textarea><br><button type=\\\"button\\\" id=\\\"btn_cerrar\\\" onclick=\\\"prn("+i+", 1)\\\">cerrar</button>\"} "+
						"else if (this.value==\"e\") { location.href=\"/abm?op=edit_q&id_orden="+rows[i].id_orden+"&v_plantin="+rows[i].valor_plantin+"&k_plantines="+rows[i].cantidad_plantines+"&v_total="+rows[i].valor_orden+"&id_comprador="+rows[i].id_comprador+"&cuit_agente="+rows[i].cuit_agente+"&ape_agente="+rows[i].apellido_agente+"&id_vendedor="+rows[i].id_vendedor+"&con_iva="+rows[i].con_iva+"&fecha_entrega="+rows[i].fecha_entrega+"&fecha_orden="+rows[i].fecha_orden+"&estado_orden="+rows[i].estado_orden+"&observaciones="+encodeURI(rows[i].observaciones_orden)+"&observaciones_c="+encodeURI(rows[i].observaciones_comerciales)+"&detalle="+detail+"&senia="+rows[i].senia+"&nombre_vendedor=vendedorx&nombre_comprador=compradorx\";}'>"+ //\n>
//						"<select id='s_detalle' onchange='id_orden="+rows[i].id_orden+"; index="+i+"; details[index]=this.value; if (this.value==\"-\") {document.getElementById(\"closing"+i+"\").innerHTML=\"\";} else { document.getElementById(\"closing"+i+"\").innerHTML=\"<label for=\\\"cerrar_monto\\\">monto final:<br></label><input type=\\\"text\\\" id=\\\"cerrar_monto\\\" class=\\\"input1\\\"><br><label for=\\\"cerrar_vendedor\\\">vendedor:<br></label><input type=\\\"text\\\" id=\\\"cerrar_vendedor\\\" class=\\\"input1\\\"><br><label for=\\\"cerrar_observaciones\\\">observaciones:<br></label><textarea id=\\\"cerrar_observaciones\\\" class=\\\"input_area\\\"> </textarea><br><button type=\\\"button\\\" id=\\\"btn_cerrar\\\" onclick=\\\"prn()\\\">cerrar</button>\"}'>"+
					"<option value='-'>seleccionar accion</option>"+
					//"<option value=\""+lib_c.get_links_agente("abm?op=estado_q&op2=cerrar&id_orden="+rows[i].id_orden+"&detalle="+detail, p_params.agente)+"\">Cerrar OK</option>"+
					"<option value='c'>Cerrar OK</option>"+
					"<option value='x'>Cancelar orden</option>"+
					"<option value='e'>Editar orden</option>"+
//							"<option value=\""+lib_c.get_links_agente("abm?op=estado_q&op2=cancel&id_orden="+rows[i].id_orden+"&detalle="+detail, p_params.agente)+"\">Cancelar orden</option>"+
					"</select> \n "+
					"<br><p id='closing"+i+"'></p>"+
					"</div>";//<br><a href='/abm?op=estado_q&op2=reopen"++"'>Cerrar orden (OK)</a></div>";
				}
			else { } //orden fuera de pagina
			cont_offset++;
			}
			else if (rows[i].estado_orden=='C') {
				if (first_closed) {
					first_closed=false;
					rta+="</div> <div class='offset'>";
					let temp="";
					if (offset.abiertas>0) {rta+="<a href='"+clases.Agente.getLinksAgente("tablero?op=ok"+temp+"&of_abiertas="+(+offset.abiertas-1), p_params.agente)+"'>anterior</a> - ";}
					rta+="offset: "+offset.abiertas;
					if (offset.abiertas<(Math.floor(+cont_offset/16))) {rta+=" - <a href='"+clases.Agente.getLinksAgente("tablero?op=ok"+temp+"&of_abiertas="+(+offset.abiertas+1), p_params.agente)+"'>siguiente</a>";}
	
					rta+="</div></div><br>Ordenes cerradas: <br> <div class='grid_publicaciones_offset'> <div class='publicaciones'>";
					//<div class='grid_publicaciones' style='border: 1px solid grey; background: lightgray; border-radius:8px; padding:5px'>";
					}
				if (cont_offset_closed>=offset.cerradas*16 && cont_offset_closed<(+offset.cerradas+1)*16){
					rta+="<div class='disabled'>"+
						"<a href='/abm?op=estado_q&op2=reopen&id_orden="+rows[i].id_orden+"&detalle="+detail+
						"'>Reabrir orden</a> cantidad: "+rows[i].cantidad_plantines+", precio: "+rows[i].valor_plantin+", fecha orden: "+rows[i].fecha_orden+", estado orden: "+rows[i].estado_orden+", seña: "+rows[i].senia;
					rta+="<br>fecha entrega: "+rows[i].fecha_entrega+
						"<br>detalle: "+detail+"<br>cerrada por: "+rows[i].cierre_vendedor+", monto cierre: "+rows[i].cierre_monto+
						"<br>observaciones: "+rows[i].observaciones_orden+
						"</div>";
					}
				else {}
				cont_offset_closed++;
			}
			else if (rows[i].estado_orden=='X') {
				if (first_canceled) {
					first_canceled=false;
					rta+="</div> <div class='offset'>";
					let temp="";
					if (offset.cerradas>0) {rta+="<a href='"+clases.Agente.getLinksAgente("tablero?op=ok"+temp+"&of_cerradas="+(+offset.cerradas-1), p_params.agente)+"'>anterior</a> - ";}
					rta+="offset: "+offset.cerradas;
					if (offset.cerradas<(Math.floor(+cont_offset_closed/16))) {rta+=" - <a href='"+clases.Agente.getLinksAgente("tablero?op=ok"+temp+"&of_cerradas="+(+offset.cerradas+1), p_params.agente)+"'>siguiente</a>";}
					rta+="</div><br>Ordenes canceladas: <br> <div class='grid_publicaciones' style='border: 1px solid grey; background: lightgray; border-radius:8px; padding:5px'>";
					}
				rta+="<div class='disabled'>"+
					"<a href='/abm?op=estado_q&op2=reopen&id_orden="+rows[i].id_orden+"&detalle="+detail+
					"'>Reabrir orden</a> cantidad: "+rows[i].cantidad_plantines+", precio: "+rows[i].valor_plantin+", fecha orden: "+rows[i].fecha_orden+", estado orden: "+rows[i].estado_orden+", seña: "+rows[i].senia;
				rta+="<br>fecha entrega: "+rows[i].fecha_entrega+"<br>descripcion: "+rows[i].observaciones_orden+
					""+
					"</div>";
				}

			}
		if (first_closed) {rta+="</div><div class='offset'></div>";}
		else if (first_canceled) {rta+="</div><div class='offset'></div>";}
		rta=rta_js+rta+"</div></div>";
		} 
	catch (err) {
		console.log(err);
		rta="error!"+err;
		} 
	finally { if (conn)  await conn.release(); }
	
	return rta;
 }





 module.exports = { asyncDB_getAgentes,  asyncDB_insert,  asyncDB_insert2, pkn_getNogales, pkn_getOrdenes};