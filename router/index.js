var express = require('express')
var app = express()
var router = express.Router();
var path = require('path')

var main = require('./main/main')
//var about = require('./about/about')
//var info = require('./info/info')
var form = require('./form/form')
var register = require('./register/index')
var login = require('./login/index')
//var logout = require('./logout/index')

// URL routing
// req = request, res = respond
router.get('/', function(req, res){
    res.sendFile(path.join(__dirname, "../public/main.html"));
});

// router 정의
router.use('/main', main)
//router.use('/about', about)
//router.use('/info', info)
router.use('/form', form)
router.use('/register', register) // login으로 이름 바꿔야됨
//router.use('/join', join) // 회원가입(DB create)
router.use('/login', login)
//router.use('/logout', logout)

module.exports = router;