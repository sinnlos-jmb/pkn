
const express = require('express');
const { body } = require('express-validator');

const lib_c = require("../consts_pkn");
const lib = require("../funciones_pkn");
const clases = require("../class_ubicaciones");
const handleValidation = require('../middleware/validators');
const { isValidDNI, isValidPastDate } = require('../middleware/customValidators');

const router = express.Router();

// register
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Email must be valid'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('dni').custom(isValidDNI).withMessage('DNI must be 7 or 8 digits'),
  body('birthdate').custom(isValidPastDate).withMessage('Birthdate must be a valid past date'),
  handleValidation
], (req, res) => {
  res.json({ message: '✅ Registered successfully' });
});

// login
router.post('/login', [
  body('user').notEmpty().withMessage('Username is required'),
  body('pwd_usuario').notEmpty().withMessage('Password is required'),
  handleValidation
], async function (req, res)  {
const pwd=req.body.pwd_usuario || '', user=req.body.user || '';
//console.log("consts: "+JSON.stringify(lib_c.consts));
const params = { op: 'login', query: clases.Agente.getQueryLogin(user, pwd) , logged:false}
        try {
            const value = await lib.asyncDB_getAgentes(params);

            if (value.agente != null) {// encontró al usuario.
                //xconsole.log("econtrado!!");
                req.session.logged = true;
                req.session.agente = value.agente;
                let temp_functions = "</ul>";
                const adm=(value.agente.tipo.toLowerCase() == 'a' || value.agente.tipo == 'v');
                if (adm) {
                    temp_functions = lib_c.consts.f_admins;
                }
                if (value.agente.tipo != 'u') { /*agregaba funcion nueva public*/ }
                req.session.functions = temp_functions;
                req.session.nav_bar = "<ul>" + lib_c.consts.nav_bar.home ;
                //dos nav_bars una con los anchors para admins en mitablero
                req.session.nav_bar_mi_t=req.session.nav_bar +" <li class='dropdown'><a href='" + clases.Agente.getLinksAgente("tablero?op=ok", value.agente) + "'>Mi Tablero</a> <div class='dropdown-content'>  "+lib_c.consts.f_admins_mitablero+"</div> </li> \n " + temp_functions;
                req.session.nav_bar +=" <li><a href='" + clases.Agente.getLinksAgente("tablero?op=ok", value.agente) + "'>Mi Tablero</a> </li> " + temp_functions; 
                let temp="tablero?op=ok";
                if (value.agente.tipo=='u'){
                    temp+="&op2=data_agente";
                    }
                res.redirect(clases.Agente.getLinksAgente(temp, value.agente));
            }
            else { 
                console.log("no encontrado!");
                res.redirect("/"); 
                }
            }
        catch (error) { res.send(lib_c.consts.error + error + "</p>" + lib_c.consts.nav_bar.home + "</body></html>"); }


  //res.json({ message: '✅ Login successful' });
});

// profile update
router.put('/profile', [
  body('bio').optional().isLength({ max: 200 }).withMessage('Bio must be under 200 characters'),
  body('birthdate').optional().custom(isValidPastDate).withMessage('Birthdate must be a valid past date'),
  handleValidation
], (req, res) => {
  res.json({ message: '✅ Profile updated' });
});

module.exports = router;
