# 매장별 BC 인사이트 적용

## 변경 내용

왼쪽/모바일 BC 인사이트 메뉴는 내부 화면을 엽니다. 화면 우측 상단의 ‘뷰티 맨션 성수 인사이트로 이동’ 버튼만 https://kitty-insight.vercel.app/ 를 새 탭으로 엽니다.

세 매장 카드에 각 매장의 가장 최근 등록 글을 보여줍니다. 대표 사진은 첫 번째 사진이며 추가 사진은 +1/+2로 표시합니다. 자세히 보기에서 사진을 선택하고 본문을 읽거나 원본 이미지를 새 탭에서 열 수 있습니다.

관리자 → 인사이트관리에서 매장, 월, 제목을 입력하고 본문 또는 사진을 등록합니다. 사진만/본문만/사진과 본문 모두 가능합니다. 사진은 최대 3장, 한 장당 10MB이며 JPG/PNG/WebP/GIF를 지원합니다. 기존 사진을 유지·제거하거나 새 사진을 추가할 수 있습니다.

세 매장 모두 기존처럼 활성 구성원에게 공개됩니다. 이번 변경은 매장별 분류이며 미션처럼 소속 매장에 따라 열람을 제한하는 기능은 아닙니다.

기존 글은 삭제하지 않습니다. 매장을 추정하여 자동 배정하지 않으므로 처음에는 ‘이전 인사이트’에 표시됩니다. 관리자에서 기존 글을 수정하며 매장을 지정하면 해당 매장의 최신 카드에 반영됩니다. 최신 카드에서 제외된 글은 이전 인사이트에 계속 남습니다. 최초에 매장 미지정 글만 있다면 세 카드는 빈 상태 안내를 표시합니다.

## 적용 순서

1. Supabase → SQL Editor → New query에서 `07_store_insight_gallery.sql` 전체를 실행합니다. 프로젝트 원본은 `supabase/migrations/20261111_store_insight_gallery.sql`입니다. 테이블에 store_id와 image_urls를 추가하고 기존 image_url을 보존합니다. 기존 RLS/구성원·운영진 권한 및 비공개 이미지 저장소 정책은 바꾸지 않습니다. 오류 발생 시 전체 트랜잭션이 되돌려집니다.
2. SQL 적용 후 코드 배포까지는 인사이트 등록·수정을 잠시 멈춰주세요. 이전 화면에는 새 매장/사진 배열 입력이 없기 때문입니다.
3. GitHub Desktop에서 beauty-voice 저장소를 선택합니다. Changes에서 이번 변경 파일을 체크합니다. 기존 빈 파일 `App_tab_login_required.jsx`는 체크 해제하세요.
4. Summary에 `Add store insight cards and photo galleries`를 입력하고 Commit to main → Push origin을 누릅니다. 이미 Push origin 단계라면 커밋을 중복 생성할 필요가 없습니다.
5. Vercel에서 이 커밋의 배포가 Ready가 되면 사이트를 새로고침합니다.
6. 운영진 → 인사이트관리 → 기존 글의 수정에서 매장을 지정하거나, 새 인사이트를 등록합니다.
7. 일반 화면에서 세 매장 카드, 추가 사진 수, 상세 본문, 우측 상단 외부 링크를 확인합니다. 휴대폰에서는 카드가 세로로 배치됩니다.

SQL 적용 및 Git 커밋/푸시, 실제 Vercel 배포는 수행하지 않았습니다.

## 변경 파일

- src/App.jsx: PC/모바일 메뉴를 내부 인사이트 화면으로 복원
- src/components/insight/Insight.jsx: 매장별 카드·과거 글·상세 사진/본문·외부 링크
- src/components/insight/insight.css: PC 3열/모바일 1열 및 사진 UI 스타일
- src/components/insight/insightModel.js: 매장 목록, 기존 단일 사진 호환, 첨부 검증
- src/components/insight/InsightImagesInput.jsx: 최대 3장 첨부/미리보기/제거
- src/components/admin/AdminContentManager.jsx: 매장 지정, 사진 배열 등록/수정, 관리 목록의 매장·사진 수 표시
- supabase/migrations/20261111_store_insight_gallery.sql: 추가 컬럼 및 최대 사진 수/매장 제약
- tests/insight-gallery-db.mjs: 로컬 격리 DB와 사진 검증 테스트
- tests/insight-gallery-dom.mjs: 실제 React 컴포넌트의 DOM 상호작용 테스트
- tests/insight-gallery-ui.mjs: 가짜 데이터로 실행하는 로컬 화면 확인 도구
- docs/store-insight-gallery-deployment.md: 이 안내

## 검증

프로덕션 빌드 및 git diff --check 통과. 격리 DB/모델 테스트 6개 시나리오 통과: 기존 사진 보존·재실행, 3장 저장, 4장/잘못된 매장/미지정 매장 거절, 기존 글 수정과 사진 제거, 기존과 같은 RLS 조건에서 일반 계정 쓰기 차단, 파일 수/타입/크기 검증.

DOM 테스트에서 세 매장 카드, 새 탭 링크 속성, 상세 사진 전환, 사진 4장 선택 거절, 3장 등록, 2장으로 수정 및 최신 카드 반영을 확인했습니다. 운영 DB 연결 없이 테스트했습니다.

현재 환경에서 Chrome 실행이 차단되어 실제 PC/모바일 스크린샷 검증은 완료하지 못했습니다. 반응형 CSS를 추가했으므로 배포 후 실제 화면을 확인해주세요. 프로젝트 의존성은 변경하지 않았으며 테스트용 jsdom은 임시 폴더에만 설치했습니다.
