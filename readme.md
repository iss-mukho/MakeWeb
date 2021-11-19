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
    router/register/index.js<br>
    router/board/index.js<br><br>

DB 구조(*ID, password, type) -> 형식에 맞게 추가<br>
*ID varchar(20), password varchar(20), type varchar(10) // type이 운영자인 경우 서버에서 변경<br>
추가된 형식에 맞는 로그인 및 세션 등 변경<br>
alter table userDB add nickname varchar(20) not null;<br>

Database = singer_composer

create table userdb(
    ID varchar(20) not null primary key,
    password varchar(20) not null,
    type varchar(10) not null,
    nickname varchar(20) not null,
    profilemsg varchar(300)
)engine=innodb;

create table board(
    idx int not null primary key auto_increment,
    name varchar(50) not null,
    title varchar(50) not null,
    content mediumtext not null,
    regdate datetime not null,
    modidate datetime not null,
    passwd varchar(50) not null,
    hit int not null
)engine=innodb;<br><br>

DB구조 - board에서 사용됨(*idx, name, title, content, regdate, modidate, passwd, hit)<br>
*idx int, name varchar(50), title varchar(50), content mediumtext, regdate datetime, modidate datetime, passwd varchar(50), hit int<br>


<h2>LF 오류시 git config --global core.autocrlf true 입력<h2><br>
<h2>게시글 reset 후 idx의 값이 1부터 시작하지 않을 경우
ALTER TABLE board AUTO_INCREMENT = 1; 
SET @COUNT = 0;
UPDATE board SET idx = @COUNT:=@COUNT+1;
입력<h2><br><br>

최종 수정: 2021-11-20 01:50<br>
최종 수정 내용:
<h2>★★필수입력★★<h2>
alter table board drop passwd;
alter table board add ID varchar(20) not null;
alter table board change name nickname;
alter table board modify nickname varchar(20);

로그에 시간 추가, 시간 실시간 반영, 게시글 수정 및 삭제 세션+권한 연동/DB수정, 버그 수정, 게시글 조회수 구현, 프로필 수정 세션 연동<br>
수정 내용: about/사이트 git 링크 추가, 프로필 추가, 메뉴바/하단 추가, 게시판에 기본 서식 추가, 로그인시에만 게시판 관련 경로에 접근가능하게 함, 사용자 로그 생성, 경로 지정 수정, 제목 추가, userDB, 회원가입에 nickname요소 추가, 세션에 ID + 닉네임 전달기능 추가, 게시판의 글쓰기 및 글 열람 기능 추가.

<!-- http://khuhub.khu.ac.kr/2017104034/Singer-Composer -->