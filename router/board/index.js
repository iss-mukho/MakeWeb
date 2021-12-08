const { WSAECONNRESET } = require('constants');
const e = require('express');
var express = require('express');
const { connect } = require('http2');
var router = express.Router();
var mysql = require('mysql');
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var board = mysql_odbc.init();
var requestIp = require('request-ip');
var videojs = require('video.js')
require('@silvermine/videojs-quality-selector')(videojs);
var multer = require('multer');
var storagepic  = multer.diskStorage({ // 2
    destination(req, file, cb) {
      cb(null, 'assets/picvid/');
    },
    filename(req, file, cb) {    
        cb(null, `${Date.now()}__${file.originalname}`);
    },
  });
var uploadpic = multer({ storage: storagepic });

// 로그용
var logString;
function getTime(){
    var today = new Date();
    var year = today.getFullYear();
    var month = ('0' + (today.getMonth()+1)).slice(-2);
    var day = ('0' + today.getDate()).slice(-2);
    var hour = ('0' + today.getHours()).slice(-2);
    var minute = ('0' + today.getMinutes()).slice(-2);
    var second = ('0' + today.getSeconds()).slice(-2);
    logString = '['+year+'-'+month+'-'+day+' '+hour+':'+minute+':'+second+'] ';
}
// 시간 갱신용
function init(){
    getTime();
    setInterval(getTime, 1000)
}
init()

router.get('/', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 공지사항 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/notice/1')
})

// 공지사항
router.get('/list/notice/:page', function(req, res, next) {
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 공지사항 게시판 접근을 거부했습니다.('+ip+')')
        res.redirect('/board/list/notice/1')
    }
    else{
        var page = req.params.page;
        var sql = "select idx, nickname, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
        "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from notice_board order by idx desc";
        board.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 공지사항 게시판을 보고있습니다.('+ip+')')
            res.render('list.ejs', {'ID':id, 'nickname': nickname, title: '공지사항', rows: rows, page:page, length:rows.length-1, page_num:10, pass:true})
        })
    }
});

router.get('/notice', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 공지사항 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/notice/1')
})

router.get('/list/notice', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 공지사항 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/notice/1')
})

router.get('/write/notice', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 공지사항 글쓰기 시도를 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else{
        var id = req.user.ID;
        var nickname = req.user.nickname;

        var sql_ = 'select type from userdb where ID="'+id+'"';
        board.query(sql_, function(err_, result_){
            if(err_) console.error(err_)

            if(result_[0].type == "운영자"){ // 유저 타입이 운영자인 경우
                var nickname = req.user.nickname;
                console.log(logString+req.user.ID+'('+nickname+') 유저가 공지사항 게시글 작성 중입니다.('+ip+')')
                res.render('write.ejs', {'ID':id, 'nickname': nickname, title:"공지사항 글 쓰기"})
            }
            else{ // 유저 타입이 운영자가 아니면
                var nickname = req.user.nickname;
                console.log(logString+req.user.ID+'('+nickname+') 유저의 공지사항 글쓰기 시도를 거부했습니다.(권한없음 // '+ip+')')
                res.send("<script>alert('권한이 없습니다.');history.back();</script>");
            }
        })
    }
})

router.post('/write/notice', uploadpic.any(), function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var nickname = req.user.nickname // var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var ID = req.user.ID
    var datas = [nickname, title, content, ID]

    var sql = "insert into notice_board(nickname, title, content, regdate, modidate, hit, ID) values(?,?,?,now(),now(),0, ?)";
    board.query(sql, datas, function (err, rows) {
        if (err) console.error("err : " + err);
    });

    var idx_;
    var sql_ = "select max(idx) as idx from notice_board"
    board.query(sql_, function(err, rows){
        if(err) console.error("err : " + err);
        idx_ = rows[0].idx;

        if(!idx_) // 글이 없으면 NULL
            idx_ = 1;

        var piccount=0;
        var vidcount=0;
        for(var i=0; i<req.files.length;i++){
            if(req.files[i].mimetype.slice(0,5) == "image"){
                piccount += 1
            }
            else if(req.files[i].mimetype.slice(0,5) == "video"){
                vidcount += 1
            }
        }
        for(var i=0;i<piccount;i++){
            var sql_picupload = "insert into picvideo(picname, bulletin_id, boardtitle) values(?,?,'notice');"
            var picdata = [req.files.shift().filename, idx_]
            board.query(sql_picupload, picdata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        for(var i=0;i<vidcount;i++){
            var sql_vidupload = "insert into picvideo(vidname, bulletin_id, boardtitle) values(?,?,'notice');"
            var viddata = [req.files.shift().filename, idx_]
            board.query(sql_vidupload, viddata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        
        console.log(logString+req.user.ID+'('+nickname+') 유저가 공지사항 '+idx_+'번 게시글을 작성했습니다.('+ip+')')
        res.redirect('/board/read/notice/'+idx_);
    });
})

router.get('/read/notice/:idx', function(req,res,next){
    var ip = requestIp.getClientIp(req);

    var idx = req.params.idx
    var sql = "select idx, nickname, title, content, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
    "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit, ID from notice_board where idx=?";
    board.query(sql, [idx], function(err,row){
        if(err) console.error(err)

        var id = req.user;
        if(!id){
            console.log(logString+'익명 유저의 공지사항 '+idx+'번 게시물 접근을 거부했습니다.('+ip+')')
            res.redirect('/login')
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            
            // 조회수 증가
            var sql_ = 'update notice_board set hit=hit+1 where idx="'+idx+'"';
            board.query(sql_, function(err, row){
                if(err) console.error(err)
            })

            var sql_comment = "select idx, nickname, comment from notice_comment where bulletin_id =?"
            board.query(sql_comment, [idx], function(err,comment){
                if (err) console.error("err : " + err);
                var sql_picvideo = "select * from picvideo where bulletin_id=? and boardtitle = 'notice'"
                board.query(sql_picvideo, [idx], function(err, picvideos) {
                    if (err) console.error("err : " + err);
                    var picarr = []
                    var vidarr = []
                    for(var i=0; i<picvideos.length; i++){
                        var picadd = "../../../assets/picvid/" + picvideos[i].picname;
                        var vidadd = "../../../assets/picvid/" + picvideos[i].vidname;
                        if(picvideos[i].picname != null){
                            picarr.push(picadd)
                        }
                        if(picvideos[i].vidname != null){
                            vidarr.push(vidadd)
                        }
                    }
                    
                    res.render('read.ejs', {'ID':id, 'nickname': nickname, title:"공지사항 글 상세", 
                        row:row[0], 
                        comment:comment, 
                        comment_length : comment.length, 
                        usernick:req.user.nickname,
                        picarr:picarr,
                        picarr_length:picarr.length,
                        vidarr:vidarr,
                        vidarr_length:vidarr.length
                    })
                })
            })
            console.log(logString+req.user.ID+'('+nickname+') 유저가 공지사항 '+idx+'번 게시글을 보고있습니다.('+ip+')')
        }
    })
})

router.post('/read/notice/commentwrite', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx;
    var nickname = req.user.nickname // var name = req.body.name
    var comment = req.body.comment
    var ID = req.user.ID
    var datas = [ID, nickname, comment, idx]

    var sql = "insert into notice_comment(ID, nickname, comment, bulletin_id) values(?, ?, ?, ?)"
    board.query(sql, datas, function(err,row){
        if (err) console.error("err : " + err);
    })
    console.log(logString+req.user.ID+'('+nickname+') 유저가 공지사항 '+idx+'번 게시물에 댓글을 작성했습니다.('+ip+')')
    res.redirect('/board/read/notice/'+idx);
})

router.post('/read/notice/commentdelete', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idxcomment;
    var idxbulletin = (req.headers.referer).split('/')[6];
    var ID = req.user.ID;
    var datas = [ID, idx]

    var sql = "delete from notice_comment where ID =? and idx=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from notice_comment where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 공지사항 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
                        res.redirect('/board/read/notice/'+idxbulletin)
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 공지사항 '+idxbulletin+'번 글의 '+idx+'번 댓글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('댓글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 공지사항 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
            res.redirect('/board/read/notice/'+idxbulletin)
        }
    })
})

router.post('/update/notice', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var ID = req.user.ID;
    var idx = req.body.idx
    var title = req.body.title
    var content = req.body.content
    var datas = [title, content, idx, ID]

    var sql = "update notice_board set title=?,content=?,modidate=now() where idx =? and ID=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        if(result.affectedRows==0){
            console.log(logString+req.user.ID+'('+req.user.nickname+') 유저의 공지사항 '+idx+'번 게시글 수정을 거부했습니다.(권한없음 // '+ip+')')
            res.send("<script>alert('게시글을 작성한 운영자가 아닙니다.');history.back();</script>")
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 공지사항 '+idx+'번 게시글을 수정했습니다.('+ip+')')
            res.redirect('/board/read/notice/'+idx)
        }
    })
})

router.post('/delete/notice', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx
    var ID = req.user.ID;
    var datas = [idx,ID]

    var sql = "delete from notice_board where idx=? and ID=?"
    board.query(sql,datas, function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from notice_board where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        res.send("<script>alert('게시글이 운영자에 의해 삭제되었습니다.');window.location.href='/board/list/notice/';</script>");
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 공지사항 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 공지사항 '+idx+'번 게시글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('권한이 없습니다.');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var id = req.user.ID;
            var nickname = req.user.nickname;
            res.send("<script>alert('게시글이 삭제되었습니다.');window.location.href='/board/list/notice/';</script>");
            console.log(logString+req.user.ID+'('+nickname+') 유저가 공지사항 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
        }
    })
})

// 작곡가 구인
router.get('/list/composer/:page', function(req, res, next) {
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 작곡가 구인 게시판 접근을 거부했습니다.('+ip+')')
        res.redirect('/board/list/composer/1')
    }
    else{
        var page = req.params.page;
        var sql = "select idx, nickname, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
        "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from composer_board order by idx desc";
        board.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 작곡가 구인 게시판을 보고있습니다.('+ip+')')
            res.render('list.ejs', {'ID':id, 'nickname': nickname, title: '작곡가 구인', rows: rows, page:page, length:rows.length-1,page_num:10,pass:true})
        })
    }
});

router.get('/composer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 작곡가 구인 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/composer/1')
})

router.get('/list/composer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 작곡가 구인 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/composer/1')
})

router.get('/write/composer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 작곡가 구인 글쓰기 시도를 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else{
        var id = req.user.ID;
        var nickname = req.user.nickname;
        console.log(logString+req.user.ID+'('+nickname+') 유저가 작곡가 구인 게시글 작성 중입니다.('+ip+')')
        res.render('write.ejs', {'ID':id, 'nickname': nickname, title:"작곡가 구인 글 쓰기"})
    }
})

router.post('/write/composer', uploadpic.any(), function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var nickname = req.user.nickname // var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var ID = req.user.ID
    var datas = [nickname, title, content, ID]

    var sql = "insert into composer_board(nickname, title, content, regdate, modidate, hit, ID) values(?,?,?,now(),now(),0, ?)";
    board.query(sql, datas, function (err, rows) {
        if (err) console.error("err : " + err);
    });

    var idx_;
    var sql_ = "select max(idx) as idx from composer_board"
    board.query(sql_, function(err, rows){
        if(err) console.error("err : " + err);
        idx_ = rows[0].idx;

        if(!idx_) // 글이 없으면 NULL
            idx_ = 1;

        var piccount=0;
        var vidcount=0;
        for(var i=0; i<req.files.length;i++){
            if(req.files[i].mimetype.slice(0,5) == "image"){
                piccount += 1
            }
            else if(req.files[i].mimetype.slice(0,5) == "video"){
                vidcount += 1
            }
        }
        for(var i=0;i<piccount;i++){
            var sql_picupload = "insert into picvideo(picname, bulletin_id, boardtitle) values(?,?,'composer');"
            var picdata = [req.files.shift().filename, idx_]
            board.query(sql_picupload, picdata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        for(var i=0;i<vidcount;i++){
            var sql_vidupload = "insert into picvideo(vidname, bulletin_id, boardtitle) values(?,?,'composer');"
            var viddata = [req.files.shift().filename, idx_]
            board.query(sql_vidupload, viddata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        
        console.log(logString+req.user.ID+'('+nickname+') 유저가 작곡가 구인 '+idx_+'번 게시글을 작성했습니다.('+ip+')')
        res.redirect('/board/read/composer/'+idx_);
    });
})

router.get('/read/composer/:idx', function(req,res,next){
    var ip = requestIp.getClientIp(req);

    var idx = req.params.idx
    var sql = "select idx, nickname, title, content, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
    "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit, ID from composer_board where idx=?";
    board.query(sql, [idx], function(err,row){
        if(err) console.error(err)

        var id = req.user;
        if(!id){
            console.log(logString+'익명 유저의 작곡가 구인 '+idx+'번 게시물 접근을 거부했습니다.('+ip+')')
            res.redirect('/login')
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            
            // 조회수 증가
            var sql_ = 'update composer_board set hit=hit+1 where idx="'+idx+'"';
            board.query(sql_, function(err, row){
                if(err) console.error(err)
            })

            var sql_comment = "select idx, nickname, comment from composer_comment where bulletin_id =?"
            board.query(sql_comment, [idx], function(err,comment){
                if (err) console.error("err : " + err);
                var sql_picvideo = "select * from picvideo where bulletin_id=? and boardtitle = 'composer'"
                board.query(sql_picvideo, [idx], function(err, picvideos) {
                    if (err) console.error("err : " + err);
                    var picarr = []
                    var vidarr = []
                    for(var i=0; i<picvideos.length; i++){
                        var picadd = "../../../assets/picvid/" + picvideos[i].picname;
                        var vidadd = "../../../assets/picvid/" + picvideos[i].vidname;
                        if(picvideos[i].picname != null){
                            picarr.push(picadd)
                        }
                        if(picvideos[i].vidname != null){
                            vidarr.push(vidadd)
                        }
                    }
                    
                    res.render('read.ejs', {'ID':id, 'nickname': nickname, title:"작곡가 구인 글 상세", 
                        row:row[0], 
                        comment:comment, 
                        comment_length : comment.length, 
                        usernick:req.user.nickname,
                        picarr:picarr,
                        picarr_length:picarr.length,
                        vidarr:vidarr,
                        vidarr_length:vidarr.length
                    })
                })
            })
            console.log(logString+req.user.ID+'('+nickname+') 유저가 작곡가 구인 '+idx+'번 게시글을 보고있습니다.('+ip+')')
        }
    })
})

router.post('/read/composer/commentwrite', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx;
    var nickname = req.user.nickname // var name = req.body.name
    var comment = req.body.comment
    var ID = req.user.ID
    var datas = [ID, nickname, comment, idx]

    var sql = "insert into composer_comment(ID, nickname, comment, bulletin_id) values(?, ?, ?, ?)"
    board.query(sql, datas, function(err,row){
        if (err) console.error("err : " + err);
    })
    console.log(logString+req.user.ID+'('+nickname+') 유저가 작곡가 구인 '+idx+'번 게시물에 댓글을 작성했습니다.('+ip+')')
    res.redirect('/board/read/composer/'+idx);
})

router.post('/read/composer/commentdelete', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idxcomment;
    var idxbulletin = (req.headers.referer).split('/')[6];
    var ID = req.user.ID;
    var datas = [ID, idx]

    var sql = "delete from composer_comment where ID =? and idx=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from ncomposer_comment where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 작곡가 구인 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
                        res.redirect('/board/read/composer/'+idxbulletin)
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 작곡가 구인 '+idxbulletin+'번 글의 '+idx+'번 댓글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('댓글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 작곡가 구인 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
            res.redirect('/board/read/composer/'+idxbulletin)
        }
    })
})

router.post('/update/composer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var ID = req.user.ID;
    var idx = req.body.idx
    var title = req.body.title
    var content = req.body.content
    var datas = [title, content, idx, ID]

    var sql = "update composer_board set title=?,content=?,modidate=now() where idx =? and ID=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        if(result.affectedRows==0){
            console.log(logString+req.user.ID+'('+req.user.nickname+') 유저의 작곡가 구인 '+idx+'번 게시글 수정을 거부했습니다.(권한없음 // '+ip+')')
            res.send("<script>alert('게시글 작성자가 아닙니다.');history.back();</script>")
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 작곡가 구인 '+idx+'번 게시글을 수정했습니다.('+ip+')')
            res.redirect('/board/read/composer/'+idx)
        }
    })
})

router.post('/delete/composer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx
    var ID = req.user.ID;
    var datas = [idx,ID]

    var sql = "delete from composer_board where idx=? and ID=?"
    board.query(sql,datas, function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from composer_board where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        res.send("<script>alert('게시글이 운영자에 의해 삭제되었습니다.');window.location.href='/board/list/composer/';</script>");
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 작곡가 구인 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 작곡가 구인 '+idx+'번 게시글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('게시글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var id = req.user.ID;
            var nickname = req.user.nickname;
            res.send("<script>alert('게시글이 삭제되었습니다.');window.location.href='/board/list/composer/';</script>");
            console.log(logString+req.user.ID+'('+nickname+') 유저가 작곡가 구인 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
        }
    })
})

// 가수 구인
router.get('/list/singer/:page', function(req, res, next) {
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 가수 구인 게시판 접근을 거부했습니다.('+ip+')')
        res.redirect('/board/list/singer/1')
    }
    else{
        var page = req.params.page;
        var sql = "select idx, nickname, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
        "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from singer_board order by idx desc";
        board.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 가수 구인 게시판을 보고있습니다.('+ip+')')
            res.render('list.ejs', {'ID':id, 'nickname': nickname, title: '가수 구인', rows: rows, page:page, length:rows.length-1,page_num:10,pass:true})
        })
    }
});

router.get('/singer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 가수 구인 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/singer/1')
})

router.get('/list/singer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 가수 구인 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/singer/1')
})

router.get('/write/singer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 가수 구인 글쓰기 시도를 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else{
        var id = req.user.ID;
        var nickname = req.user.nickname;
        console.log(logString+req.user.ID+'('+nickname+') 유저가 가수 구인 게시글 작성 중입니다.('+ip+')')
        res.render('write.ejs', {'ID':id, 'nickname': nickname, title:"가수 구인 글 쓰기"})
    }
})

router.post('/write/singer', uploadpic.any(), function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var nickname = req.user.nickname // var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var ID = req.user.ID
    var datas = [nickname, title, content, ID]

    var sql = "insert into singer_board(nickname, title, content, regdate, modidate, hit, ID) values(?,?,?,now(),now(),0, ?)";
    board.query(sql, datas, function (err, rows) {
        if (err) console.error("err : " + err);
    });

    var idx_;
    var sql_ = "select max(idx) as idx from singer_board"
    board.query(sql_, function(err, rows){
        if(err) console.error("err : " + err);
        idx_ = rows[0].idx;

        if(!idx_) // 글이 없으면 NULL
            idx_ = 1;

        var piccount=0;
        var vidcount=0;
        for(var i=0; i<req.files.length;i++){
            if(req.files[i].mimetype.slice(0,5) == "image"){
                piccount += 1
            }
            else if(req.files[i].mimetype.slice(0,5) == "video"){
                vidcount += 1
            }
        }
        for(var i=0;i<piccount;i++){
            var sql_picupload = "insert into picvideo(picname, bulletin_id, boardtitle) values(?,?,'singer');"
            var picdata = [req.files.shift().filename, idx_]
            board.query(sql_picupload, picdata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        for(var i=0;i<vidcount;i++){
            var sql_vidupload = "insert into picvideo(vidname, bulletin_id, boardtitle) values(?,?,'singer');"
            var viddata = [req.files.shift().filename, idx_]
            board.query(sql_vidupload, viddata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        
        console.log(logString+req.user.ID+'('+nickname+') 유저가 가수 구인 '+idx_+'번 게시글을 작성했습니다.('+ip+')')
        res.redirect('/board/read/singer/'+idx_);
    });
})

router.get('/read/singer/:idx', function(req,res,next){
    var ip = requestIp.getClientIp(req);

    var idx = req.params.idx
    var sql = "select idx, nickname, title, content, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
    "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit, ID from singer_board where idx=?";
    board.query(sql, [idx], function(err,row){
        if(err) console.error(err)

        var id = req.user;
        if(!id){
            console.log(logString+'익명 유저의 '+idx+'번 가수 구인 게시물 접근을 거부했습니다.('+ip+')')
            res.redirect('/login')
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            
            // 조회수 증가
            var sql_ = 'update singer_board set hit=hit+1 where idx="'+idx+'"';
            board.query(sql_, function(err, row){
                if(err) console.error(err)
            })

            var sql_comment = "select idx, nickname, comment from singer_comment where bulletin_id =?"
            board.query(sql_comment, [idx], function(err,comment){
                if (err) console.error("err : " + err);
                var sql_picvideo = "select * from picvideo where bulletin_id=? and boardtitle = 'singer'"
                board.query(sql_picvideo, [idx], function(err, picvideos) {
                    if (err) console.error("err : " + err);
                    var picarr = []
                    var vidarr = []
                    for(var i=0; i<picvideos.length; i++){
                        var picadd = "../../../assets/picvid/" + picvideos[i].picname;
                        var vidadd = "../../../assets/picvid/" + picvideos[i].vidname;
                        if(picvideos[i].picname != null){
                            picarr.push(picadd)
                        }
                        if(picvideos[i].vidname != null){
                            vidarr.push(vidadd)
                        }
                    }
                    
                    res.render('read.ejs', {'ID':id, 'nickname': nickname, title:"가수 구인 글 상세", 
                        row:row[0], 
                        comment:comment, 
                        comment_length : comment.length, 
                        usernick:req.user.nickname,
                        picarr:picarr,
                        picarr_length:picarr.length,
                        vidarr:vidarr,
                        vidarr_length:vidarr.length
                    })
                })
            })
            console.log(logString+req.user.ID+'('+nickname+') 유저가 가수 구인 '+idx+'번 게시글을 보고있습니다.('+ip+')')
        }
    })
})

router.post('/read/singer/commentwrite', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx;
    var nickname = req.user.nickname // var name = req.body.name
    var comment = req.body.comment
    var ID = req.user.ID
    var datas = [ID, nickname, comment, idx]

    var sql = "insert into singer_comment(ID, nickname, comment, bulletin_id) values(?, ?, ?, ?)"
    board.query(sql, datas, function(err,row){
        if (err) console.error("err : " + err);
    })
    console.log(logString+req.user.ID+'('+nickname+') 유저가 가수 구인 '+idx+'번 게시물에 댓글을 작성했습니다.('+ip+')')
    res.redirect('/board/read/singer/'+idx);
})

router.post('/read/singer/commentdelete', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idxcomment;
    var idxbulletin = (req.headers.referer).split('/')[6];
    var ID = req.user.ID;
    var datas = [ID, idx]

    var sql = "delete from singer_comment where ID =? and idx=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from nsinger_comment where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 가수 구인 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
                        res.redirect('/board/read/singer/'+idxbulletin)
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 가수 구인 '+idxbulletin+'번 글의 '+idx+'번 댓글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('댓글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 가수 구인 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
            res.redirect('/board/read/singer/'+idxbulletin)
        }
    })
})

router.post('/update/singer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var ID = req.user.ID;
    var idx = req.body.idx
    var title = req.body.title
    var content = req.body.content
    var datas = [title, content, idx, ID]

    var sql = "update singer_board set title=?,content=?,modidate=now() where idx =? and ID=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        if(result.affectedRows==0){
            console.log(logString+req.user.ID+'('+req.user.nickname+') 유저의 가수 구인 '+idx+'번 게시글 수정을 거부했습니다.(권한없음 // '+ip+')')
            res.send("<script>alert('게시글 작성자가 아닙니다.');history.back();</script>")
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 가수 구인 '+idx+'번 게시글을 수정했습니다.('+ip+')')
            res.redirect('/board/read/singer/'+idx)
        }
    })
})

router.post('/delete/singer', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx
    var ID = req.user.ID;
    var datas = [idx,ID]

    var sql = "delete from singer_board where idx=? and ID=?"
    board.query(sql,datas, function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from singer_board where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        res.send("<script>alert('게시글이 운영자에 의해 삭제되었습니다.');window.location.href='/board/list/singer/';</script>");
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 가수 구인 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 가수 구인 '+idx+'번 게시글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('게시글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var id = req.user.ID;
            var nickname = req.user.nickname;
            res.send("<script>alert('게시글이 삭제되었습니다.');window.location.href='/board/list/singer/';</script>");
            console.log(logString+req.user.ID+'('+nickname+') 유저가 가수 구인 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
        }
    })
})

// 자유게시판
router.get('/list/free/:page', function(req, res, next) {
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 자유게시판 접근을 거부했습니다.('+ip+')')
        res.redirect('/board/list/free/1')
    }
    else{
        var page = req.params.page;
        var sql = "select idx, nickname, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
        "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from free_board order by idx desc";
        board.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 자유게시판을 보고있습니다.('+ip+')')
            res.render('list.ejs', {'ID':id, 'nickname': nickname, title: '자유게시판', rows: rows, page:page, length:rows.length-1,page_num:10,pass:true})
        })
    }
});

router.get('/free', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 자유게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/free/1')
})

router.get('/list/free', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 자유게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/free/1')
})

router.get('/write/free', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 자유게시판 글쓰기 시도를 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else{
        var id = req.user.ID;
        var nickname = req.user.nickname;
        console.log(logString+req.user.ID+'('+nickname+') 유저가 자유게시판 게시글 작성 중입니다.('+ip+')')
        res.render('write.ejs', {'ID':id, 'nickname': nickname, title:"자유게시판 글 쓰기"})
    }
})

router.post('/write/free', uploadpic.any(), function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var nickname = req.user.nickname // var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var ID = req.user.ID
    var datas = [nickname, title, content, ID]

    var sql = "insert into free_board(nickname, title, content, regdate, modidate, hit, ID) values(?,?,?,now(),now(),0, ?)";
    board.query(sql, datas, function (err, rows) {
        if (err) console.error("err : " + err);
    });

    var idx_;
    var sql_ = "select max(idx) as idx from free_board"
    board.query(sql_, function(err, rows){
        if(err) console.error("err : " + err);
        idx_ = rows[0].idx;

        if(!idx_) // 글이 없으면 NULL
            idx_ = 1;

        var piccount=0;
        var vidcount=0;
        for(var i=0; i<req.files.length;i++){
            if(req.files[i].mimetype.slice(0,5) == "image"){
                piccount += 1
            }
            else if(req.files[i].mimetype.slice(0,5) == "video"){
                vidcount += 1
            }
        }
        for(var i=0;i<piccount;i++){
            var sql_picupload = "insert into picvideo(picname, bulletin_id, boardtitle) values(?,?,'free');"
            var picdata = [req.files.shift().filename, idx_]
            board.query(sql_picupload, picdata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        for(var i=0;i<vidcount;i++){
            var sql_vidupload = "insert into picvideo(vidname, bulletin_id, boardtitle) values(?,?,'free');"
            var viddata = [req.files.shift().filename, idx_]
            board.query(sql_vidupload, viddata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        
        console.log(logString+req.user.ID+'('+nickname+') 유저가 자유게시판 '+idx_+'번 게시글을 작성했습니다.('+ip+')')
        res.redirect('/board/read/free/'+idx_);
    });
})

router.get('/read/free/:idx', function(req,res,next){
    var ip = requestIp.getClientIp(req);

    var idx = req.params.idx
    var sql = "select idx, nickname, title, content, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
    "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit, ID from free_board where idx=?";
    board.query(sql, [idx], function(err,row){
        if(err) console.error(err)

        var id = req.user;
        if(!id){
            console.log(logString+'익명 유저의 자유게시판 '+idx+'번 게시물 접근을 거부했습니다.('+ip+')')
            res.redirect('/login')
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            
            // 조회수 증가
            var sql_ = 'update free_board set hit=hit+1 where idx="'+idx+'"';
            board.query(sql_, function(err, row){
                if(err) console.error(err)
            })

            var sql_comment = "select idx, nickname, comment from free_comment where bulletin_id =?"
            board.query(sql_comment, [idx], function(err,comment){
                if (err) console.error("err : " + err);
                var sql_picvideo = "select * from picvideo where bulletin_id=? and boardtitle = 'free'"
                board.query(sql_picvideo, [idx], function(err, picvideos) {
                    if (err) console.error("err : " + err);
                    var picarr = []
                    var vidarr = []
                    for(var i=0; i<picvideos.length; i++){
                        var picadd = "../../../assets/picvid/" + picvideos[i].picname;
                        var vidadd = "../../../assets/picvid/" + picvideos[i].vidname;
                        if(picvideos[i].picname != null){
                            picarr.push(picadd)
                        }
                        if(picvideos[i].vidname != null){
                            vidarr.push(vidadd)
                        }
                    }
                    
                    res.render('read.ejs', {'ID':id, 'nickname': nickname, title:"자유게시판 글 상세", 
                        row:row[0], 
                        comment:comment, 
                        comment_length : comment.length, 
                        usernick:req.user.nickname,
                        picarr:picarr,
                        picarr_length:picarr.length,
                        vidarr:vidarr,
                        vidarr_length:vidarr.length
                    })
                })
            })
            console.log(logString+req.user.ID+'('+nickname+') 유저가 자유게시판 '+idx+'번 게시글을 보고있습니다.('+ip+')')
        }
    })
})

router.post('/read/free/commentwrite', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx;
    var nickname = req.user.nickname // var name = req.body.name
    var comment = req.body.comment
    var ID = req.user.ID
    var datas = [ID, nickname, comment, idx]

    var sql = "insert into free_comment(ID, nickname, comment, bulletin_id) values(?, ?, ?, ?)"
    board.query(sql, datas, function(err,row){
        if (err) console.error("err : " + err);
    })
    console.log(logString+req.user.ID+'('+nickname+') 유저가 자유게시판 '+idx+'번 게시물에 댓글을 작성했습니다.('+ip+')')
    res.redirect('/board/read/free/'+idx);
})

router.post('/read/free/commentdelete', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idxcomment;
    var idxbulletin = (req.headers.referer).split('/')[6];
    var ID = req.user.ID;
    var datas = [ID, idx]

    var sql = "delete from free_comment where ID =? and idx=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from nfree_comment where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 자유게시판 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
                        res.redirect('/board/read/free/'+idxbulletin)
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 자유게시판 '+idxbulletin+'번 글의 '+idx+'번 댓글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('댓글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 자유게시판 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
            res.redirect('/board/read/free/'+idxbulletin)
        }
    })
})

router.post('/update/free', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var ID = req.user.ID;
    var idx = req.body.idx
    var title = req.body.title
    var content = req.body.content
    var datas = [title, content, idx, ID]

    var sql = "update free_board set title=?,content=?,modidate=now() where idx =? and ID=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        if(result.affectedRows==0){
            console.log(logString+req.user.ID+'('+req.user.nickname+') 유저의 자유게시판 '+idx+'번 게시글 수정을 거부했습니다.(권한없음 // '+ip+')')
            res.send("<script>alert('게시글 작성자가 아닙니다.');history.back();</script>")
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 자유게시판 '+idx+'번 게시글을 수정했습니다.('+ip+')')
            res.redirect('/board/read/free/'+idx)
        }
    })
})

router.post('/delete/free', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx
    var ID = req.user.ID;
    var datas = [idx,ID]

    var sql = "delete from free_board where idx=? and ID=?"
    board.query(sql,datas, function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from free_board where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        res.send("<script>alert('게시글이 운영자에 의해 삭제되었습니다.');window.location.href='/board/list/free/';</script>");
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 자유게시판 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 자유게시판 '+idx+'번 게시글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('게시글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var id = req.user.ID;
            var nickname = req.user.nickname;
            res.send("<script>alert('게시글이 삭제되었습니다.');window.location.href='/board/list/free/';</script>");
            console.log(logString+req.user.ID+'('+nickname+') 유저가 자유게시판 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
        }
    })
})

// 건의사항
router.get('/list/suggestion/:page', function(req, res, next) {
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 건의사항 게시판 접근을 거부했습니다.('+ip+')')
        res.redirect('/board/list/suggestion/1')
    }
    else{
        var page = req.params.page;
        var sql = "select idx, nickname, title, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
        "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit from suggestion_board order by idx desc";
        board.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 건의사항 게시판을 보고있습니다.('+ip+')')
            res.render('list.ejs', {'ID':id, 'nickname': nickname, title: '건의사항', rows: rows, page:page, length:rows.length-1,page_num:10,pass:true})
        })
    }
});

router.get('/suggestion', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 건의사항 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/suggestion/1')
})

router.get('/list/suggestion', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 건의사항 게시판 접근을 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else res.redirect('/board/list/suggestion/1')
})

router.get('/write/suggestion', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var id = req.user;
    if(!id){
        console.log(logString+'익명 유저의 건의사항 글쓰기 시도를 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
    }
    else{
        var id = req.user.ID;
        var nickname = req.user.nickname;
        console.log(logString+req.user.ID+'('+nickname+') 유저가 건의사항 게시글 작성 중입니다.('+ip+')')
        res.render('write.ejs', {'ID':id, 'nickname': nickname, title:"건의사항 글 쓰기"})
    }
})

router.post('/write/suggestion', uploadpic.any(), function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var nickname = req.user.nickname // var name = req.body.name
    var title = req.body.title
    var content = req.body.content
    var ID = req.user.ID
    var datas = [nickname, title, content, ID]

    var sql = "insert into suggestion_board(nickname, title, content, regdate, modidate, hit, ID) values(?,?,?,now(),now(),0, ?)";
    board.query(sql, datas, function (err, rows) {
        if (err) console.error("err : " + err);
    });

    var idx_;
    var sql_ = "select max(idx) as idx from suggestion_board"
    board.query(sql_, function(err, rows){
        if(err) console.error("err : " + err);
        idx_ = rows[0].idx;

        if(!idx_) // 글이 없으면 NULL
            idx_ = 1;

        var piccount=0;
        var vidcount=0;
        for(var i=0; i<req.files.length;i++){
            if(req.files[i].mimetype.slice(0,5) == "image"){
                piccount += 1
            }
            else if(req.files[i].mimetype.slice(0,5) == "video"){
                vidcount += 1
            }
        }
        for(var i=0;i<piccount;i++){
            var sql_picupload = "insert into picvideo(picname, bulletin_id, boardtitle) values(?,?,'suggestion');"
            var picdata = [req.files.shift().filename, idx_]
            board.query(sql_picupload, picdata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        for(var i=0;i<vidcount;i++){
            var sql_vidupload = "insert into picvideo(vidname, bulletin_id, boardtitle) values(?,?,'suggestion');"
            var viddata = [req.files.shift().filename, idx_]
            board.query(sql_vidupload, viddata, function(err,rows) {
                if (err) console.error("err : " + err);
            })
        }
        
        console.log(logString+req.user.ID+'('+nickname+') 유저가 건의사항 '+idx_+'번 게시글을 작성했습니다.('+ip+')')
        res.redirect('/board/read/suggestion/'+idx_);
    });
})

router.get('/read/suggestion/:idx', function(req,res,next){
    var ip = requestIp.getClientIp(req);

    var idx = req.params.idx
    var sql = "select idx, nickname, title, content, date_format(modidate,'%Y-%m-%d %H:%i:%s') modidate, " +
    "date_format(regdate,'%Y-%m-%d %H:%i:%s') regdate, hit, ID from suggestion_board where idx=?";
    board.query(sql, [idx], function(err,row){
        if(err) console.error(err)

        var id = req.user;
        if(!id){
            console.log(logString+'익명 유저의 '+idx+'번 건의사항 게시물 접근을 거부했습니다.('+ip+')')
            res.redirect('/login')
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            
            // 조회수 증가
            var sql_ = 'update suggestion_board set hit=hit+1 where idx="'+idx+'"';
            board.query(sql_, function(err, row){
                if(err) console.error(err)
            })

            var sql_comment = "select idx, nickname, comment from suggestion_comment where bulletin_id =?"
            board.query(sql_comment, [idx], function(err,comment){
                if (err) console.error("err : " + err);
                var sql_picvideo = "select * from picvideo where bulletin_id=? and boardtitle = 'suggestion'"
                board.query(sql_picvideo, [idx], function(err, picvideos) {
                    if (err) console.error("err : " + err);
                    var picarr = []
                    var vidarr = []
                    for(var i=0; i<picvideos.length; i++){
                        var picadd = "../../../assets/picvid/" + picvideos[i].picname;
                        var vidadd = "../../../assets/picvid/" + picvideos[i].vidname;
                        if(picvideos[i].picname != null){
                            picarr.push(picadd)
                        }
                        if(picvideos[i].vidname != null){
                            vidarr.push(vidadd)
                        }
                    }
                    
                    res.render('read.ejs', {'ID':id, 'nickname': nickname, title:"건의사항 글 상세", 
                        row:row[0], 
                        comment:comment, 
                        comment_length : comment.length, 
                        usernick:req.user.nickname,
                        picarr:picarr,
                        picarr_length:picarr.length,
                        vidarr:vidarr,
                        vidarr_length:vidarr.length
                    })
                })
            })
            console.log(logString+req.user.ID+'('+nickname+') 유저가 건의사항 '+idx+'번 게시글을 보고있습니다.('+ip+')')
        }
    })
})

router.post('/read/suggestion/commentwrite', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx;
    var nickname = req.user.nickname // var name = req.body.name
    var comment = req.body.comment
    var ID = req.user.ID
    var datas = [ID, nickname, comment, idx]

    var sql = "insert into suggestion_comment(ID, nickname, comment, bulletin_id) values(?, ?, ?, ?)"
    board.query(sql, datas, function(err,row){
        if (err) console.error("err : " + err);
    })
    console.log(logString+req.user.ID+'('+nickname+') 유저가 건의사항 '+idx+'번 게시물에 댓글을 작성했습니다.('+ip+')')
    res.redirect('/board/read/suggestion/'+idx);
})

router.post('/read/suggestion/commentdelete', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idxcomment;
    var idxbulletin = (req.headers.referer).split('/')[6];
    var ID = req.user.ID;
    var datas = [ID, idx]

    var sql = "delete from suggestion_comment where ID =? and idx=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from nsuggestion_comment where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 건의사항 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
                        res.redirect('/board/read/suggestion/'+idxbulletin)
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 건의사항 '+idxbulletin+'번 글의 '+idx+'번 댓글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('댓글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 건의사항 '+idxbulletin+'번 글에서 '+idx+'번 댓글을 삭제했습니다.('+ip+')')
            res.redirect('/board/read/suggestion/'+idxbulletin)
        }
    })
})

router.post('/update/suggestion', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var ID = req.user.ID;
    var idx = req.body.idx
    var title = req.body.title
    var content = req.body.content
    var datas = [title, content, idx, ID]

    var sql = "update suggestion_board set title=?,content=?,modidate=now() where idx =? and ID=?"
    board.query(sql,datas,function(err,result){
        if(err) console.error(err)
        if(result.affectedRows==0){
            console.log(logString+req.user.ID+'('+req.user.nickname+') 유저의 건의사항 '+idx+'번 게시글 수정을 거부했습니다.(권한없음 // '+ip+')')
            res.send("<script>alert('게시글 작성자가 아닙니다.');history.back();</script>")
        }
        else{
            var id = req.user.ID;
            var nickname = req.user.nickname;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 건의사항 '+idx+'번 게시글을 수정했습니다.('+ip+')')
            res.redirect('/board/read/suggestion/'+idx)
        }
    })
})

router.post('/delete/suggestion', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    var idx = req.body.idx
    var ID = req.user.ID;
    var datas = [idx,ID]

    var sql = "delete from suggestion_board where idx=? and ID=?"
    board.query(sql,datas, function(err,result){
        if(err) console.error(err)
        // 삭제를 요청한 사용자가 작성자가 아닌 경우
        if(result.affectedRows == 0){
            // 운영자세요?
            var sql_ = 'select type from userdb where ID="'+ID+'"';
            board.query(sql_, function(err_, result_){
                if(err_) console.error(err_)

                if(result_[0].type == "운영자"){ // 작성자는 아니나 유저 타입이 운영자인 경우
                    var sqlAdmin = 'delete from suggestion_board where idx="'+idx+'"';
                    board.query(sqlAdmin, function(err__, result__){
                        if(err__) console.error(err__)
                        
                        var nickname = req.user.nickname;
                        res.send("<script>alert('게시글이 운영자에 의해 삭제되었습니다.');window.location.href='/board/list/suggestion/';</script>");
                        console.log(logString+"[Admin] "+req.user.ID+'('+nickname+') 유저가 건의사항 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
                    })
                }
                else{ // 작성자도, 운영자도 아니면
                    var nickname = req.user.nickname;
                    console.log(logString+req.user.ID+'('+nickname+') 유저의 건의사항 '+idx+'번 게시글 삭제를 거부했습니다.(권한없음 // '+ip+')')
                    res.send("<script>alert('게시글 작성자가 아닙니다');history.back();</script>");
                }
            })
        }
        else{ // 작성자인 경우
            var id = req.user.ID;
            var nickname = req.user.nickname;
            res.send("<script>alert('게시글이 삭제되었습니다.');window.location.href='/board/list/suggestion/';</script>");
            console.log(logString+req.user.ID+'('+nickname+') 유저가 건의사항 '+idx+'번 게시글을 삭제했습니다.('+ip+')')
        }
    })
})

module.exports = router;