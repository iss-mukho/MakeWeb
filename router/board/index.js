var express = require('express');
const { connect } = require('http2');
var router = express.Router();
var mysql = require('mysql');
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var board = mysql_odbc.init();


router.get('/list/:page', function(req, res, next) {
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

router.get('/list', function(req,res,next){
    res.redirect('/board/list/1')
})

router.get('/write', function(req,res,next){
    res.render('write.ejs', {title:"게시판 글 쓰기"})
})

router.post('/write', function(req,res,next){
    var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var passwd = req.body.passwd
    var datas = [name,title,content,passwd]

    var sql = "insert into board(name, title, content, regdate, modidate, passwd,hit) values(?,?,?,now(),now(),?,0)";
    board.query(sql,datas, function (err, rows) {
        if (err) console.error("err : " + err);
        res.redirect('/board/list/1');
    });
})

module.exports = router;