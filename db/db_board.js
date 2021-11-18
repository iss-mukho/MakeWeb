var mysql = require('mysql');
var config = require('./db_info').board;

module.exports=function(){
    return{
        init: function(){
            return mysql.createConnection({
                host:'localhost',
                port:3306,
                user:'root',
                password:'',
                database:'singer_composer'
                // host:config.host,
                // port:config.port,
                // user:config.user,
                // password:config.password,
                // database:config.database
            })
        }
    }
}