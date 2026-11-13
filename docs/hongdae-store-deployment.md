# 컬러 그라운드 홍대 추가

추가 매장 이름은 ‘컬러 그라운드 홍대’, 내부 ID는 hongdae입니다.

## 반영 범위

- Beauty Voice 작성/수정의 매장 선택과 게시판 매장 필터
- 공통 매장 필터 및 기존 Voice 매장별 집계
- 구성원 관리의 소속 등록/변경/필터 (SQL의 매장 목록)
- 미션 생성/수정의 대상 매장 선택 (SQL의 매장 목록)
- 홍대 소속 활성 구성원은 홍대 대상 및 전체 매장 미션 조회
- 인사이트의 네 번째 매장 카드와 관리자 매장 선택
- 로컬 개발용 기존 API의 매장 허용 목록

기존 매장·구성원·글·미션은 보존합니다. 전체 매장 미션은 홍대 구성원에게도 보입니다. 기존 특정 매장 대상 미션에 홍대를 자동 추가하지 않으므로 필요하면 관리자에서 대상 매장을 수정하세요.

홍대 인사이트는 글 등록 전까지 빈 카드로 표시됩니다. ‘뷰티 맨션 성수 인사이트로 이동’ 외부 링크는 해당 매장 전용 링크라 유지했습니다. 별도 외부 사이트의 내용은 이번 변경 범위에 포함되지 않습니다.

각 매장 인사이트 카드는 제목과 화살표를 눌러 개별적으로 접고 펼칠 수 있습니다. 처음에는 모두 펼쳐지며, 탭을 떠났다가 돌아오면 기본 상태로 표시됩니다. 키보드 Enter/Space로도 동작합니다. 아코디언 변경에 별도 SQL은 필요 없습니다.

## 적용 순서

1. Supabase SQL Editor에서 outputs/08_add_hongdae_store.sql 전체 실행. 기존 인사이트 갤러리 SQL(07)이 적용된 상태를 전제로 합니다. 이번 SQL은 매장 행과 인사이트 매장 제약만 추가하며 RLS는 변경하지 않습니다.
2. GitHub Desktop의 beauty-voice → Changes에서 이번 변경을 체크합니다. 기존 빈 파일 App_tab_login_required.jsx는 제외하세요.
3. Summary: `Add Color Ground Hongdae store` → Commit to main → Push origin.
4. Vercel에서 해당 커밋 Ready 확인 후 새로고침.
5. 구성원 관리에서 홍대 구성원을 등록하고, 필요하면 홍대 대상 미션 및 인사이트를 등록합니다.

## 변경 파일

- src/constants/stores.js: 공통 매장 목록 신설
- src/utils/constants.js: 공통 매장 목록 사용
- src/components/board/BeautyVoiceBoard.jsx, BoardDetail.jsx, WritePost.jsx: 게시판 필터/작성/수정 선택 목록 통합
- src/components/insight/insightModel.js: 공통 매장 목록 사용
- src/components/insight/Insight.jsx: 매장별 접기/펼치기 및 접근성 상태 표시
- src/components/insight/insight.css: 넓은 화면 4열, 일반 화면 2열, 모바일 1열
- server/index.js: 기존 로컬 API 매장 허용 목록 추가
- supabase/migrations/20261113_add_hongdae_store.sql: 새 매장 및 인사이트 제약 확장
- tests/hongdae-store-db.mjs: 반복 실행·기존 데이터 보존·홍대 구성원/미션/인사이트 검증
- tests/insight-gallery-dom.mjs: 카드 4개 기준으로 DOM 검증
- docs/hongdae-store-deployment.md: 적용 안내

## 검증

빌드 및 diff 공백 검사 통과. 로컬 격리 DB에서 홍대 매장 중복 없는 추가, 기존 기록 보존, 홍대 인사이트 저장, 홍대 구성원 등록, 홍대/전체 미션 노출 및 다른 매장 미션 격리를 확인했습니다. React DOM 테스트에서 카드 4개와 사진 등록/수정 흐름이 통과했습니다. 실제 브라우저 캡처 및 운영 DB 테스트는 수행하지 않았습니다. SQL 적용·커밋·푸시·배포는 사용자가 위 순서대로 진행해야 합니다.
