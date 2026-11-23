# Beauty Voice 홈 화면 설치 적용 안내

## 변경 사항
- BV 아이콘과 웹 앱 매니페스트 추가. 홈 화면에서 Beauty Voice를 독립된 창으로 실행합니다.
- 로그인 화면, PC 사이드바, 모바일 메뉴에 설치 안내를 추가했습니다.
- 브라우저가 설치 요청을 지원하면 설치 버튼이 표시됩니다. 이미 독립 앱으로 실행 중이면 안내를 숨깁니다.
- 인터넷 연결이 필요한 방식입니다. 오프라인 저장, 푸시 알림은 포함하지 않습니다.
- Google 로그인과 구성원/운영진 권한은 기존 그대로입니다. SQL 변경은 없습니다.

## 변경 파일
- index.html
- src/App.jsx
- src/components/install/InstallApp.jsx
- src/components/install/install-app.css
- public/manifest.webmanifest
- public/icons/ (아이콘 4개)
- scripts/generate-app-icons.py (아이콘 재생성용)

## 배포 순서
1. 프로젝트에서 npm run build를 실행합니다.
2. GitHub Desktop의 Changes에서 위 변경과 이 안내 문서를 확인합니다. 기존 빈 App_tab_login_required.jsx는 체크 해제합니다.
3. Summary에 Add home screen installation을 입력하고 Commit to main → Push origin을 누릅니다.
4. Vercel에서 해당 커밋의 Production 배포가 Ready인지 확인합니다.
5. 휴대폰 브라우저에서 사이트를 다시 열고 아래 순서로 설치합니다.

## 설치 방법
- 아이폰/아이패드: Safari에서 사이트 열기 → 공유 → 홈 화면에 추가 → 추가. 웹 앱으로 열기 항목이 있으면 켭니다.
- 안드로이드: Chrome에서 사이트 열기 → 설치 버튼 또는 메뉴(⋮)의 앱 설치/홈 화면에 추가.
- 설치 메뉴 이름과 설치 버튼 제공 여부는 브라우저에 따라 다릅니다.

## 배포 후 실제 기기 확인
- 홈 화면에 BV 아이콘이 표시되고 독립 창으로 열리는지 확인합니다.
- 등록된 Google 계정으로 로그인한 후 사이트로 돌아오는지 확인합니다. 브라우저와 설치 앱의 세션이 달라 다시 로그인이 필요할 수 있습니다.
- 미등록 계정 접근 제한, 로그아웃, 모바일 메뉴, 사진 첨부를 확인합니다.
- 현재 로컬 빌드와 배포 산출물의 매니페스트/아이콘 규격은 확인했습니다. 실제 iPhone/Android 설치 및 OAuth 복귀는 아직 검증하지 않았습니다.

참고: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
