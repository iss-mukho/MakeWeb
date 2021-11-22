# Singer-Composer Matching Website Project
+ Developer
    - **고승완**(Mukho)
    - **배승호**(승호 D. 배)
    - **최시원**(Rubyflyer)
+ Git Address: http://khuhub.khu.ac.kr/2017104034/Singer-Composer

---
## 사용 DB 정보
```
{
    host: 'localhost',
    port : 3306,
    user: 'root',
    password : '',
    database : 'singer_composer'
}
```
sql 사용 파일<br>
>router/login/index.js<br>
>router/register/index.js<br>
>router/board/index.js<br>
>router/profile.index.js

---
## Database 명세
```
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
    nickname varchar(50) not null,
    title varchar(50) not null,
    content mediumtext not null,
    regdate datetime not null,
    modidate datetime not null,
    hit int not null,
    ID varchar(20) not null
)engine=innodb;
```

---
## 주의 및 안내사항

- type이 운영자인 경우 서버에서 변경
- LF 오류시 Git에 하단 명령어 입력
>git config --global core.autocrlf true

- 게시글 reset 후 idx의 값이 1부터 시작하지 않을 경우 하단의 SQL문 입력
>ALTER TABLE board AUTO_INCREMENT = 1;<br>
>SET @COUNT = 0;<br>
>UPDATE board SET idx = @COUNT:=@COUNT+1;

---
### 최종 수정: 2021-11-23 01:53<br>
### 수정 내용:
0. 채팅기능에 버그가 있는 것 같음-피드백 바람(undefined님이 나가셨습니다. -> 콘솔에 계속 출력됨)
1. 일부 수정
2. 로그에 시간 추가
3. 시간 실시간 반영
4. 게시글 수정 및 삭제 세션+권한 연동/DB수정
5. 버그 수정
6. 게시글 조회수 구현
7. 프로필 수정 세션 연동
8. etc