# 네 종류의 웹 푸시 알림 적용

코드와 로컬 테스트까지 준비되었습니다. 실제 발송은 아래 서버 설정과 배포를 마친 뒤 시작됩니다. GitHub에 올리는 것만으로 발송되지는 않습니다.

## 동작

| 종류 | 수신 대상 | 누르면 이동 |
| --- | --- | --- |
| 새 공지사항 | 알림을 켠 활성 구성원 전체 | 공지사항 |
| 새 운영진 공식 답변 | 해당 Beauty Voice 글 작성자 (본인 답변 제외) | My Voice |
| 새 뷰티 미션 | 대상 매장 구성원과 운영진, 전체 대상 미션은 전체 | Beauty Mission |
| 새 인사이트 | 해당 매장 구성원과 운영진 (매장 없는 기존 형식은 전체) | BC 인사이트 |

- PC 사이드바 / 모바일 더보기 메뉴의 **알림 설정**에서 네 종류를 선택하고 **알림 받기**를 누릅니다. 브라우저 권한 허용은 사용자가 직접 해야 합니다.
- 기기별 설정입니다. 로그아웃하면 해당 기기의 구독을 해제합니다. 다른 기기는 유지됩니다.
- 이름, 이메일, 본문, 사진은 알림에 보내지 않습니다. 알림을 누르면 해당 메뉴로 이동하며 로그인·구성원 권한을 다시 확인합니다.
- 구성원 중지·매장 변경·운영진 권한 회수·원문 삭제·알림 해제를 발송 직전에 다시 확인합니다. 이미 발송된 알림은 회수할 수 없습니다.
- 새로 등록하는 항목만 발송합니다. 기존 글 일괄 알림, 수정/재개 알림, 익명 댓글 알림은 없습니다. 계정과 연결되지 않은 구형 voices 답변은 포함하지 않습니다.
- 미래 시작일 미션은 한국 시간 시작일 0시 이후에 발송합니다. 신규 등록 시점에 구독한 수신자가 대상이며 뒤늦게 구독한 기기에 과거 이벤트를 보내지 않습니다.
- 매분 최대 20개씩 발송합니다. 기기 수가 많거나 일시 오류가 있으면 지연될 수 있습니다. 오류는 최대 4회 시도, 대기 알림은 7일 후 종료, 완료 기록은 30일 뒤 정리합니다.
- 발송 중 연결이 끊기면 재시도로 중복이 생길 수 있습니다. 같은 알림의 표시 태그로 중복 표시를 줄입니다. 잠금 화면에 실제 표시되는지는 OS 설정·네트워크에 따라 달라집니다.
- 서비스 워커는 알림 수신용이며 페이지나 비공개 데이터를 오프라인 캐시하지 않습니다.

## 1. SQL 적용

Supabase → SQL Editor → New query에서 다음 파일 전체를 실행합니다.

`supabase/migrations/20261123_web_push.sql`

기존 테이블 데이터나 정책을 삭제하지 않습니다. 구독/발송대기 테이블과 제한된 RPC, 새 항목 등록 트리거만 추가합니다. 같은 SQL을 다시 실행해도 과거 알림은 생성되지 않습니다.

## 2. 알림 키 설정 (최초 한 번)

프로젝트의 `.push-secrets/` 폴더에 키 파일을 생성해 두었습니다. Finder에서 숨김 폴더 보기 **Command + Shift + .** 를 누르면 보입니다.

- `edge.env`: Supabase 서버용 4개 값
- `vercel.env`: Vercel용 공개 키 1개 값

Git에서 제외되며 개인 키는 브라우저 코드에 넣지 않습니다. 이 파일을 채팅이나 GitHub에 붙여넣지 마세요. 다시 키를 생성하면 기존 기기의 재구독이 필요하므로 그대로 보관합니다.

Supabase → Edge Functions → Secrets에서 `edge.env`의 네 이름과 값을 등록합니다.

- `WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `PUSH_WORKER_SECRET`
- `WEB_PUSH_SUBJECT`

Vercel → beauty-voice 프로젝트 → Settings → Environment Variables에서 `vercel.env`의 **VITE_WEB_PUSH_PUBLIC_KEY**를 Production에 등록합니다. 이 값은 `WEB_PUSH_PUBLIC_KEY`와 같아야 합니다. 환경변수 등록 후 재배포해야 적용됩니다.

## 3. Supabase 발송 함수 배포

터미널에서 실행합니다. 이는 GitHub 비밀번호를 사용하는 과정이 아닙니다.

```sh
cd /Users/jang-yujin/Downloads/bc_voice_real
npx supabase login
```

브라우저 로그인을 마친 뒤 아래 `YOUR_PROJECT_REF`를 현재 Supabase 프로젝트의 Settings → General → Reference ID로 바꿉니다.

```sh
npx supabase functions deploy send-push --project-ref YOUR_PROJECT_REF
```

`supabase/config.toml`의 함수 설정을 함께 사용합니다. JWT 검증 대신 함수 내부에서 서버 전용 `x-push-secret`을 검증합니다. 일반 사용자는 발송 함수를 실행할 수 없습니다.

기본 `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 함수 환경에 제공합니다. 서비스 키를 Vercel의 `VITE_` 환경변수에 넣으면 안 됩니다.

## 4. 자동 발송 예약

Supabase Vault에서 다음 두 Secret을 만듭니다. 대시보드 검색에서 Vault를 찾을 수 있습니다.

- 이름 `bv_push_function_url` / 값 `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push`
- 이름 `bv_push_worker_secret` / 값 `edge.env`의 `PUSH_WORKER_SECRET`과 동일

그 다음 SQL Editor에서 `supabase/09_schedule_web_push.sql`을 전체 실행합니다. pg_cron과 pg_net을 사용해 1분마다 함수를 호출합니다. 같은 이름의 예약은 갱신됩니다.

예약 일시 중지:

```sql
select cron.unschedule('beauty-voice-web-push');
```

## 5. 웹사이트 배포

```sh
cd /Users/jang-yujin/Downloads/bc_voice_real
npm run build
```

GitHub Desktop → Changes에서 변경 파일 확인 → Summary에 `Add four types of web push notifications` → Commit to main → Push origin.

빈 `App_tab_login_required.jsx`는 체크 해제합니다. `.push-secrets/` 파일은 표시되면 안 됩니다. Vercel에서 새 커밋의 Production 배포가 Ready인지 확인합니다.

## 6. 실제 기기에서 확인

아이폰은 iOS 16.4 이상, 홈 화면에 설치한 앱에서 알림을 허용해야 합니다. 안드로이드는 최신 Chrome 등 지원 브라우저를 이용합니다. 설치만으로 알림 권한이 자동으로 생기지는 않습니다.

1. 매장 A 일반 계정과 운영진 계정에서 알림을 켭니다.
2. 공지를 새로 등록: 두 계정 수신 확인.
3. 일반 계정 글에 운영진으로 답변: 글 작성자만 수신 확인. 익명 답변은 발송되지 않음.
4. 매장 A 미션/인사이트 등록: 매장 A와 운영진은 수신, 매장 B는 미수신 확인.
5. 종류별 체크 해제 → 설정 저장, 전체 알림 끄기, 로그아웃 후 미수신 확인.
6. 앱을 닫아 둔 상태에서 수신, 알림 클릭 후 올바른 메뉴와 로그인 복귀 확인.

SQL Editor에서 발송 현황은 개인정보 없이 확인할 수 있습니다.

```sql
select kind, state, count(*) from public.bv_push_deliveries group by kind, state;
```

`sent`는 푸시 서비스가 접수했다는 뜻이며 실제 화면 표시를 보장하지 않습니다. `failed`가 늘면 Edge Function Secrets의 공개/개인 키 일치와 발송 함수 설정을 확인하세요. 대기만 쌓이면 Supabase Cron 실행 기록과 Edge Function 로그를 확인합니다.

## 검증 범위

로컬 PostgreSQL 호환 엔진에서 권한·수신자 분리·대기 처리·구독 해제 테스트, 발송 함수의 인증/오류 분류와 서비스 워커 라우팅 테스트, 프론트 빌드를 확인했습니다. 실제 Supabase 배포, Deno Edge 실행, iOS/Android 푸시 전달은 아직 확인하지 않았습니다.

참고: [Apple Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [Supabase 예약 함수](https://supabase.com/docs/guides/functions/schedule-functions), [web-push 라이브러리](https://github.com/web-push-libs/web-push)
