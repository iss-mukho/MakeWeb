var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로

// 로그용
var today = new Date();
var year = today.getFullYear();
var month = ('0' + (today.getMonth()+1)).slice(-2);
var day = ('0' + today.getDate()).slice(-2);
var hour = ('0' + today.getHours()).slice(-2);
var minute = ('0' + today.getMinutes()).slice(-2);
var second = ('0' + today.getSeconds()).slice(-2);
var logString = '['+year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second+'] ';

// main page는 login이 된 상태(세션정보가 있을때만) 접근이 가능하게 하자 -> info에 구현해놓음.
router.get('/', function(req, res){
    var id = req.user;
    if(!id){
        console.log(logString+'익명의 유저가 작업 중입니다.')
        res.sendFile(path.join(__dirname, "../../public/main.html"))
    }
    if(id){
        var nickname = req.user.nickname;
        console.log(logString+req.user.ID+'('+nickname+') 유저가 작업 중입니다.')
        res.render('main.ejs', {'ID': id, 'nickname': nickname});
    }
});

module.exports = router;