var express = require('express')
var app = express()
var router = express.Router();

router.get('/', function(req, res){
    console.log(req.user.ID+"("+req.user.nickname+") 유저가 로그아웃합니다.")
    req.logout();
    req.session.save(function(){
        res.redirect('/');
    })
});

module.exports = router;