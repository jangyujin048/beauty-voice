# Beauty Voice 공식 답변 적용 안내

작업 폴더: `/Users/jang-yujin/Downloads/bc_voice_real`

## 구현 결과

- 일반 BC: 기존 `댓글 등록`과 익명 BC 번호 표시 유지.
- 운영진: 동일한 익명 댓글 버튼 + `운영진으로 답변` 버튼 추가.
- 공식 버튼으로 작성한 댓글만 `운영진 · 조직문화팀` 표시.
- 기존 `beauty_voice_comments.is_admin` 재사용. 익명/공식 유형은 등록 후 전환하지 않음.
- 클라이언트의 임의 이름/작성자 ID 대신 검증된 로그인 계정 ID와 고정 표시 문구를 사용.
- 운영진 관리 화면에서도 익명 답변과 공식 답변을 분리.
- 본인에게 보이는 Google 로그인 이름·사진 및 예약 화면은 원래대로 유지.
- 전역 CSS, package.json, package-lock.json, 환경변수, 배포 설정은 변경하지 않음.

## 확인한 기존 구조

이메일 상수 파일 `src/constants/adminEmails.js`는 현재 실행 코드에서 사용되지 않습니다. 실제 DB는 `public.admin_users.email`과 `public.is_admin()`으로 운영진을 판별합니다. 운영진 탭의 비밀번호는 공식 답변 권한으로 사용하지 않습니다.

사용자가 SQL Editor로 확인해 준 운영 DB 구조를 기준으로 작성했습니다.

- 댓글: `beauty_voice_comments`, 원문: `beauty_voice_posts`.
- 댓글 INSERT는 기존에 로그인만 하면 허용(`WITH CHECK true`). SELECT도 모든 로그인 계정에 허용.
- 댓글 UPDATE/DELETE는 작성자 계정만 허용.
- 원문 SELECT는 공개 글/본인 글/운영진에 허용, UPDATE는 원문 작성자만 허용.
- 구형 `voices`는 RLS 비활성화 상태이며 별도 `admin_reply` 필드가 남아 있음.

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `src/contexts/AuthContext.jsx` | 서버 RPC로 현재 계정의 공식 답변 권한 확인. 계정 전환 시 이전 응답 무시, 오류 시 버튼 숨김 |
| `src/services/commentService.js` | 로그인 사용자 확인, 공식 저장 전 권한 재검증, 고정 writer 저장 |
| `src/components/board/BoardDetail.jsx` | 운영진 전용 버튼, 공식 문구, 익명 기본 동작 및 수정/삭제 유지 |
| `src/components/admin/AdminBoardPosts.jsx` | 익명/공식 버튼 분리, DB의 writer 원문 대신 고정 문구, 모바일 줄바꿈 |
| `supabase/migrations/20260919_official_replies.sql` | 권한 함수, 추가 RLS, DB 트리거 |
| `supabase/01_inspect_permissions.sql` | 기존 구조 확인용 읽기 전용 SQL |
| `tests/official-replies-db.mjs` | 격리 DB에서 권한 공격/회귀 13개 시나리오 |
| `tests/official-replies-service.mjs` | 서비스 검증 7개 시나리오 |
| `tests/official-replies-ui.mjs` | 실제 컴포넌트 + 가짜 Supabase로 화면 재현/브라우저 테스트 |
| `docs/official-replies-deployment.md` | 이 안내서 |

## SQL이 적용하는 제한

기존 허용 정책을 삭제하지 않고 RESTRICTIVE 정책을 추가합니다. 기존 허용 정책과 추가 제한을 모두 충족해야 통과합니다. [PostgreSQL 공식 문서](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)

1. `admin_users` 명단은 기존 데이터를 유지하면서 브라우저 계정의 조회·수정을 차단합니다. 운영진 등록/해제는 Supabase SQL Editor 등 서버 관리 권한으로만 수행합니다.
2. `beauty_voice_can_reply_official()`은 현재 로그인 ID의 검증된 이메일을 `auth.users`에서 읽고 기존 `admin_users`와 비교합니다. 이메일 목록이나 개인 정보를 반환하지 않고 boolean만 반환합니다. user_metadata나 오래된 JWT 이메일을 권한 근거로 삼지 않습니다.
3. 댓글 등록 시 `user_id = auth.uid()`이며 공식 댓글은 운영진이어야 합니다.
4. 댓글 수정 시 작성자·원문·익명/공식 유형 변경을 차단합니다. 운영진 권한이 해제되면 이전 공식 댓글의 수정·삭제도 차단됩니다.
5. 댓글 조회/작성/수정/삭제에 원문 접근 권한을 적용해 비공개 글의 댓글만 따로 조회하는 우회를 차단합니다.
6. 공식 댓글 저장과 원문의 `답변완료` 상태 변경을 DB 트랜잭션으로 처리합니다. 익명 댓글은 상태를 바꾸지 않습니다.
7. 구형 `voices.admin_reply`, `replied_at`, `reply_updated_at`의 생성·변경도 운영진만 가능하게 합니다. 기존 익명 접수와 읽음 표시 동작을 보존하기 위해 구형 테이블 전체 RLS를 이번에 일괄 변경하지는 않습니다.

권한 함수는 `SECURITY DEFINER`, 빈 `search_path`, 명시적 스키마와 제한된 EXECUTE 권한을 사용합니다. [Supabase 공식 문서](https://supabase.com/docs/guides/database/functions)

## 적용·배포 순서

현재는 로컬 코드만 수정했습니다. 운영 SQL 실행, Git 커밋/푸시, Vercel 배포는 하지 않았습니다.

1. Supabase의 **SQL Editor → New query**에서 `supabase/migrations/20260919_official_replies.sql` 전체를 붙여넣고 **Run**을 누릅니다. 기본 postgres 역할로 실행하세요. BEGIN/COMMIT으로 묶여 있어 오류 시 전체 롤백되며 재실행도 가능합니다.
2. 오류가 나면 프론트 배포 전에 오류 내용을 확인합니다. 특히 `admin_users`가 존재하지 않는다는 오류가 나면 다른 프로젝트에 실행한 것은 아닌지 확인하세요. 이 SQL은 기존 등록 명단을 재사용하므로 별도 이메일 입력이 없습니다.
3. 로컬 프로젝트에서 빌드합니다.

```bash
cd /Users/jang-yujin/Downloads/bc_voice_real
npm run build
```

4. 변경 파일을 확인한 뒤 기존 Vercel 연결 브랜치에 커밋/푸시합니다. 전체 파일을 무조건 추가하지 않고 이번 파일만 지정합니다.

```bash
git diff --check
git add src/contexts/AuthContext.jsx src/services/commentService.js src/components/board/BoardDetail.jsx src/components/admin/AdminBoardPosts.jsx supabase/01_inspect_permissions.sql supabase/migrations/20260919_official_replies.sql tests/official-replies-db.mjs tests/official-replies-service.mjs tests/official-replies-ui.mjs docs/official-replies-deployment.md
git commit -m "Add authorized official replies while preserving anonymous comments"
git push
```

5. Vercel이 Ready가 되면 새로고침하고 아래 항목을 확인합니다.

| 로그인 상태 | 확인 |
|---|---|
| 일반 BC | 공식 버튼 없음, 익명 댓글 등록/수정/삭제 정상 |
| 등록 운영진 | 익명 댓글 버튼 + 공식 버튼, 익명 버튼 사용 시 익명 BC 표시 |
| 등록 운영진 공식 답변 | `운영진 · 조직문화팀` 표시, 원문 답변완료 |
| 다른 BC | 공식 답변에 개인 이름/이메일 없음, 다른 사람의 비공개 글 댓글 조회 불가 |
| 로그아웃/계정 전환 | 공식 버튼이 이전 계정 권한으로 남지 않음 |
| 모바일/PC | 댓글 버튼과 관리 화면 배치 확인 |

SQL을 먼저 적용하고 프론트를 배포해야 합니다. 프론트만 먼저 적용하면 새 RPC가 없어 공식 버튼이 숨겨집니다. 운영진 이메일을 변경한 뒤에는 새로고침하면 표시 권한이 다시 확인되며, 저장 권한은 매 요청마다 DB가 확인합니다.

## 검증 결과와 한계

- Vite 프로덕션 빌드 성공. 500KB 이상의 번들 경고는 남아 있으나 빌드 오류는 없음.
- 제공된 정책/테이블 구조를 재현한 PGlite PostgreSQL 엔진에서 보안 시나리오 13개 통과. SQL 2회 적용으로 재실행도 검증.
- 실제 commentService로 서비스 시나리오 7개 통과.
- 실제 React 컴포넌트와 가짜 Supabase를 연결한 브라우저에서 일반 BC/운영진 익명/공식 등록, 공식 답변 수정, 저장 직전 권한 거부, 계정 전환/로그아웃, 관리 화면을 확인.
- 게시글 상세 및 운영진 관리 화면의 390px/1280px 가로 넘침 없음 확인.
- 이 실행 환경에서 standalone Playwright 브라우저 실행이 제한되어 UI 검증은 Codex 내장 브라우저로 수행했습니다. 전체 Playwright 자동 테스트 실행 완료로 보고하지 않습니다.
- 실제 Google OAuth 로그인 및 운영 Supabase에 대한 쓰기 테스트는 아직 하지 않았습니다. SQL 적용 후 위 실계정 확인이 필요합니다.
- 기존 댓글 데이터는 덮어쓰지 않습니다. 기존 `is_admin=true` 행은 계속 공식으로 표시되며, 과거 행의 실제 작성 권한을 소급 증명하지 않습니다.
- 구형 `voices` 전체 접근 통제와 운영진 탭의 비밀번호 방식은 이번 공식 댓글 권한 변경과 별개로 남아 있습니다. 이번 SQL은 구형 공식 답변 필드에 대한 쓰기 가드까지만 추가합니다.

서비스 테스트는 추가 설치 없이 실행 가능합니다.

```bash
node --experimental-vm-modules tests/official-replies-service.mjs
```

DB/브라우저 테스트는 별도 설치한 `@electric-sql/pglite`, `playwright`의 모듈 경로를 각각 `PGLITE_MODULE`, `PLAYWRIGHT_MODULE`에 지정하여 실행할 수 있습니다. 테스트용 패키지는 앱의 의존성 파일에 추가하지 않았습니다. `UI_SERVE_ONLY=1`은 내장 브라우저로 수동 확인할 로컬 테스트 페이지를 엽니다.

## 되돌릴 때

화면 문제만 있으면 프론트를 이전 배포로 되돌리고 서버의 보안 제한은 유지하세요. 서버 제한을 단순 삭제하면 기존의 공식 답변 위조 가능성이 다시 생기므로, DB 변경이 필요하면 오류에 맞춰 조정하는 편이 안전합니다. 기존 데이터나 이메일 명단은 이번 마이그레이션에서 삭제하지 않습니다.
