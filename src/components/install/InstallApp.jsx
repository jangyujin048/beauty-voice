import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import './install-app.css';

const InstallContext = createContext(null);
export function InstallProvider({ children }) {
  const pendingPrompt = useRef(null);
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const busyRef = useRef(false);
  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    const checkDisplay = () => setInstalled(display.matches || window.navigator.standalone === true);
    checkDisplay();
    const beforeInstall = event => {
      event.preventDefault();
      pendingPrompt.current = event;
      setAvailable(true);
      setMessage('');
    };
    const afterInstall = () => {
      pendingPrompt.current = null;
      setAvailable(false);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', afterInstall);
    display.addEventListener('change', checkDisplay);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', afterInstall);
      display.removeEventListener('change', checkDisplay);
    };
  }, []);
  async function install() {
    if (busyRef.current || !pendingPrompt.current) return;
    const prompt = pendingPrompt.current;
    pendingPrompt.current = null;
    busyRef.current = true;
    setBusy(true); setMessage('');
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === 'accepted'
        ? '설치 요청을 보냈어요. 설치가 완료되면 Beauty Voice 아이콘으로 열어주세요.'
        : '설치를 취소했어요. 아래 브라우저 메뉴 안내로 나중에 추가할 수 있어요.');
    } catch {
      setMessage('설치 창을 열지 못했어요. 아래 브라우저 메뉴 안내를 이용해주세요.');
    } finally {
      setAvailable(Boolean(pendingPrompt.current));
      busyRef.current = false; setBusy(false);
    }
  }
  return <InstallContext.Provider value={{ available, installed, busy, message, install }}>{children}</InstallContext.Provider>;
}

export default function InstallApp() {
  const context = useContext(InstallContext);
  if (!context || context.installed) return null;
  const { available, busy, message, install } = context;
  return <div className="install-app">
    {available && <button className="install-app-button" type="button" onClick={install} disabled={busy}>
      <Download size={17} aria-hidden="true" />{busy ? '설치 확인 중…' : 'Beauty Voice 설치'}
    </button>}
    {message && <p className="install-app-result" role="status">{message}</p>}
    <details className="install-app-help">
      <summary><Smartphone size={17} aria-hidden="true" />홈 화면에 추가하는 방법</summary>
      <div>
        <p><strong>아이폰 · 아이패드</strong><br />Safari로 사이트 열기 → 공유 메뉴 → 홈 화면에 추가 → 추가.<br />‘웹 앱으로 열기’가 보이면 켜주세요.</p>
        <p><strong>안드로이드</strong><br />Chrome 메뉴(⋮) → 앱 설치 또는 홈 화면에 추가를 선택해주세요.</p>
        <p><strong>PC</strong><br />Chrome·Edge의 주소창 설치 아이콘이나 브라우저 메뉴의 앱 설치 항목을 이용해주세요.</p>
        <p className="install-app-note">카카오톡 등 앱 안에서 열었다면 Safari 또는 Chrome으로 다시 열어주세요. 설치 후에도 등록된 Google 계정과 인터넷 연결이 필요해요.</p>
      </div>
    </details>
  </div>;
}
