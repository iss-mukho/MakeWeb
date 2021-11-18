var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var myinfo = mysql_odbc.init();

router.get('/', function(req, res){
    var id = req.user;
    if(!id) res.sendFile(path.join(__dirname, "../../public/login.html"))
    if(id){
            res.render('chat.ejs', {})
    }
});

module.exports = router;