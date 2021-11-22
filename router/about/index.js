var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로
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

// main page는 login이 된 상태(세션정보가 있을때만) 접근이 가능하게 하자 -> info에 구현해놓음.
router.get('/', function(req, res){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명의 유저가 about 페이지에서 작업 중입니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/about.html"))
    }
    if(id){
        var nickname = req.user.nickname;
        console.log(logString+req.user.ID+'('+nickname+') 유저가 about 페이지에서 작업 중입니다.('+ip+')')
        res.render('about.ejs', {'ID': id, 'nickname': nickname});
    }
});

module.exports = router;