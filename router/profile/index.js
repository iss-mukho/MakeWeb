var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var myinfo = mysql_odbc.init();
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var requestIp = require('request-ip');
var multer = require('multer');
var storage  = multer.diskStorage({ // 2
    destination(req, file, cb) {
      cb(null, 'assets/img/');
    },
    filename(req, file, cb) {
      cb(null, `${Date.now()}__${file.originalname}`);
    },
  });
var upload = multer({ storage: storage });

const sharp = require('sharp');
const fs = require('fs');

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

passport.serializeUser(function(user, done){
    console.log(logString+'passport session resave: '+ user.ID + '(' + user.nickname + ')')
    done(null, user)
});
passport.deserializeUser(function(user, done){
    var ID = user.ID;
    var nickname = user.nickname;
    // console.log('passport session get ID: '+ ID + '(' + nickname + ')')
    done(null, {'ID': ID, 'nickname':nickname, 'type': type}); // 세션에서 값을 뽑아서 페이지에 전달하는 역할
})

var searNick;
// main page는 login이 된 상태(세션정보가 있을때만) 접근이 가능하게 하자 -> info에 구현해놓음.
router.get('/', function(req, res){
    var ip = requestIp.getClientIp(req);
    try{
        var id = req.session.passport.user.ID;
        // if(!id){
        //     console.log(logString+'익명 유저의 프로필 접근 시도를 거부했습니다.1')
        //     res.redirect('/login')
        // }

        searNick = req.body.search;

        var sql = "select profilemsg, type, profilepic from userdb where id =?";
    
        myinfo.query(sql,[id],function(err,rows) {
            if (err) console.error("err : " + err);
            var nickname = req.user.nickname;
            var type = rows[0].type;
            var profilemsg = rows[0].profilemsg;
            if(rows[0].profilepic){
                var profilepic = "../assets/img/"+rows[0].profilepic;
            }else{
                var profilepic = "../assets/img/noneprofilepic.png";
            }
            console.log(logString+req.user.ID+'('+nickname+') 유저가 프로필을 보고있습니다.('+ip+')')
            res.render('profile.ejs', {'ID':id, 'nickname':nickname, 'profnickname': nickname, 'type': type, 'profilemsg': profilemsg, 'profilepic':profilepic})
        })
    }
    catch{
        if(!id){
            console.log(logString+'익명 유저의 프로필 접근 시도를 거부했습니다.('+ip+')')
            res.sendFile(path.join(__dirname, "../../public/login.html"))
        }
    }

});

router.post('/', function(req,res){
    var ip = requestIp.getClientIp(req);
    try{
        var id = req.user.ID;
        var searNick;
        searNick = req.body.search;

        var sql = 'select * from userdb where nickname="'+req.body.search+'"';

        myinfo.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            if (rows.length != 0){
                var id = req.user.ID;
                var nickname = req.user.nickname;
                var type = rows[0].type;
                var profilemsg = rows[0].profilemsg;
                var profnickname = rows[0].nickname;
                if(rows[0].profilepic){
                    var profilepic = "../assets/img/"+rows[0].profilepic;
                }else{
                    var profilepic = "../assets/img/noneprofilepic.png";
                }
                console.log(logString+req.user.ID+'('+nickname+') 유저가 프로필 열람 중입니다.('+ip+')')
                res.render('other_profile.ejs', {'ID':id, 'nickname': nickname, 'type':type, 'profilemsg': profilemsg, 'message':'', 'profnickname': profnickname, 'profilepic':profilepic});
            }
            else {
                var id = req.user.ID;
                var nickname = req.user.nickname;
                var profnickname = req.body.profnickname;
                var type = req.body.type;
                var profilemsg = req.body.profilemsg
                var profilepic = req.body.profilepic

                console.log(logString+req.user.ID+'('+nickname+') 유저가 프로필 검색에 실패했습니다.(시도 닉네임: req.body.search // '+ip+')')
                res.render('other_profile.ejs', {'ID':id, 'nickname': nickname, 'profnickname': profnickname, 'type': type, 'profilemsg': profilemsg, 'message':'해당 유저를 찾을 수 없습니다', 'profilepic':profilepic})
            }
        })
    }
    catch{
        if(!id){
            console.log(logString+'익명 유저의 프로필 검색 시도를 거부했습니다.('+ip+')')
        res.sendFile(path.join(__dirname, "../../public/login.html"))
        }
    }
})

router.get('/update', function(req,res){
    var ip = requestIp.getClientIp(req);
    try{
        var id = req.user.ID;
        // if(!id){
        //     console.log(logString+'익명 유저의 프로필 수정 시도를 거부했습니다.')
        //     res.redirect('/login')
        // }

        var sql = 'select profilemsg,type from userdb where id ="'+req.user.ID+'"';

        myinfo.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            var type = rows[0].type;
            var profilemsg = rows[0].profilemsg;
            console.log(logString+req.user.ID+'('+nickname+') 유저가 프로필 수정 중입니다.('+ip+')')
            res.render('profmsgedit.ejs', {'ID':id, 'nickname': nickname, 'type':type, 'profilemsg': profilemsg, 'message':''});
        })
    }
    catch{
        if(!id){
            console.log(logString+'익명 유저의 프로필 수정 시도를 거부했습니다.('+ip+')')
            res.sendFile(path.join(__dirname, "../../public/login.html"))
        }
    }
})

router.post('/update', function(req,res,next){
    var ip = requestIp.getClientIp(req);
    try{
        var id = req.user.ID;
        var profilemsg = req.body.profilemsg;
        var nickname = req.body.nickname;
        var type = req.body.type;
        var datas = [profilemsg, nickname, type, id]

        // 기존 type과 profile만 추출하기 위한 쿼리
        var oldType;
        var oldProfilemsg;

        var subsql = 'select * from userdb where ID="'+id+'"';
        myinfo.query(subsql, function(err, result){
            if(err) console.error(err)

            oldType = result[0].type;
            oldProfilemsg = result[0].profilemsg;
        })

        // 닉네임 중복 거르기
        var sql_ = 'select * from userdb where nickname="'+nickname+'"';
        myinfo.query(sql_, function(err, result){
            if(err) console.error(err)
            // 변경하려는 닉네임이 중복이 아닌 경우 or 닉네임 변경이 없는 수정
            if(!result.length || (result.length && req.user.ID == result[0].ID)){
                // 운영자인 경우 타입을 변경시키지 않고 고정
                if(oldType == '운영자'){
                    type = '운영자'
                    datas[2] = '운영자';
                }
                
                var sql = "update userdb set profilemsg =?, nickname=?, type=? where id =?"
                myinfo.query(sql,datas,function(err,result){
                    if(err) console.error(err)

                    console.log(logString+req.user.ID+'('+req.session.passport.user.nickname+') 유저가 프로필을 수정했습니다.('+ip+')')
                    console.log("  ▷ 변경전: "+id+"("+req.user.nickname+") "+oldType+" // "+oldProfilemsg)
                    req.session.passport.user.nickname = nickname;
                    console.log("  ▶ 변경후: "+id+"("+nickname+") "+type+" // "+profilemsg)
                    res.redirect('/profile');
                })
            }
            else{ // 다른 유저의 닉네임과 중복되는 경우
                console.log(logString+id+" 유저가 중복된 닉네임으로 변경을 시도했습니다.(시도한 닉네임: "+req.body.nickname+" // ("+ip+')')
                res.render('profmsgedit.ejs', {nickname: req.session.passport.user.nickname, profilemsg: oldProfilemsg, message : '중복된 닉네임입니다.'})
            }
        })
    }
    catch{
        if(!id){
            console.log(logString+'익명 유저의 프로필 수정 시도를 거부했습니다.('+ip+')')
            res.sendFile(path.join(__dirname, "../../public/login.html"))
        }
    }
})

router.get('/upload', function(req,res){
    var ip = requestIp.getClientIp(req);
    try{
        var id = req.user.ID;
        var nickname = req.user.nickname;
        console.log(logString+req.user.ID+'('+nickname+') 유저가 프로필 열람 중입니다.('+ip+')')
        if(id) res.render('uploadprof.ejs')
    }
    catch{
        if(!id){
            console.log(logString+'익명 유저의 프로필 사진 업로드 접근 시도를 거부했습니다.('+ip+')')
            res.send("<script>alert('로그인이 필요합니다.');opener.location.href='/login';window.close();</script>");
        }
    }
})

router.post('/upload', upload.single('userfile'), function(req,res){
    var ip = requestIp.getClientIp(req);
    try{
        sharp(req.file.path)  // 압축할 이미지 경로
        .resize({width:500, height:500, position:"left top"})
        .withMetadata()	// 이미지의 exif데이터 유지
        .toBuffer((err, buffer) => {
          if (err) throw err;
          // 압축된 파일 새로 저장(덮어씌우기)
          fs.writeFile(req.file.path, buffer, (err) => {
            if (err) throw err;
          });
        });
        var id = req.user.ID;
        var ip = requestIp.getClientIp(req);
        var profilepic = req.file.filename;
        var datas = [profilepic, id]

        var picName = profilepic.substr(15)
        var sql = "update userdb set profilepic =? where id =?"
        myinfo.query(sql,datas,function(err,result){
            if(err) console.error(err)
            console.log(logString+req.user.ID+'('+req.user.nickname+') 유저가 프로필 사진을 업로드했습니다.(파일명: '+picName+' // '+ip+')')
            res.send("<script>alert('업로드가 완료되었습니다.');window.close();</script>");
        })
    }
    catch{
        if(!id){
            console.log(logString+'익명 유저의 프로필 사진 업로드 시도를 거부했습니다.('+ip+')')
            res.send("<script>alert('로그인이 필요합니다.');opener.location.href='/login';window.close();</script>");
        }
        else{
            console.log(logString+req.user.ID+'('+req.user.nickname+') 유저가 파일 업로드 없이 업로드를 시도했습니다.('+ip+')')
            res.send("<script>alert('파일을 업로드 해주세요.');history.back();</script>");
        }
    }
})

function popup(){
    var url = "/profile/upload";
    var name = "파일 업로드";
    var option = "width = 500, height = 500, top = 100, left = 200, location = no"
    window.open(url, name, option);
}

function enterkey() {
    if (window.event.keyCode == 13) {
         // 엔터키가 눌렸을 때 실행할 내용
         send();
    }
}

module.exports = router;