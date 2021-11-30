var express = require('express')
var app = express()
var router = express.Router();
var path = require('path')
var requestIp = require('request-ip');

var main = require('./main/main')
var register = require('./register/index')
var login = require('./login/index')
var logout = require('./logout/index')
var board = require('./board/index')
var profile = require('./profile/index')
var about = require('./about/index')
var chat = require('./chat/chat')
var command = require('./command/command')

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

// URL routing
// req = request, res = respond
router.get('/', function(req, res){
    try{
        var ip = requestIp.getClientIp(req);
        var id = req.user;
        if(!id){
            console.log(logString+'익명의 유저가 작업 중입니다.('+ip+')')
            res.sendFile(path.join(__dirname, "../public/main.html"))
        }
        if(id){
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 작업 중입니다.('+ip+')')
            res.render('main.ejs', {'ID': id, 'nickname': nickname});
        }
    }
    catch{
        res.redirect('/main')
    }
});

// router 정의
router.use('/main', main)
router.use('/register', register)
router.use('/login', login)
router.use('/logout', logout)
router.use('/board', board)
router.use('/profile', profile)
router.use('/about', about)
router.use('/chat', chat)
router.use('/command', command)

module.exports = router;