import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { defaults, pushKey, supportsPush, pushStatus, savePush, disablePush, currentSubscription, PUSH_OWNER } from '../../services/pushService';
import './push-settings.css';
const PushContext = createContext(null);
export function PushProvider({ children }) {
 const { user, canUseSite, isAuthLoading, accessStatus } = useAuth();
 const [preferences,setPreferences] = useState(defaults);
 const [enabled,setEnabled] = useState(false);
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState('');
 const lock = useRef(false);
 const generation = useRef(0);
 useEffect(() => {
  let active = true;
  const version = ++generation.current;
  setEnabled(false); setMessage(''); setPreferences(defaults);
  async function refresh() {
   if (isAuthLoading || accessStatus === 'loading' || !supportsPush()) return;
   try {
    const owner = localStorage.getItem(PUSH_OWNER);
    if (owner && (!user || owner !== user.id || ['paused','unregistered'].includes(accessStatus))) {
     const sub = await currentSubscription();
     await sub?.unsubscribe();
     localStorage.removeItem(PUSH_OWNER);
    }
    const status = canUseSite ? await pushStatus() : null;
    if (active && generation.current === version) {
     setEnabled(Boolean(status)); if (status) setPreferences(status);
    }
   } catch { if (active) setMessage('알림 설정을 확인하지 못했어요. 다시 시도해주세요.'); }
  }
  refresh();
  window.addEventListener('bv-push-changed',refresh);
  window.addEventListener('focus',refresh);
  return () => { active=false; window.removeEventListener('bv-push-changed',refresh); window.removeEventListener('focus',refresh); };
 }, [user?.id,canUseSite,isAuthLoading,accessStatus]);
 async function change(turnOff=false) {
  if (lock.current) return;
  lock.current=true; setBusy(true); setMessage('');
  const version=generation.current;
  try {
   if (turnOff || !Object.values(preferences).some(Boolean)) await disablePush();
   else await savePush(user.id,preferences);
   if (generation.current===version) {
    setEnabled(!turnOff && Object.values(preferences).some(Boolean));
    setMessage(turnOff ? '이 기기의 알림을 껐어요.' : '알림 설정을 저장했어요.');
   }
  } catch(error) { if (generation.current===version) setMessage(error.message); }
  finally { lock.current=false; setBusy(false); }
 }
 return <PushContext.Provider value={{ preferences,setPreferences,enabled,busy,message,change,canUseSite }}>{children}</PushContext.Provider>;
}
export default function PushSettings() {
 const ctx=useContext(PushContext);
 if (!ctx?.canUseSite) return null;
 const supported=supportsPush();
 return <details className="push-settings">
  <summary><Bell size={17} aria-hidden="true" />알림 설정{ctx.enabled ? ' · 켜짐' : ''}</summary>
  {!pushKey ? <p>알림 서비스 준비 중이에요. 설정이 완료되면 여기서 켤 수 있어요.</p>
   : !supported ? <p>아이폰은 iOS 16.4 이상에서 홈 화면에 추가한 앱으로 열어주세요. 안드로이드는 최신 Chrome에서 알림을 설정해주세요.</p>
   : <>
    <p>이 기기에서 받을 알림을 선택해주세요.</p>
    <fieldset disabled={ctx.busy}>
     <legend className="push-sr-only">알림 종류</legend>
     {Object.entries({notices:'공지사항',replies:'내 글의 운영진 답변',missions:'내 매장 뷰티 미션',insights:'내 매장 BC 인사이트'}).map(([key,label])=>
      <label key={key}><input type="checkbox" checked={ctx.preferences[key]} onChange={event=>ctx.setPreferences({...ctx.preferences,[key]:event.target.checked})}/>{label}</label>)}
    </fieldset>
    <button type="button" onClick={()=>ctx.change()} disabled={ctx.busy}>{ctx.busy?'저장 중…':ctx.enabled?'설정 저장':'알림 받기'}</button>
    {ctx.enabled && <button type="button" className="push-off" onClick={()=>ctx.change(true)} disabled={ctx.busy}>이 기기 알림 끄기</button>}
    <p>운영진은 모든 매장 알림을 받습니다. 로그아웃하면 이 기기 알림이 해제돼요.</p>
   </>}
  <p role="status">{ctx.message}</p>
 </details>;
}
