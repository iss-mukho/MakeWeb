var express = require('express')
var app = express()
var router = express.Router();
var path = require('path')

var main = require('./main/main')
var register = require('./register/index')
var login = require('./login/index')
var logout = require('./logout/index')
var board = require('./board/index')
var profile = require('./profile/index')
var about = require('./about/index')
var chat = require('./chat/chat')

// URL routing
// req = request, res = respond
router.get('/', function(req, res){
    res.sendFile(path.join(__dirname, "../public/main.html"));
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

module.exports = router;