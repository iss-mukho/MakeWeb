사용 DB 정보{<br>
    host: 'localhost',<br>
    port : 3306,<br>
    user: 'root',<br>
    password : '2016104101',<br>
    database : 'userDB'<br>
}<br><br>
게시판 사용 DB 정보{<br>
    host: 'localhost',<br>
    port : 3306,<br>
    user: 'root',<br>
    password : '2016104101',<br>
    database : 'board'<br>
}<br><br>

sql 사용 파일<br>
    router/login/index.js<br>
    router/register/index.js<br><br>

DB 구조(*ID, password, type) -> 형식에 맞게 추가<br>
*ID varchar(20), password varchar(20), type varchar(10) // type이 운영자인 경우 서버에서 변경<br>
추가된 형식에 맞는 로그인 및 세션 등 변경<br>
alter table userDB add nickname varchar(20) not null;<br>

CREATE TABLE `board` (
  `idx` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `title` varchar(50) NOT NULL,
  `content` mediumtext NOT NULL,
  `regdate` datetime NOT NULL,
  `modidate` datetime NOT NULL,
  `passwd` varchar(50) NOT NULL,
  `hit` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`idx`)
);

LF 오류시 git config --global core.autocrlf true 입력<br><br>


최종 수정: 2021-11-17 14:25<br>
최종 수정 내용: 세션에 ID + 닉네임 전달기능 추가
수정 내용: 경로 지정 수정, 제목 추가, userDB, 회원가입에 nickname요소 추가