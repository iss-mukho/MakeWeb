var socket = io();


/* 접속 되었을 때 실행 */
socket.on('connect', function() {
  /* 이름을 입력받고 */

  /* 서버에 새로운 유저가 왔다고 알림 */
  socket.emit('newUser')
})

/* 서버로부터 데이터 받은 경우 */
socket.on('update', function(data) {
  try{
    var chat = document.getElementById('chat')

    var message = document.createElement('div')
    var node;
    if(data.name == "ERROR"){
      throw 'ERROR'; // 서버 재시작 후 세션이 없어진 경우 throw
    }
    else if(data.name != "SERVER"){
        node = document.createTextNode(`${data.name}: ${data.message}`)
    }
    else{
        node = document.createTextNode(`${data.message}`)
    }
    var className = ''

    // 타입에 따라 적용할 클래스를 다르게 지정
    switch(data.type) {
      case 'message':
        className = 'other'
        break

      case 'connect':
        className = 'connect'
        break

      case 'disconnect':
        className = 'disconnect'
        break
    }

    message.classList.add(className)
    message.appendChild(node)
    chat.appendChild(message)

    function a(chat = 'chat'){
      var element = document.getElementById(chat);
      element.scrollTop = element.scrollHeight - element.clientHeight;
    }
    a();
  }
  catch(e){ // 서버 재시작 후 세션이 사라진 경우 팝업_채팅창에서 알림창을 띄우고 팝업창 끄기->기존 창 새로고침
    alert("세션이 만료되었습니다.")
    self.close();
    opener.document.location.href="/main"
  }
})

/* 메시지 전송 함수 */
function send() {

  // 입력되어있는 데이터 가져오기
  var message = document.getElementById('test').value
  
  // 공백이 아닐때
  if(!(message.replace(/\s| /gi, "").length == 0)){
    // 가져왔으니 데이터 빈칸으로 변경
    document.getElementById('test').value = ''

    // 내가 전송할 메시지 클라이언트에게 표시
    var chat = document.getElementById('chat')
    var msg = document.createElement('div')
    var node = document.createTextNode(message)
    msg.classList.add('me')
    msg.appendChild(node)
    chat.appendChild(msg)

    // 서버로 message 이벤트 전달 + 데이터와 함께

    socket.emit('message', {type: 'message', message: message})
  } else{
  alert("내용을 입력해주세요.");
}

  function a(chat = 'chat'){
    var element = document.getElementById(chat);
    element.scrollTop = element.scrollHeight - element.clientHeight;
  }
  a();
  
}

function enterkey() {
  if (window.event.keyCode == 13) {
       // 엔터키가 눌렸을 때 실행할 내용
       send();
  }
}