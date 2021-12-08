# 누가 내 노래 좀 들어줘요
+ Singer-Composer Matching Website Project
    - 누구나, 제한없이, 사용 가능한 '가수-작곡가' 매칭 사이트
+ Developer
    - **고승완**(Mukho)
    - **배승호**(승호 D. 배)
    - **최시원**(Rubyflyer)

---
## Usage

- 게시판
>제목, 내용, 사진 및 동영상 첨부가 가능하다. 공지사항의 경우 운영자만 글쓰기 가능하고, 공통적으로 글 수정의 경우 작성자만, 글 삭제의 경우 운영자와 작성자만 가능하다.<br>
>공지사항: 운영자가 서비스 사용자들에게 공지할 글을 올리는 게시판<br>
>작곡가 구인: 가수가 자신과 협업할 작곡가를 구하는 게시판<br>
>가수 구인: 작곡가가 자신의 곡에 노래를 불러줄 가수를 구하는 게시판<br>
>자유게시판: 모든 사용자들이 자유롭게 이용할 수 있는 게시판<br>
>건의사항: 서비스 사용자들이 운영자들에게 건의할 사항을 올리는 게시판

- 채팅
>사이트 내 로그인 한 모든 사용자들이 참여하는 채팅 서비스

- 프로필
>개인의 프로필 사진과 닉네임, 직종, 상태 메시지 변경 가능

---
## Database 명세(Using MySQL)
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

create table picvideo(
    idx int not null primary key auto_increment,
    picname varchar(300) unique,
    vidname varchar(300) unique,
    bulletin_id int not null,
    boardtitle varchar(50) not null
)engine=innodb;
```

---
## 주의 및 안내사항

- 게시판 추가 DB 이름(댓글은 board 대신 comment)
>공지사항: notice_board<br>
>작곡가 구인: composer_board<br>
>가수 구인: singer_board<br>
>자유게시판: free_board<br>
>건의사항: suggestion_board

- type이 운영자인 경우 서버에서 변경
- LF 오류시 Git에 하단 명령어 입력
>git config --global core.autocrlf true

- sharp 모듈 관련 오류시 하단의 SQL문 입력
>npm rebuild --verbose sharp

- 게시글 reset 후 idx의 값이 1부터 시작하지 않을 경우 하단의 SQL문 입력
>ALTER TABLE board AUTO_INCREMENT = 1;<br>
>SET @COUNT = 0;<br>
>UPDATE board SET idx = @COUNT:=@COUNT+1;

---
## Contact
+ http://khuhub.khu.ac.kr/2017104034/Singer-Composer

### 최종 수정: 2021-12-08 21:29<br>
### 수정 내용:
1. 프로필 사진/검색 추가
2. 프로필 비주얼 업데이트
3. 채팅(socket) 사용 중 서버 재시작 시 서버 오류 해결
4. 버그 수정
5. 댓글 등록, 열람, 삭제 기능 구현 및 버그 픽스
6. 요소 좌우 길이 80%로 조절
7. 게시판 [공지사항/작곡가 구인/가수 구인/자유게시판/건의사항]으로 분화
8. 공지사항 게시판에는 운영자만 글쓰기 가능하게 함.
9. 게시판별 게시글 사진 및 동영상 열람기능 추가.
10. 게시판별 사진 및 동영상 업로드기능 완료. 게시글 전용 사진/동영상 저장 폴더인 assets/picvid 추가