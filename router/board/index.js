const { WSAECONNRESET } = require('constants');
const e = require('express');
var express = require('express');
const { connect } = require('http2');
var router = express.Router();
var mysql = require('mysql');
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var board = mysql_odbc.init();


router.get('/list/:page', function(req, res, next) {
    var id = req.user;
    if(!id) res.redirect('/board/list/1')
    else{
        var page = req.params.page;
        var sql = "select idx, name, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
        "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from board";
    
        board.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(req.user.ID+'('+nickname+') 유저가 게시판을 보고 있습니다.')
            res.render('list.ejs', {'ID':id, 'nickname': nickname, title: '게시판 리스트', rows: rows, page:page, length:rows.length-1,page_num:10,pass:true})
        })
    }
});

router.get('/list', function(req,res,next){
    var id = req.user;
    if(!id) res.sendFile(path.join(__dirname, "../../public/login.html"))
    else res.redirect('/board/list/1')
})

router.get('/write', function(req,res,next){
    var id = req.user;
    if(!id) res.sendFile(path.join(__dirname, "../../public/login.html"))
    else{
        var id = req.user.ID;
        var nickname = req.user.nickname;
        console.log(req.user.ID+'('+nickname+') 유저가 게시글 작성 중입니다.')
        res.render('write.ejs', {'ID':id, 'nickname': nickname, title:"게시판 글 쓰기"})
    }
})

router.post('/write', function(req,res,next){
    var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var passwd = req.body.passwd
    var datas = [name,title,content,passwd]

    var id;
    var nickname;
    var sql = "insert into board(name, title, content, regdate, modidate, passwd, hit) values(?,?,?,now(),now(),?,0)";
    board.query(sql,datas, function (err, rows) {
        if (err) console.error("err : " + err);

        id = req.user.ID;
        nickname = req.user.nickname;
    });

    var idx_;
    var sql_ = "select max(idx) as idx from board"
    board.query(sql_, function(err, rows){
        if(err) console.error("err : " + err);
        idx_ = rows[0].idx;

        console.log(req.user.ID+'('+nickname+') 유저가 '+idx_+'번 게시글을 작성했습니다.')
        res.redirect('/board/read/'+idx_);
    });
})

router.get('/read/:idx', function(req,res,next){
    var idx = req.params.idx
    var sql = "select idx, name, title, content, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
    "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from board where idx=?";
    board.query(sql,[idx], function(err,row){
        if(err) console.error(err)

        var id = req.user;
        if(!id) res.redirect('/board/list')
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            
            // 조회수 증가
            var sql_ = 'update board set hit=hit+1 where idx="'+idx+'"';
            board.query(sql_, function(err, row){
                if(err) console.error(err)
            })

            console.log(req.user.ID+'('+nickname+') 유저가 '+idx+'번 게시글을 보고 있습니다.')
            res.render('read.ejs', {'ID':id, 'nickname': nickname, title:"글 상세", row:row[0]})
        }
    })
})

router.post('/update', function(req,res,next){
    var idx = req.body.idx
    var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var passwd = req.body.passwd
    var datas = [name, title, content, idx, passwd]

    var sql = "update board set name = ?,title=?,content=?,modidate=now() where idx =? and passwd=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        if(result.affectedRows==0){
            res.send("<script>alert('패스워드가 일치하지 않습니다.');history.back();</script>")
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(req.user.ID+'('+nickname+') 유저가 '+idx+'번 게시글을 수정했습니다.')
            res.redirect('/board/read/'+idx)
        }
    })
})

router.post('/delete', function(req,res,next){
    var idx = req.body.idx
    var passwd = req.body.passwd
    var datas = [idx,passwd]

    var sql = "delete from board where idx=? and passwd=?"

    board.query(sql,datas, function(err,result){
        if(err) console.error(err)
        if(result.affectedRows == 0){
            res.send("<script>alert('패스워드가 일치하지 않습니다.');history.back();</script>");
        }
        else
        {
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(req.user.ID+'('+nickname+') 유저가 '+idx+'번 게시글을 삭제했습니다.')
            res.redirect('/board/list/');
        }
    })
})

module.exports = router;