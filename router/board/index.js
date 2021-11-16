var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var board = mysql_odbc.init();


router.get('/:page', function(req, res, next) {
    var page = req.params.page;
    var sql = "select idx, name, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
    "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate from board";

    board.query(sql, function(err,rows) {
        if (err) console.error("err : " + err);
        var id = req.user;
        if(!id) id = "수정예정"
        res.render('list.ejs', {'ID':id, title: '게시판 리스트', rows: rows})
    })
});

router.get('/', function(req,res,next){
    res.redirect('/board/1')
})

module.exports = router;