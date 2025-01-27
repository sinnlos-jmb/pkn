const mariadb = require('mariadb'); //import { createPool, createConnection } from 'mariadb';
const lib = require("./funciones_pkn");
const clases = require("./class_ubicaciones");

const host_db = process.env.host_db;
const user_db = process.env.user_db;
const pwd_db = process.env.pwd_db;
const dbase = process.env.dbase;
const pool_size = process.env.pool_size || 2;
const port = process.env.port || 3000;
const valor_plantin = process.env.valor_plantin; //mejor de dbase con otras constantes que pueda editar el admin
const dias_reserva = process.env.dias_reserva;

const js_populate = "\n function populating (nro, k) { let dropdown = document.getElementById('select'+k); dropdown.length =0; if (dropdown.size<2) {dropdown[0] = new Option('Seleccionar categoria', 0);} \n for (let i = 0; i < vec_categs.length; i++) { " +
    "if (Object.values(vec_categs[i])[k]==nro && Object.values(vec_categs[i])[k+1]==null) { dropdown[dropdown.length] = new Option(vec_categs[i].nombre_categoria, vec_categs[i].id);	} } for (let i=k+1; i<6;i++){ document.getElementById('select'+i).length=0; } };",
    js_deptos = "\n function fill_deptos (id_prov, include_all) { const dd_deptos=document.getElementById('ubicacion'); dd_deptos.length=0;  if (include_all) {dd_deptos[0] = new Option('--Todas--', 0);} 	for (let i=1; i<vec_deptos_ok.length;i++) { if (vec_deptos_ok[i].prov==id_prov) { dd_deptos[dd_deptos.length] = new Option(vec_deptos_ok[i].nom, i);} } } \n",
    html_form_login = "<div id='f_login' class='f_login'><form action='/'> \n<label for='user'>Usuario:</label><input type='text' id='user' name='user' class='input1 input_m s_hov'>\n <label for='pwd_usuario'>" +
        "Clave:</label> <input type='password' id='pwd_usuario' name='pwd_usuario' class='input1 input_s s_hov'>\n <input type='hidden' name='op' value='login'> \n<input type='submit' value='OK' class='btn1 s_hov' style='width: 40px'></form> </div>\n";


const pool = mariadb.createPool({
    host: host_db,
    user: user_db,
    password: pwd_db,
    database: dbase,
    connectionLimit: pool_size
});


    function splitDetalle(p_detail) {
        let rta = "0".repeat(12).split("");
        if (p_detail == '') { return rta; }
        let detalle = p_detail.split("|");
        for (let i = 0, temp = []; i < detalle.length; i++) {
            temp = detalle[i].split("_");
            if (temp.length > 2) { rta[temp[0]] = { reserva0: temp[2], sum: temp[1], id_variedad:temp[0], cant:temp[3]||0 }; }
            else { rta[temp[0]] = temp[1]; }  //cuando no hay reservas no paso json (habría q revisar)
            }
        return rta;
        }

function get_logout(p_nom) {
    return "\n<a href='/?op=logout' class='name_logout'>" + p_nom.nombre + " " + p_nom.apellido + "</a> ";
}

function get_form_agente(p_op, agente) {  //new_a o update_a
    
    let inic= "<table class='table_forms'><tr><td class='td_form_cols'></td><td>\n  "+
            "<form action='abm'> \n<table><tr><td> <label for='nom_agente'>Nombre:</label> </td><td> <input type='text' id='nom_agente' name='nom_agente' value='" + agente.nombre + "' class='input1 s_hov' required></td></tr>\n " +
    "<tr><td>\n<label for='ape_agente'>Apellido:</label> </td><td>\n <input type='text' id='ape_agente' name='ape_agente' value='" + agente.apellido + "' class='input1 s_hov' required> \n </td></tr>\n" ;
    if (p_op == 'new_a') {
        inic+="<tr><td>\n<label for='user'>Nombre de usuario:</label> </td><td>\n <input type='text' id='user' name='user' class='input1 s_hov' required> \n </td></tr>\n"+ 
            "<tr><td>\n<label for='pwd'>Contraseña:</label> </td><td>\n <input type='password' id='pwd' name='pwd' class='input1 s_hov' required> \n </td></tr>\n"; 
        }

    inic+="<tr><td>\n<label for='nacimiento'>Fecha de nacimiento:</label> </td><td>\n <input type='text' id='nacimiento' name='nacimiento' value='" + agente.nacimiento + "' class='input1 s_hov'></td></tr>\n" +
        "<tr><td>\n<label for='celular'>Celular:</label> </td><td>\n <input type='text' id='celular' name='celular' value='" + agente.celular + "' class='input1 s_hov'></td></tr>\n" +
        "<tr><td>\n<label for='email'>Email:</label> </td><td>\n <input type='text' id='email' name='email' value='" + agente.email + "' class='input1 s_hov'></td></tr>\n" +
        "<tr><td>\n<label for='domicilio'>Domicilio:</label> </td><td>\n <input type='text' id='domicilio' name='domicilio' value='" + agente.domicilio + "' class='input1 input_l s_hov'></td></tr>\n" +
        "<tr><td>\n<label for='id_provincia'>Provincia:</label></td><td>\n <select id='id_provincia' name='id_provincia' onchange='fill_deptos(this.value, false)' class='select1 s_hov'>";
    let final= " </select>\n </td></tr> \n <tr><td><input type='text' id='busca_ubic' name='busca_ubic' class='input1 input_s'> </td> <td><select id='ubicacion' name='ubicacion' class='select1 s_hov'><option value='0'>Localidades</option></select></td></tr>\n" +
        "<tr><td>\n<label for='cuit_agente'>Cuit:</label> </td><td>\n<input type='text' id='cuit_agente' name='cuit_agente' value='" + agente.cuit + "' class='input1 s_hov'></td></tr>\n" +
        "<tr><td>\n<label for='tipo_agente'>Tipo de agente:</label> </td><td>\n <select id='tipo_agente' name='tipo_agente' class='select1 s_hov'><option value='a' ";
    if (agente.tipo.toLowerCase()=='a'){final+="selected";}
    final+=">Administrador</option><option value='v' ";
    if (agente.tipo.toLowerCase()=='v'){final+="selected";}
    final+=">Viverista</option><option value='u' ";
    if (agente.tipo.toLowerCase()=='u'){final+="selected";}
    final+=">Usuario</option></select></td></tr>\n" +
        "<tr><td colspan='2' style='text-align:center; height:60px'> <input type='hidden' id='op' name='op' value='" + p_op + "'> <input type='hidden' id='id_agente' name='id_agente' value='" + agente.id + "'> <input type='submit' value='Guardar' class='btn1 s_hov'>" +
        "</td></tr>\n </table></form>" +
        "<td class='td_form_cols'> </td></tr></table> \n\n"
    return {inic:inic, final:final};
}



function get_form_orden(p_op, orden) {  //new_q o update_q
    let detalle = splitDetalle(orden.detalle);
    
    let rta = "\n<script>let vec_detalles=[" + detalle + "];\n</script>\n\n <table class='table_forms'>"+
        "<tr><td class='td_form_cols'></td><td>\n "+
        "<form action='abm'> \n <table style='border-spacing: 1px;'>" +
        "<tr><td colspan='2' style='height:30px; text-align: center;font-size: larg; border-bottom: 1px solid darkgray; vertical-align: middle;'>Comprador: "+ orden.apellido_comprador+" (cuit: "+orden.cuit_comprador + ")</td></tr>\n " +
        "<tr><td colspan='2' style='height:10px;'></td></tr>\n " +
        "<tr><td> \n <label for='k_plantines'>Cantidad de plantines: </label> </td><td> <input type='text' id='k_plantines' name='k_plantines' class='input1 input_s s_hov' value='" + orden.k_plantines + "'></td></tr>\n " +
        "<tr><td><label for='v_plantin'>Valor por plantin:</label> </td><td><input type='text' id='v_plantin' name='v_plantin' value='" + orden.v_plantin + "' class='input1 input_m s_hov' required>\n </td></tr> \n ";

    if (p_op == 'new_q') {
        rta += "<tr class='tr_variedades'><td> \n Shoshoni: <input type='number' id='1' class='input1 input_s s_hov' value='0'></td> <td>Susses: <input type='number' id='2' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Pawne: <input type='number' id='3' class='input1 input_s s_hov' value='0'></td> <td>Maramec: <input type='number' id='4' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Mahan: <input type='number' id='5' class='input1 input_s s_hov' value='0'></td> <td>Summer: <input type='number' id='6' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Desirable: <input type='number' id='7' class='input1 input_s s_hov' value='0'></td> <td>Ocoone: <input type='number' id='8' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Choctaw: <input type='number' id='9' class='input1 input_s s_hov' value='0'></td> <td>Kiowa: <input type='number' id='10' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Nacono: <input type='number' id='11' class='input1 input_s s_hov' value='0'></td><td></td></tr>";
    }
    else if (p_op == 'update_q') {
        rta += "<tr class='tr_variedades'><td> \n Shoshoni (" + detalle[1] + "): <input type='number' id='1' class='input1 input_s s_hov' value='0'></td> <td>Susses (" + detalle[2] + "): <input type='number' id='2' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Pawne (" + detalle[3] + "): <input type='number' id='3' class='input1 input_s s_hov' value='0'></td> <td>Maramec (" + detalle[4] + "): <input type='number' id='4' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Mahan (" + detalle[5] + "): <input type='number' id='5' class='input1 input_s s_hov' value='0'></td> <td>Summer (" + detalle[6] + "): <input type='number' id='6' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Desirable (" + detalle[7] + "): <input type='number' id='7' class='input1 input_s s_hov' value='0'></td> <td>Ocoone (" + detalle[8] + "): <input type='number' id='8' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Choctaw (" + detalle[9] + "): <input type='number' id='9' class='input1 input_s s_hov' value='0'></td> <td>Kiowa (" + detalle[10] + "): <input type='number' id='10' class='input1 input_s s_hov' value='0'></td></tr>" +
            "<tr class='tr_variedades'><td> \n Nacono (" + detalle[11] + "): <input type='number' id='11' class='input1 input_s s_hov' value='0'></td><td></td></tr>";
    }

    rta += "<tr><td><label for='v_total'>Valor total:</label> </td><td><input type='text' id='v_total' name='v_total' class='input1 input_m s_hov' required value='" + orden.v_total + "'>\n " +
        "<button type='button' id='btn_calc' onclick='let k_plants=0, v_plants=document.getElementById(\"v_plantin\").value, v_total=document.getElementById(\"v_total\"), iva=document.getElementById(\"con_iva\"); " +
        "for (let j=1; j<vec_detalles.length; j++) {k_plants+=parseInt(document.getElementById(j).value)+vec_detalles[j];} document.getElementById(\"k_plantines\").value=k_plants; " +
        "iva.checked?v_total.value=v_plants*k_plants*1.21 : v_total.value=v_plants*k_plants;iva.value=iva.checked'>Calcular</button>"+
        "<input type='checkbox' id='con_iva' name='con_iva' value='"+orden.con_iva+"'";
    if (orden.con_iva=='1') {rta+=" checked";}
    rta+="><label for='con_iva'> IVA?</label></td></tr> \n " +
        "<tr><td> <label for='fecha_orden'>Fecha orden:</label> </td><td> <input type='text' id='fecha' name='fecha_orden' value='" + orden.fecha_orden + "' class='input1 input_m' disabled> \n </td></tr> " +
        "<tr><td> <label for='fecha_entrega'>Fecha entrega:</label> </td><td> <input type='text' id='fecha' name='fecha_entrega' value='" + orden.fecha_entrega + "' class='input1 input_m'> \n </td></tr> " +
        "\n" +
        "<tr><td>\n<label for='senia'>Seña recibida:</label> </td><td>\n <input type='text' name='senia' id='senia' class='input1 input_m' value='" + orden.senia + "'></td></tr>\n" +
        "<tr><td style='vertical-align: top'> <label for='observaciones'>Observaciones:</label></td><td> <textarea id='observaciones' name='observaciones' class='input_area s_hov' style='width:180px; height:60px'> " + orden.observaciones + " </textarea> \n " +
        "<tr><td style='vertical-align: top'> <label for='observaciones_c'>Observaciones<br>comerciales:</label></td><td> <textarea id='observaciones_c' name='observaciones_c' class='input_area s_hov' style='width:180px; height:60px'";
    if (orden.agente.tipo != 'A' && orden.agente.tipo != 'a') { rta += " disabled"; }

    rta += "> " + orden.observaciones_c + " </textarea> \n \n\n "+
        "<input type='hidden' id='id_vendedor' name='id_vendedor' value='" + orden.id_vendedor + "'><input type='hidden' name='id_comprador' value='" + orden.id_comprador + "'><input type='hidden' name='detalle' id='detalle' value=''><input type='hidden' name='estado_orden' value='" + orden.estado + "'>\n" +
        "<input type='hidden' id='op' name='op' value='" + p_op + "'><input type='hidden' id='id_orden' name='id_orden' value='" + orden.id + "'></td></tr>\n" +
        "<tr><td colspan='2' style='text-align:center; height:60px'> <input type='submit' value='Guardar' class='btn1 s_hov' " +
        "onclick='document.getElementById(\"btn_calc\").click(); let rta=\"\"; ";
    if (p_op == 'new_q') { rta += "for (let j=1, input_j; j<vec_detalles.length; j++) {input_j=document.getElementById(j); if (input_j.value!=\"0\") {rta+=j+\"_\"+input_j.value+\"|\";} } "; }
    else if (p_op == 'update_q') { rta += "for (let j=1, input_j, sum; j<vec_detalles.length; j++) {input_j=document.getElementById(j); if (vec_detalles[j]!=\"0\" || input_j.value!=\"0\") {sum=parseInt(input_j.value)+vec_detalles[j]; rta+=j+\"_\"+sum+\"_\"+vec_detalles[j]+\"_\"+input_j.value+\"|\";} } "; }
    rta += "document.getElementById(\"detalle\").value=rta;'> </td> \n</tr>\n"+
            "</table>\n</form>\n<td class='td_form_cols'> </td>\n</tr>\n"+
            "</table> \n\n";
    return rta;
}


function get_grid_stocks(vec_variedades_stock) {  //new_p o update_p
    let rta = "";
    for (let i = 1; i < vec_variedades_stock.length; i++) {
        rta += "<div>" + vec_variedades_stock[i].nom_variedad + ": " + (vec_variedades_stock[i].stock - vec_variedades_stock[i].reserva) + " (disponibles)<br>stock: " + vec_variedades_stock[i].stock + ", reservadas: " + vec_variedades_stock[i].reserva +
            "<br> \n<select id='s" + i + "' class='select1 s_hov'><option value='0'>operacion</option><option value='more_s'>incrementar stock</option><option value='less_s'>decrementar stock</option><option value='more_r'>incrementar reserva</option><option value='less_r'>decrementar reserva</option> </select>\n" +
            "<input type='text' id='v" + i + "' class='input1 input_s s_hov'><button type='button' id='b" + i + "' onclick='let op2=getElementById(\"s" + i + "\").value, val=getElementById(\"v" + i + "\").value; location.href=\"abm?op=estado_q&op2=edit_stock&v_plantin=" + i + "&op3=\"+op2+\"&k_plantines=\"+val+\"\";'>OK</button>\n\n" +
            "</div>"; //id_variedad es i
    }
    return rta;
}

function get_connection() {

    return mariadb.createConnection({
        host: host_db,
        user: user_db,
        password: pwd_db,
        database: dbase
    });
}


//.engage (on_app_start, devuelve objeto con las consts de la app que almaceno en app.locals, siempre accesible)
async function pkn_engage() {
    const grids_main = { //funciones: getHeader, getArticle(params)... organizar tipo pipeline
        header: "<header id='pageHeader'><div class='banner'><table style='table-layout: fixed; width:100%; height:80px;'><tr><td width='2px' height='2px'></td><td width='75px'></td><td></td></tr><tr><td></td>" +
            "<td class='logo'>PKN</td><td></td></tr><tr><td height='20px'></td><td></td><td></td></tr></table></div> <div class='login' id='ordenes_abiertas'>", //id para anchor
        article: "</header><article id='mainArticle'>",
        nav: "</article><nav id='mainNav'>",
        stocks: "</nav><div id='stocks'> ",
        footer: "</div><footer id='pageFooter'>Footer</footer>"
    };
    const grids_publics = {
        start: "<div class='grid_main_public'>",
        post_nav: " <header_flex id='publicHeaderFlex'>",
        post_filter: "</header_flex><article2 id='publicArticle'><div class='grid_publicaciones'>",
        end: "\n </div></article2></div>"
    };

    const head = "<!DOCTYPE html><html lang='es'>\n<head><title>PKN gestion</title> \n<meta name='description' content='PKN - gestion comercial'>\n <link rel='canonical' href='https://www.briques.com.ar'/> \n<meta name='viewport' content='width=device-width'> <link rel='stylesheet' href='/scripts/pkn.css'> <link rel='icon' type='image/x-icon' href='/images/favicon.ico'> \n  <script src='/scripts/pkn_scripts.js'></script> ",
        post_body = "<header id='pageHeader'><h1>Bienvenidos a PKN gestion!</h1></header><article id='mainArticle'   >",
        nav_bar = { home: "<li><a href='/'>Home</a></li>\n", mitablero: "" },
        pag_error = head + "</head><body><h1>Ha ocurrido un error y estamos trabajando en ello!</h1><br><br><p>",
        f_admins_mitablero = "<a href='#ordenes_a'>Ordenes abiertas</a> <a href='#ordenes_c'>Ordenes cerradas</a> <a href='#edit_stocks'>Editar stocks</a> <a href='#movimientos'>Movimientos</a>",
        f_admins = "\n\n<li class='dropdown'> <a href='javascript:void(0)' class='dropbtn'>Funciones</a> <div class='dropdown-content'> <a href='abm?op=na'>Nuevo agente</a> " +
            "  </div>  </li>" +
            "<table class='t_buscador'><tbody> <tr><td class='td_find' style='width:125px'><input type='text' id='busca_agente' class='input_busca'></td> " +
            "<td class='td_find' style='width: 23px;'><a href='javascript:let sa=document.getElementById(\"busca_agente\").value; location=\"/tablero?op=sa&busca_agente=\"+sa+\"\"'> " +
            "<svg width='20px' height='20px' viewBox='0 0 24 24' style='vertical-align:top;'><path d='M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'></path></svg></a>" +
            "</td></tr></tbody></table></ul> ";
    let rta = "", opts_provincias = "<option value='0'>Seleccionar</option>";
    let vec_provs = [], vec_agentes = [], vec_nogales = [], vec_deptos = [];
    try {
        conn = await pool.getConnection();
        let rows = await conn.query("select nombre_provincia, id_provincia from Provincias");
        for (var i in rows) {
            vec_provs[rows[i].id_provincia] = rows[i].nombre_provincia;
            opts_provincias += "<option value='" + rows[i].id_provincia + "'>" + rows[i].nombre_provincia + "</option> ";
        }

        rows = await conn.query("select id_variedad, nombre_variedad from Nogales");
        let j = 0;
        for (var i in rows) {
            vec_nogales[rows[i].id_variedad] = rows[i].nombre_variedad;
        }

        rows = await conn.query("select id_provincia, nombre_ubicacion from Ubicaciones ");
        vec_deptos = [{ prov: 0, nom: "" }];
        j = 1;
        for (var i in rows) {
            vec_deptos[j++] = { prov: rows[i].id_provincia, nom: rows[i].nombre_ubicacion };
        }
        rows = await conn.query(clases.Agente.getQueryVendedores());
        vec_agentes = [];
        for (var i in rows) {
            vec_agentes[vec_agentes.length] = {id: rows[i].id_agente, nombre: rows[i].nombre_agente, apellido:rows[i].apellido_agente, tipo: rows[i].tipo_agente, nom_user:rows[i].usuario };
            }
        clases.Agente.vec_vendedores=vec_agentes;
        console.log("app engaged!");
    }
    catch (err) {
        console.log(err);
    }
    finally {
        if (conn) await conn.release();
        return {
            engaged: true, vec_provincias: vec_provs, vec_deptos: vec_deptos,
            vec_nogales: vec_nogales, opts_provincias: opts_provincias,
            consts: {
                valor_plantin: valor_plantin, dias_reserva: dias_reserva, head: head, nav_bar: nav_bar, error: pag_error, f_admins: f_admins, f_admins_mitablero: f_admins_mitablero, post_body: post_body,
                grids_main: grids_main, grids_publics: grids_publics
            }
        };
    }
}


async function asyncDB_get_vec_deptos(prov) {
    let conn, rta = "[";
    try {
        conn = await pool.getConnection();
        rows = await conn.query("select id_ubicacion, nombre_ubicacion from Ubicaciones where id_provincia=" + prov);
        for (var i in rows) {
            rta += "[" + rows[i].id_ubicacion + ", \"" + rows[i].nombre_ubicacion + "\"], ";
        }
        rta += "[]]";

    } catch (err) {
        console.log(err);
        rta = "error!" + err;
    } finally {
        if (conn) await conn.release();
    }
    return rta;
}





module.exports = {
    port, pool, get_connection, pkn_engage, get_logout, splitDetalle,
    asyncDB_get_vec_deptos, js_populate, js_deptos, html_form_login,
    get_form_agente, get_form_orden, get_grid_stocks
};