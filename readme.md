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

LF 오류시 git config --global core.autocrlf true 입력<br><br>


최종 수정: 2021-11-16 14:03