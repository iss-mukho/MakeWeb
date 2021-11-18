var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로

// main page는 login이 된 상태(세션정보가 있을때만) 접근이 가능하게 하자 -> info에 구현해놓음.
router.get('/', function(req, res){
    var id = req.user;
    if(!id) res.sendFile(path.join(__dirname, "../../public/about.html"))
    if(id){
        var nickname = req.user.nickname;
        console.log(req.user.ID+'('+nickname+') 유저가 about 페이지에서 작업 중입니다.')
        res.render('about.ejs', {'ID': id, 'nickname': nickname});
    }
});

module.exports = router;