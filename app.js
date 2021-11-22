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

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use("/public", express.static(__dirname + "/public")); // static directory
app.use("/router", express.static(__dirname + "/router"));
app.use("/views", express.static(__dirname + "/views"))
app.use("/css", express.static(__dirname + "/css"));
app.use("/assets", express.static(__dirname + "/assets"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/chat", express.static(__dirname+ "/chat"));
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

app.use(session({
   secret: 'keyboard cat',
   resave: false,
   saveUninitialized: true
}))

const sessionMiddleware = session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}); // 세션 미들웨어

app.use(sessionMiddleware);

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
    // sessionMiddleware(socket.request, socket.request.res, next); will not work with websocket-only
    // connections, as 'socket.request.res' will be undefined in that case
  });
  

io.on('connection', (socket) => {
    const session = socket.request.session;
    session.connections++;
    session.save();
  });

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(router) // router 정의

// Socket.io
io.sockets.on('connection', function(socket) {

    const session = socket.request.session;
    session.connections++;
    session.save();
    
    /* 새로운 유저가 접속했을 경우 다른 소켓에게도 알려줌 */
    socket.on('newUser', function(name) {
        console.log(logString + name + ' 님이 접속하였습니다.')
  
        /* 소켓에 이름 저장해두기 */
        socket.name = name
  
        /* 모든 소켓에게 전송 */
        io.sockets.emit('update', {type: 'connect', name: 'SERVER', message: name + '님이 접속하였습니다.'})
    })
  
    /* 전송한 메시지 받기 */
    socket.on('message', function(data) {
        /* 받은 데이터에 누가 보냈는지 이름을 추가 */
        data.name = socket.name
      
        console.log(data)
  
        /* 보낸 사람을 제외한 나머지 유저에게 메시지 전송 */
        socket.broadcast.emit('update', data);
    })
  
    /* 접속 종료 */
    socket.on('disconnect', function() {
        console.log(logString+socket.name + '님이 나가셨습니다.')
  
        /* 나가는 사람을 제외한 나머지 유저에게 메시지 전송 */
        socket.broadcast.emit('update', {type: 'disconnect', name: 'SERVER', message: socket.name + '님이 나가셨습니다.'});
    })
})

server.listen(PORT, function(){
    console.log(logString+"서버가 시작되었습니다.(Port: "+PORT+")");
});