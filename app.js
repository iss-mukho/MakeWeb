// 설치한 express 모듈 불러오기
const express = require('express')

// 설치한 socket.io 모듈 불러오기
const socket = require('socket.io')

// Node.js 기본 내장 모듈 불러오기
const http = require('http')
const fs = require('fs')

// express 객체 생성
const app = express()

// express http 서버 생성
const server = http.createServer(app)

// 생성된 서버를 socket.io에 바인딩
const io = socket(server)

var bodyParser = require('body-parser')
var router = require('./router/index')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var session = require('express-session')
var flash = require('connect-flash')
var path = require('path')
const PORT = 3000

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use("/public", express.static(__dirname + "/public")); // static directory
app.use("/router", express.static(__dirname + "/router"));
app.use("/views", express.static(__dirname + "/views"))
app.use("/css", express.static(__dirname + "/css"));
app.use("/assets", express.static(__dirname + "/assets"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/chat", express.static(__dirname+ "/chat"));
app.use("/command", express.static(__dirname+ "/command"));
app.use("/node_modules", express.static(path.join(__dirname+ "/node_modules")));
app.set('view engine', 'ejs')

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

var session = session({
    secret:'qWeR1_3-4AsDf',
    resave:true,
    saveUninitialized:true,
    cookie:{maxAge:3600000*24}
});

app.use(session);

var sharedsession = require("express-socket.io-session");
const { createSocket } = require('dgram')
io.use(sharedsession(session, { autoSave:true}));
  
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(router) // router 정의

// Socket.io

var chatnamespace = io.of('/chatnamespace')

io.sockets.on('connection', function(socket) {
    var ip = socket.handshake.address;

    /* 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌 */
    socket.on('newUser', function() {
        /* 소켓에 이름 저장해두기 */
        var tempSession = socket.handshake.sessionStore.sessions;
        var key = socket.handshake.sessionID;

        // tempSession[key] = String Type
        if(tempSession[key] != undefined){
            var useSession = JSON.parse(tempSession[key]);
            socket.name = useSession.passport.user.nickname
            console.log(logString + socket.name+' 님이 접속하였습니다.('+ip+')')

            /* 모든 소켓에게 전송 */
            io.sockets.emit('update', {type: 'connect', name: 'SERVER', message:socket.name + '님이 접속하였습니다.'})
        }
    })

    /* 전송한 메시지 받기 */
    socket.on('message', function(data) {
        if(socket.name != undefined){
            /* 받은 데이터에 누가 보냈는지 이름을 추가 */
            data.name = socket.name

            /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
            socket.broadcast.emit('update', data);
        }
        else{
            console.log(logString+'익명 유저의 채팅 전송을 거부했습니다.('+ip+')')
             // 세션이 없어진 사용자들 처리
             socket.emit('update', {type: 'ERROR'})
        }
    })

    /* 접속 종료 */
    socket.on('disconnect', function() {
        if(socket.name != undefined){
            console.log(logString+socket.name + ' 님이 나가셨습니다.('+ip+')')
            /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
            socket.broadcast.emit('update', {type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.'});
        }
    })
})

// 서버 가동(IPv4 형식으로 express 설정)
server.listen(PORT, '0.0.0.0', function(){
    console.log(logString+"서버가 시작되었습니다.(Port: "+PORT+")");
});