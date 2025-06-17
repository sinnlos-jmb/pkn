const express = require('express');
require('dotenv').config()
const session = require("express-session");

const lib = require("./funciones_pkn");
const lib_c = require("./consts_pkn");
const clases = require("./class_ubicaciones");

const authRoutes = require('./routes/auth');
const tableroRoute = require('./routes/tablero');
const abmRoute = require('./routes/abm');



///////////////////////////
//////// rutas ////////////
///////////////////////////
var app = express();
let options = { maxAge: '2h', etag: false };  //cambiar a 2d
app.use(express.static('public', options));
app.use(session({ secret: "1234", resave: false, saveUninitialized: false, }));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/api', authRoutes); 
app.use('/tablero', tableroRoute); 
app.use('/abm', abmRoute); 

let vec_variedades = [];



// root
app.get('/', async function (req, res) {
	if (req.session.nav_bar == null) { req.session.nav_bar = '' };
	const pwd=req.query.pwd_usuario || '';

	const agente=new clases.Agente(req.query.id_agente || '', req.query.nom_agente || '', req.query.ape_agente || '', req.query.tipo_agente || 'u', req.query.ubicacion || '', req.query.ubic_comp || '', 
		req.query.cuit_agente || '', req.query.user || '', req.query.nacimiento || '01/01/2001', req.query.domicilio || '', req.query.email || '', req.query.celular || '');
	let params = { op: req.query.op || '', query: '' , logged:true}, rta = "";
	
	//console.log("por invocar pkn_engage()!\ntypeof: "+typeof lib_c.arrays_consts.vec_nogales[1]);
	if (typeof lib_c.arrays_consts.vec_nogales[1] === "undefined") {
	try {
		const value = await lib_c.pkn_engage();
		head = value.consts.head;
		res.redirect('/');
		}
	catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }

	}

	else if (params.op == '') {
		params.op = "all";
		params.query = "SELECT id_variedad, nombre_variedad, stock, reserva from Nogales";
		if (typeof req.session.logged === "undefined") {req.session.logged=false;};
		params.logged=req.session.logged;

		try {
			const value = await lib.pkn_getNogales(params);
				vec_variedades = value.vec;
				rta = lib_c.consts.head + "</head><body>" +
					lib_c.consts.grids_main.header;
				if (!req.session.logged) {
					rta += lib_c.html_form_login;
					is_logged=false;
					}
				else {
					rta += lib_c.get_logout({ nombre: req.session.agente.nombre, apellido: req.session.agente.apellido });
				}
				rta += req.session.nav_bar + "</div> \n " + //cierro div del header.login

					lib_c.consts.grids_main.article + //</header><article id='mainArticle'>
					lib_c.consts.grids_publics.start + // <div class='grid_main_public'> 

					lib_c.consts.grids_publics.post_nav + // <header_flex id='publicHeaderFlex'>
					"</header_flex>" +
					"<div id='publicArticleHome'> <div class='intro' style='text-align: center;'><h2 style='padding-top:0px;'>PKN - gesti&oacute;n</h2><h3>Manejo de stock y registro de actividades</h3>" +
					" <img src='/images/PKN01_min.webp' alt='nogales IA' width='100%'> </div> <div class='links'>";
				let temp_rta = "Debe loguearse para acceder al sistema. ";
				if (req.session.logged) {
					temp_rta = "Bienvenido: " + req.session.agente.nombre + ", " + req.session.agente.apellido;
				}

				rta += temp_rta + "</div> <div class='destacados'>anuncios - recordatorios<br><br>valor plantin: $" + lib_c.consts.valor_plantin + "<br>validez de reservas: " + lib_c.consts.dias_reserva + " dias.</div> " +
					"<div class='new'>noticias</div> <div class='jornadas'>Jornadas - Agenda</div>" +
					"<div class='clima'>clima</div> \n" +
					"</div></div>" + lib_c.consts.grids_main.nav +
					lib_c.consts.grids_main.stocks +
					"<div class='stock_main'>" + value.rta + "</div> <div class='stock_movs'></div>" +
					lib_c.consts.grids_main.footer + " \n </body>\n</html>";

				//res.set('Cache-Control', 'public, max-age=31557600'); // one year
				res.send(rta);
			} //res.status(404).send('Sorry, cant find that');
		catch (error) { res.send(lib_c.consts.error + error + "</body></html>"); }

	}
	else if (params.op == 'logout') {
		req.session.logged = false;
		req.session.nav_bar = "";
		req.session.agente = null;
		res.redirect("/");
	}
	else if (params.op == 'login') {}
},);



app.listen(lib_c.port, function () {
	console.log('PKN running on port: ' + lib_c.port);
});