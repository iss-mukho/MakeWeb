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
    console.log('passport session save: '+ user.ID)
    done(null, user.ID)
});
passport.deserializeUser(function(ID, done){
    console.log('passport session get ID: '+ ID)
    done(null, ID); // 세션에서 값을 뽑아서 페이지에 전달하는 역할
})

passport.use('local-join', new LocalStrategy({
        usernameField: 'ID',
        passwordField: 'password',
        pwcomField: 'pw_com',
        usertypeField: 'type',
        passReqToCallback: true
     }, function(req, ID, password, done){
            var query = connection.query('select * from user where ID=?', [ID], function(err, rows){
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
                    var sql = {ID: ID, password: password, userType:req.body.type};
                    var query = connection.query('insert into user set ?', sql, function(err, rows){
                        if(err) throw err
                        console.log(ID, " 사용자가 추가되었습니다.")
                        return done(null, {'ID' : ID});
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