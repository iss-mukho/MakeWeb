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
    profilepic varchar(300) unique
)engine=innodb;

create table _board(
    idx int not null primary key auto_increment,
    nickname varchar(50) not null,
    title varchar(50) not null,
    content mediumtext not null,
    regdate datetime not null,
    modidate datetime not null,
    hit int not null,
    ID varchar(20) not null
)engine=innodb;

create table _comment(
    idx int auto_increment primary key,
    ID varchar(20) not null,
    nickname varchar(50) not null,
    comment mediumtext not null,
    bulletin_id int not null,
    foreign key (bulletin_id) references _board(idx) on delete cascade 
)engine=innodb;
```

---
## 주의 및 안내사항

- type이 운영자인 경우 서버에서 변경
- LF 오류시 Git에 하단 명령어 입력
>git config --global core.autocrlf true

- sharp 모듈 관련 오류시 하단의 SQL문 입력
>npm rebuild --verbose sharp

- 게시글 reset 후 idx의 값이 1부터 시작하지 않을 경우 하단의 SQL문 입력
>ALTER TABLE board AUTO_INCREMENT = 1;<br>
>SET @COUNT = 0;<br>
>UPDATE board SET idx = @COUNT:=@COUNT+1;

- 게시판 추가 DB 이름(댓글은 board 대신 comment)
>공지사항: notice_board<br>
>작곡가 구인: composer_board<br>
>가수 구인: singer_board<br>
>자유게시판: free_board<br>
>건의사항: suggestion_board

---
### 최종 수정: 2021-12-02 02:22<br>
### 수정 내용:
1. 채팅 구현(팝업)
2. 시간 실시간 반영
3. 프로필 사진 추가
4. 프로필 검색 추가
5. 프로필 비주얼 업데이트
6. 채팅(socket) 사용 중 서버 재시작 시 서버 오류 해결
7. 코드 다듬음
8. 버그 수정
9. 댓글 등록, 열람, 삭제 기능 구현 및 버그 픽스
10. 채팅 중 서버 재시작시 기존 참여자들 리셋시킴
11. 요소 좌우 길이 80%로 조절
12. 게시판 [공지사항/작곡가 구인/가수 구인/자유게시판/건의사항]으로 분화
13. 공지사항 게시판에는 운영자만 글쓰기 가능하게 함.