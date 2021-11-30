var mysql_odbc = require('../../db/db_board')();
var myinfo = mysql_odbc.init();

function inpu() {
    // 입력되어있는 데이터 가져오기
    var command = document.getElementById('command').value
    console.log(command)
    
    // 공백이 아닐때
    if(!(command.replace(/\s| /gi, "").length == 0)){
      // 가져왔으니 데이터 빈칸으로 변경
      document.getElementById('command').value = 'dd'
  
      // 내가 전송할 메시지 클라이언트에게 표시
      var chat = document.getElementById('console')
      var msg = document.createElement('div')
      var node = document.createTextNode(command)
      msg.classList.add('commandline')
      msg.appendChild(node)
      chat.appendChild(msg)

      var command_list = command.split(" ")

      if(command_list[0] = "/type"){
          var target = command_list[1]
          var willbe = command_list[2]

          var datas = [willbe, target]

          var sql = "update userdb set type=? where nickname =?"
          myinfo.query(sql,datas,function(err,result){
              if(err) console.error(err);
              console.log('유저의 type을 수정했습니다.')
          })
      }
    } 
  

  function a(){
    var element = document.getElementById('command');
    element.scrollTop = element.scrollHeight - element.clientHeight;
  }
  a();

}

function enterkey() {
    if (window.event.keyCode == 13) {
         // 엔터키가 눌렸을 때 실행할 내용
         inpu();
    }
  }