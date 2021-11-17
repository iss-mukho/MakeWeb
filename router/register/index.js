var express = require('express')
var app = express()
var router = express.Router();
var path = require('path') // 상대경로
var mysql = require('mysql')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy

// database setting
var connection = mysql.createConnection({
    host: 'localhost',
    port : 3306,
    user: 'root',
    password : '2016104101',
    database : 'userDB'
})
connection.connect();

router.get('/', function(req, res){
    var msg;
    var errMsg = req.flash('error')
    if(errMsg) msg = errMsg;
    res.render('register.ejs', {'message' : msg});
})

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

passport.use('local-join', new LocalStrategy({
        usernameField: 'ID',
        passwordField: 'password',
        pwcomField: 'pw_com',
        usertypeField: 'type',
        nicknameField: 'nickname',
        passReqToCallback: true
     }, function(req, ID, password, done){
            var query = connection.query('select * from userDB where ID=?', [ID], function(err, rows){
            if(err) return done(err);

            if(rows.length){ // database에 입력한 ID값이 있는가?
                console.log("알림: 중복된 ID입니다.")
                return done(null, false, {message : '중복된 ID입니다.'})
            }
            else{
                if(password != req.body.pw_com){ // 비밀번호와 확인이 같지 않은가?
                    console.log("알림: 비밀번호가 일치하지 않습니다.")
                    return done(null, false, {message : '비밀번호가 일치하지 않습니다.'})
                }
                else{
                    var subqry = connection.query('select * from userDB where nickname=?', [req.body.nickname], function(err, rows_){
                        if(err) return done(err);
                        if(rows_.length){
                            console.log("알림: 중복된 닉네임입니다.")
                            return done(null, false, {message : '중복된 닉네임입니다.'})
                        }
                        else{
                            var sql = {ID: ID, password: password, type:req.body.type, nickname:req.body.nickname};
                            var query = connection.query('insert into userDB set ?', sql, function(err, rows){
                                if(err) throw err
                                console.log("알림: 사용자가 추가되었습니다.(" + ID +", " + req.body.nickname + ")")
                                return done(null, {'ID' : ID, 'nickname' : req.body.nickname});
                            })
                        }
                    })
                }
            }
        })
    }
));
router.post('/', passport.authenticate('local-join', {
    successRedirect: '/main',
    failureRedirect: '/register',
    failureFlash: true
}))

module.exports = router;