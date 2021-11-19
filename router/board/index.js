const { WSAECONNRESET } = require('constants');
const e = require('express');
var express = require('express');
const { connect } = require('http2');
var router = express.Router();
var mysql = require('mysql');
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var board = mysql_odbc.init();

// 로그용
var today = new Date();
var year = today.getFullYear();
var month = ('0' + (today.getMonth()+1)).slice(-2);
var day = ('0' + today.getDate()).slice(-2);
var hour = ('0' + today.getHours()).slice(-2);
var minute = ('0' + today.getMinutes()).slice(-2);
var second = ('0' + today.getSeconds()).slice(-2);
var logString = '['+year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second+'] ';

router.get('/list/:page', function(req, res, next) {
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 게시판 접근을 거부했습니다.')
        res.redirect('/board/list/1')
    }
    else{
        var page = req.params.page;
        var sql = "select idx, nickname, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
        "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from board order by idx desc";
        board.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 게시판을 보고 있습니다.')
            res.render('list.ejs', {'ID':id, 'nickname': nickname, title: '게시판 리스트', rows: rows, page:page, length:rows.length-1,page_num:10,pass:true})
        })
    }
});

router.get('/list', function(req,res,next){
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 게시판 접근을 거부했습니다.')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/1')
})

router.get('/write', function(req,res,next){
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 글쓰기 시도를 거부했습니다.')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else{
        var id = req.user.ID;
        var nickname = req.user.nickname;
        console.log(logString+req.user.ID+'('+nickname+') 유저가 게시글 작성 중입니다.')
        res.render('write.ejs', {'ID':id, 'nickname': nickname, title:"게시판 글 쓰기"})
    }
})

router.post('/write', function(req,res,next){
    var nickname = req.user.nickname // var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var ID = req.user.ID
    var datas = [nickname, title, content, ID]

    var sql = "insert into board(nickname, title, content, regdate, modidate, hit, ID) values(?,?,?,now(),now(),0, ?)";
    board.query(sql, datas, function (err, rows) {
        if (err) console.error("err : " + err);
    });

    var idx_;
    var sql_ = "select max(idx) as idx from board"
    board.query(sql_, function(err, rows){
        if(err) console.error("err : " + err);
        idx_ = rows[0].idx;

        if(!idx_) // 글이 없으면 NULL
            idx_ = 1;

        console.log(logString+req.user.ID+'('+nickname+') 유저가 '+idx_+'번 게시글을 작성했습니다.')
        res.redirect('/board/read/'+idx_);
    });
})

router.get('/read/:idx', function(req,res,next){
    var idx = req.params.idx
    var sql = "select idx, nickname, title, content, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
    "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit, ID from board where idx=?";
    board.query(sql, [idx], function(err,row){
        if(err) console.error(err)

        var id = req.user;
        if(!id){
            console.log(logString+'익명 유저의 '+idx+'번 게시물 접근을 거부했습니다.')
            res.redirect('/login')
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            
            // 조회수 증가
            var sql_ = 'update board set hit=hit+1 where idx="'+idx+'"';
            board.query(sql_, function(err, row){
                if(err) console.error(err)
            })

            console.log(logString+req.user.ID+'('+nickname+') 유저가 '+idx+'번 게시글을 보고있습니다.')
            res.render('read.ejs', {'ID':id, 'nickname': nickname, title:"글 상세", row:row[0]})
        }
    })
})

router.post('/update', function(req,res,next){
    var ID = req.user.ID;
    var idx = req.body.idx
    var title = req.body.title
    var content = req.body.content
    var datas = [title, content, idx, ID]

    var sql = "update board set title=?,content=?,modidate=now() where idx =? and ID=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        if(result.affectedRows==0){
            console.log(logString+req.user.ID+'('+nickname+') 유저의 '+idx+'번 게시글 수정을 거부했습니다.(권한없음)')
            res.send("<script>alert('게시글 작성자가 아닙니다.');history.back();</script>")
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 '+idx+'번 게시글을 수정했습니다.')
            res.redirect('/board/read/'+idx)
        }
    })
})

router.post('/delete', function(req,res,next){
    var idx = req.body.idx
    var ID = req.user.ID;
    var datas = [idx,ID]

    var sql = "delete from board where idx=? and ID=?"
    board.query(sql,datas, function(err,result){
        if(err) console.error(err)

        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from board where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        res.send("<script>alert('게시글이 운영자에 의해 삭제되었습니다.');window.location.href='/board/list/';</script>");
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 '+idx+'번 게시글을 삭제했습니다.')
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 '+idx+'번 게시글 삭제를 거부했습니다.(권한없음)')
                    res.send("<script>alert('게시글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var id = req.user.ID;
            var nickname = req.user.nickname;
            res.send("<script>alert('게시글이 삭제되었습니다.');window.location.href='/board/list/';</script>");
            console.log(logString+req.user.ID+'('+nickname+') 유저가 '+idx+'번 게시글을 삭제했습니다.')
        }
    })
})

module.exports = router;