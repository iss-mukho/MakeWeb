var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var router = require('./router/index')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var session = require('express-session')
var flash = require('connect-flash')
var path = require('path')
const PORT = 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname + "/public")); // static directory
app.use(express.static(__dirname + "/css"));
app.use(express.static(__dirname + "/assets"));
app.set('view engine', 'ejs')

app.use(session({
   secret: 'keyboard cat',
   resave: false,
   saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(router) // router 정의

app.listen(PORT, function(){
    console.log("서버를 구동합니다.(Port: "+PORT+")");
});