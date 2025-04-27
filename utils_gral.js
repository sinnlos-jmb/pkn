const lib_c = require("./consts_pkn");


 //.inserts
   async function insert_log(vec_param) { 
    const conn = await lib_c.get_connection();

    try {
        const r=await conn.query("insert into Logs (ruta, text) values (vec_param.ruta, vec_param.text)");
            rta[i]={query:vec_param[i], affectedRows:r.affectedRows.toString(), insertId:r.insertId.toString()};
            //console.log("rta del query: "+Object.keys(rta[i]));
            }
    catch (err) {console.log("error en funcion insert_blank\n"+err);} 
    finally { 
        if (conn)  await conn.end();
        return {s_rta:JSON.stringify(rta), obj_rta:rta};
        }
   }

module.exports = { insert_log}