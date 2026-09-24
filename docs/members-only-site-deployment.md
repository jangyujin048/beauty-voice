# 활성 구성원 전용 사이트 적용 안내

## 변경된 이용 기준

- 구성원 관리에 등록된 활성 계정만 사이트 기능을 이용합니다. 미등록/이용 중지 계정은 로그인 및 접근 안내만 표시됩니다.
- 운영진도 활성 구성원이어야 합니다. 기존 admin_users 이메일은 이번 SQL 최초 실행 시 ‘운영진’ 소속/이용 중으로 자동 이관됩니다. 이미 구성원에 등록된 운영진도 최초 실행 시 소속과 상태를 이관합니다.
- 이후 SQL 재실행은 이용 중지된 운영진을 다시 활성화하지 않습니다.
- 소속은 운영진 또는 기존 세 매장입니다. ‘전체’ 소속은 추가하지 않았습니다.
- ‘운영진’ 소속은 기존 admin_users에 등록된 이메일에만 지정할 수 있습니다. 소속 선택으로 새 운영진 권한을 부여하지 않습니다. 새 운영진 권한 부여는 기존 admin_users 등록 방식이며, 일반 BC 등록/이동/이용 중지는 구성원 화면에서 처리합니다.
- 활성 운영진은 소속과 관계없이 모든 미션을 보고, 일반 BC는 소속 매장과 전체 매장 미션을 봅니다. 미션 공개 대상 선택에는 ‘운영진’이 매장으로 나타나지 않습니다.
- 이용 중지 시 서버는 다음 요청부터 차단합니다. 열린 화면은 30초 주기 또는 창으로 돌아올 때 다시 확인합니다. 이미 읽거나 내려받은 내용을 회수하는 기능은 아닙니다.
- 본인 운영진 계정은 화면과 DB에서 이용 중지할 수 없도록 막았습니다. 다른 운영진이 처리해야 합니다.
- 운영진 메뉴는 기존 공통 비밀번호 대신 로그인한 운영진 계정 권한으로 열립니다.
- 본인 로그인 영역의 Google 이름·사진은 유지합니다. 익명 댓글과 공식 답변 표시 규칙도 유지합니다.

## 서버 변경

기존 소유자/매장별 RLS 정책 위에 활성 구성원 조건을 추가합니다. 예약, 게시글, 댓글, 프로필, 공지, FAQ, 인사이트, Thanks, 미션, 공감 기록, 구성원/소속 목록을 포함합니다.

RLS가 꺼져 있던 공지·FAQ·인사이트는 활성 구성원이 조회하고 운영진만 관리하도록 바꿉니다. 기존 Voice 기능은 활성 구성원 안에서 유지합니다. 사용하지 않는 admins 명단은 브라우저 접근을 차단합니다.

SECURITY DEFINER 공감 함수 두 개에도 직접 활성 구성원 검사를 추가했습니다. 기존 운영진 판별 함수는 검증된 현재 이메일과 활성 구성원을 함께 확인합니다.

voice-images 버킷은 비공개로 바뀝니다. 기존 파일과 DB의 이미지 URL은 그대로 보존하고, 화면은 인증된 다운로드로 이미지를 표시합니다. 종전 공개 이미지 링크는 더 이상 외부에서 열리지 않습니다. Google 프로필 사진과 외부 사이트 링크는 이 버킷에 포함되지 않습니다. Vercel의 HTML/JS 및 공개 정적 파일 자체를 비공개 호스팅으로 바꾸는 작업은 아닙니다.

## 적용 순서

SQL과 프론트 코드를 함께 적용해야 합니다. SQL만 적용된 동안에는 이전 화면의 이미지가 잠시 보이지 않을 수 있으므로 배포할 준비를 마친 뒤 연속으로 진행하세요.

### 1. 프로젝트에서 빌드 확인

```bash
cd /Users/jang-yujin/Downloads/bc_voice_real
npm run build
```

이번 작업에서 빌드는 이미 통과했습니다. 출력의 번들 크기 경고는 빌드 실패가 아닙니다.

### 2. Supabase SQL Editor에서 전체 실행

outputs의 `06_members_only_site.sql` 전체를 새 쿼리에 붙여넣고 실행합니다. 프로젝트 원본은 `supabase/migrations/20260924_members_only_site.sql`입니다.

기존 02/04 SQL이 적용된 상태를 전제로 하며, 보낸 검사 결과에서 적용을 확인했습니다. 이번 SQL만 실행하면 됩니다. 오류가 나면 트랜잭션 전체가 되돌려집니다. 오류 상태에서는 배포하지 말고 오류 내용을 전달해주세요.

최초 실행 시 기존 운영진은 자동 등록됩니다. 일반 BC는 기존 구성원 목록을 유지하고, 미등록 BC는 더 이상 사이트를 이용할 수 없습니다. 필요한 BC는 배포 후 구성원 관리에서 추가하세요.

### 3. 커밋·푸시

```bash
cd /Users/jang-yujin/Downloads/bc_voice_real
git diff --check
git add src/App.jsx src/contexts/AuthContext.jsx src/services/memberService.js src/components/members/MemberManager.jsx src/components/media/PrivateMedia.jsx src/components/admin/AdminContentManager.jsx src/components/admin/VoiceDetail.jsx src/components/board/BoardCard.jsx src/components/board/WritePost.jsx src/components/notice/Notice.jsx src/components/insight/Insight.jsx supabase/migrations/20260924_members_only_site.sql tests/site-access-db.mjs tests/site-access-ui.mjs tests/store-members-ui.mjs docs/members-only-site-deployment.md
git commit -m "Restrict Beauty Voice to active members"
git push
```

Vercel → Deployments에서 새 배포가 Ready가 되면 사이트를 새로고침합니다.

### 4. 실제 계정으로 확인

1. 운영진 계정: 운영진 메뉴가 별도 공통 비밀번호 없이 열리고, 구성원 목록에 본인이 ‘운영진 / 이용 중’으로 보이는지 확인합니다.
2. 활성 BC: 사이트 이용과 해당 매장/전체 미션 표시, 예약·공감 기능을 확인합니다.
3. 미등록 계정: 메뉴/데이터 없이 등록 안내만 보이는지 확인합니다.
4. 테스트 BC 이용 중지: 해당 계정 화면을 새로고침하면 중지 안내가 뜨는지 확인한 후 이용 재개합니다.
5. 공지·인사이트의 기존 이미지와 새 이미지 업로드를 확인합니다.
6. 일반 BC의 익명 댓글과 운영진의 공식 답변 표시를 확인합니다.

실제 Supabase 적용 및 Vercel 배포는 이번 작업에서 수행하지 않았습니다.

## 변경 파일

| 파일 | 내용 |
|---|---|
| src/App.jsx | 접근 확인 전 앱 미표시, 계정/권한 전환 시 화면 상태 초기화, 운영진 계정으로 대시보드 진입 |
| src/contexts/AuthContext.jsx | 서버 접근 상태 조회, 활성/미등록/중지/오류 구분, 주기 및 포커스 재확인, 이전 계정 응답 차단 |
| src/services/memberService.js | 소속 목록에서 운영진 항목 선택적 포함, 소속 안내 문구 |
| src/components/members/MemberManager.jsx | 운영진 포함 소속 선택, 사이트 이용 관리 안내, 본인 중지 버튼 비활성화 |
| src/components/media/PrivateMedia.jsx | 인증된 이미지 다운로드, 기존 URL 호환, 임시 blob URL 해제 |
| src/components/admin/AdminContentManager.jsx | 이미지 미리보기와 목록에 비공개 이미지 적용 |
| src/components/admin/VoiceDetail.jsx | 기존 Voice 이미지/링크 적용 |
| src/components/board/BoardCard.jsx, WritePost.jsx | 게시글 이미지/미리보기 적용 |
| src/components/notice/Notice.jsx, insight/Insight.jsx | 공지·인사이트 이미지 및 원본 보기 적용 |
| supabase/migrations/20260924_members_only_site.sql | 구성원 이관, RLS·RPC·스토리지 제한 |
| tests/site-access-db.mjs | 로컬 격리 DB의 접근 제어 검증 |
| tests/site-access-ui.mjs | 실제 React 화면과 가짜 Supabase를 사용하는 로컬 검증 화면 |
| tests/store-members-ui.mjs | 새 접근 상태 API에 맞춘 기존 UI 검증 화면 |
| docs/members-only-site-deployment.md | 본 적용 안내 |

## 검증 결과와 범위

- 프로덕션 빌드와 git diff 공백 검사 통과.
- 기존 구성원/미션 서비스 테스트 10개 통과.
- 격리 PostgreSQL 엔진 보안 시나리오 7개 통과: 최초 운영진 이관, 소속을 통한 권한 획득 방지, 활성 구성원 이용, 미등록 전체 차단, 중지 즉시 차단, 중지 운영진 및 SQL 재실행, 비로그인 이미지/데이터 차단과 기록 보존.
- 로컬 UI에서 미등록/중지 계정 안내, 운영진 대시보드 진입, 운영진 소속 항목, 이용 중지 전환 확인.
- 390px 모바일 및 1280px PC 화면 확인, 가로 넘침 없음.
- 비공개 다운로드를 모사한 이미지가 blob URL로 정상 로드되는 것을 확인.
- 실제 운영 DB나 실제 Google 계정을 사용한 테스트는 수행하지 않았으므로 배포 후 위 확인 순서를 진행하세요.
