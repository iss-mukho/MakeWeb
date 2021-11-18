var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로
var mysql_odbc = require('../../db/db_board')();
var myinfo = mysql_odbc.init();
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

passport.serializeUser(function(user, done){
    console.log('passport session save: '+ user.ID + '(' + user.nickname + ')')
    done(null, user)
});
passport.deserializeUser(function(user, done){
    var ID = user.ID;
    var nickname = user.nickname;
    console.log('passport session get ID: '+ ID + '(' + nickname + ')')
    done(null, {'ID': ID, 'nickname':nickname}); // 세션에서 값을 뽑아서 페이지에 전달하는 역할
})

// main page는 login이 된 상태(세션정보가 있을때만) 접근이 가능하게 하자 -> info에 구현해놓음.
router.get('/', function(req, res){
    var id = req.user.ID;
    if(!id) res.redirect('/login')
    else{
        var sql = "select profilemsg, type from userdb where id =?";
    
        myinfo.query(sql,[id],function(err,rows) {
            if (err) console.error("err : " + err);
            var nickname = req.user.nickname;
            var type = rows[0].type;
            var profilemsg = rows[0].profilemsg;
            console.log(req.user.ID+'('+nickname+') 유저가 프로필을 보고있습니다.')
            res.render('profile.ejs', {'ID':id, 'nickname': nickname, 'type': type, 'profilemsg': profilemsg})
        })
    }
});

router.get('/update', function(req,res){
    var id = req.user.ID;
    if(!id) res.redirect('/login')
    else{
        var sql = 'select profilemsg from userdb where id ="'+req.user.ID+'"';

        myinfo.query(sql, function(err,rows) {
            if (err) console.error("err : " + err);
            var id = req.user.ID;
            var nickname = req.user.nickname;
            var type = req.user.type;
            var profilemsg = rows[0].profilemsg;
            res.render('profmsgedit.ejs', {'ID':id, 'nickname': nickname, 'type':type, 'profilemsg': profilemsg, 'message':''});
        })
    }
})

router.post('/update', function(req,res,next){
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
            var sql = "update userdb set profilemsg =?, nickname=?, type=? where id =?"
            myinfo.query(sql,datas,function(err,result){
                if(err) console.error(err)

                console.log(req.user.ID+'('+req.session.passport.user.nickname+') 유저가 프로필을 수정했습니다.')
                console.log("  변경전: "+id+"("+req.user.nickname+") "+oldType+" // "+oldProfilemsg)
                req.session.passport.user.nickname = nickname;
                console.log("  변경후: "+id+"("+nickname+") "+type+" // "+profilemsg)
                res.redirect('/profile');
            })
        }
        else{ // 다른 유저의 닉네임과 중복되는 경우
            console.log(id+" 유저가 중복된 닉네임으로 변경을 시도했습니다.(시도한 닉네임: "+req.body.nickname+")")
            res.render('profmsgedit.ejs', {nickname: req.session.passport.user.nickname, profilemsg: oldProfilemsg, message : '중복된 닉네임입니다.'})
        }
    })
})

module.exports = router;