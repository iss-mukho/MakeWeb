var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var myinfo = mysql_odbc.init();
var requestIp = require('request-ip');

// 로그용
var logString;
function getTime(){
    var today = new Date();
    var year = today.getFullYear();
    var month = ('0' + (today.getMonth()+1)).slice(-2);
    var day = ('0' + today.getDate()).slice(-2);
    var hour = ('0' + today.getHours()).slice(-2);
    var minute = ('0' + today.getMinutes()).slice(-2);
    var second = ('0' + today.getSeconds()).slice(-2);
    logString = '['+year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second+'] ';
}
// 시간 갱신용
function init(){
    getTime();
    setInterval(getTime, 1000)
}
init()

router.get('/', function(req, res){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 채팅 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    if(id){
        var nickname = req.user.nickname
        console.log(logString+req.user.ID+'('+nickname+') 유저가 채팅 중입니다.('+ip+')')
        res.render('chat.ejs', {'nickname':nickname})
    }
});

module.exports = router;