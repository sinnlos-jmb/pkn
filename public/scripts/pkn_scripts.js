let set_ubicacion=0, visible=false, vec_nn=[], rta='';
 
function fill_deptos (id_prov, include_all) { 
	const dd_deptos=document.getElementById('ubicacion'); dd_deptos.length=0;  
	if (include_all) {
		dd_deptos[0] = new Option('--Todas--', 0);
		}
	for (let i=1; i<vec_deptos_ok.length;i++) { 
		if (vec_deptos_ok[i].prov==id_prov) { 
			dd_deptos[dd_deptos.length] = new Option(vec_deptos_ok[i].nom, i);
			} 
		} 
	}
function setUbic(id_ubic){
	let id_prov=vec_deptos_ok[id_ubic].prov;
	document.getElementById('id_provincia').value=id_prov;
	fill_deptos(id_prov, false);
	document.getElementById('ubicacion').value=id_ubic;
}