var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로

// main page는 login이 된 상태(세션정보가 있을때만) 접근이 가능하게 하자 -> info에 구현해놓음.
router.get('/', function(req, res){
    var id = req.user;
    if(!id) res.sendFile(path.join(__dirname, "../../public/main.html"))
    if(id){
        console.log(req.user, '유저가 작업 중입니다.')
        res.render('main.ejs', {'ID': id});
    }
});

module.exports = router;