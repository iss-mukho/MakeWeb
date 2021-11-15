var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로

router.get('/', function(req, res){
    res.sendFile(path.join(__dirname, "../../public/form.html"))
});

module.exports = router;