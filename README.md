# Velog Stats

## 소개

**Velog Stats**는 Velog 블로그의 통계를 간편하게 확인할 수 있는 Chrome 확장 프로그램입니다.  
이 확장 프로그램을 사용하면 Velog에 작성한 게시물의 총 조회수, 좋아요 수, 댓글 수 등 다양한 통계를 실시간으로 확인할 수 있습니다.

## 주요 기능

- Velog의 게시물 조회수, 좋아요, 댓글 수 등 통계 제공
- 모든 게시물에 대한 통계를 한번에 불러오기
- Velog의 `access_token` 쿠키를 자동으로 가져와 인증 처리
- 게시물 정렬 기능

## 설치

Chrome 웹 스토어에서 **Velog Stats**를 다운로드할 수 있습니다:  
[Velog Stats Chrome Extension Download](https://chromewebstore.google.com/detail/velog-stats/dgdmogoodedabnaklhlohncclnjalfad?authuser=0&hl=en)

## 사용 방법

1. 확장 프로그램을 설치한 후, Velog에 로그인하세요.
2. 확장 프로그램 아이콘을 클릭하여 팝업을 엽니다.
3. Velog 사용자 ID를 입력하고 '조회' 버튼을 누르면, 해당 사용자의 게시물 통계가 로드됩니다.

## 권한

- **cookies**: Velog의 `access_token` 쿠키를 사용하여 API 호출 시 인증 처리.
- **host_permissions**: Velog의 GraphQL API에 접근하기 위한 권한.

## 버전

**현재 버전: 1.7.1**

## 개인정보 처리 방침

Privacy Policy for Velog Stats는 [Privacy Policy](https://sssungjin.github.io/velog-stats-chrome-extension/privacy-policy) 페이지에서 확인 할 수 있습니다.

## Release Note

### 1.6 Version

- Velog의 게시물 조회수, 좋아요, 댓글 수 등 통계 제공
- 모든 게시물에 대한 통계를 한번에 불러오기
- Velog의 `access_token` 쿠키를 자동으로 가져와 인증 처리

### 1.7 Version

- 게시물 정렬 기능 추가
  정렬 기준
  - 조회 수
  - 댓글 수
  - 좋아요 수
- 문법 상 어색한 문장 수정

### 1.7.1 Version

기능 변경 없음

- Web Store 이미지 변경
