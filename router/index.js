var express = require('express')
var app = express()
var router = express.Router();
var path = require('path')

var main = require('./main/main')
var register = require('./register/index')
var login = require('./login/index')
var logout = require('./logout/index')

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

module.exports = router;