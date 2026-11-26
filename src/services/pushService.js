import supabase from '../api/supabase';
export const PUSH_OWNER = 'beauty-voice-push-owner';
export const pushKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || '';
let pendingSave = Promise.resolve();
export const defaults = { notices:true, replies:true, missions:true, insights:true };
export function supportsPush() {
 return window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
export async function currentSubscription() {
 if (!('serviceWorker' in navigator)) return null;
 const registration = await navigator.serviceWorker.getRegistration('/');
 return registration?.pushManager ? registration.pushManager.getSubscription() : null;
}
export async function pushStatus() {
 const sub = await currentSubscription();
 if (!sub) return null;
 const { data, error } = await supabase.rpc('bv_push_status', { p_endpoint:sub.endpoint });
 if (error) throw error;
 return data?.[0] || null;
}
export async function disablePush() {
 await pendingSave.catch(() => {});
 const sub = await currentSubscription();
 if (sub) {
  // Remove the server record before removing the browser endpoint so failures are retryable.
  const { error } = await supabase.rpc('bv_push_unsubscribe', { p_endpoint:sub.endpoint });
  if (error) throw new Error('알림 해제를 완료하지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.');
  await sub.unsubscribe();
 }
 const registration = await navigator.serviceWorker?.getRegistration('/');
 const notifications = await registration?.getNotifications?.() || [];
 notifications.forEach(notification => notification.close());
 localStorage.removeItem(PUSH_OWNER);
 window.dispatchEvent(new Event('bv-push-changed'));
}
export function savePush(userId, preferences) {
 const operation = enrollPush(userId, preferences);
 pendingSave = operation;
 return operation;
}
async function enrollPush(userId, preferences) {
 if (!supportsPush() || !pushKey) throw new Error('이 기기에서는 아직 알림을 설정할 수 없어요.');
 // Permission requested only in response to an explicit button click.
 if (await Notification.requestPermission() !== 'granted') throw new Error('알림이 허용되지 않았어요. 기기 또는 브라우저 설정에서 알림을 허용해주세요.');
 const registration = await navigator.serviceWorker.register('/push-sw.js', { scope:'/' });
 await navigator.serviceWorker.ready;
 let sub = await registration.pushManager.getSubscription();
 const key = Uint8Array.from(atob(pushKey.replace(/-/g,'+').replace(/_/g,'/')), char=>char.charCodeAt(0));
 if (sub && (localStorage.getItem(PUSH_OWNER) !== userId ||
   Array.from(new Uint8Array(sub.options.applicationServerKey || [])).join() !== Array.from(key).join())) {
  await sub.unsubscribe(); sub = null;
 }
 if (!sub) sub = await registration.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:key });
 const { data: { user }, error: sessionError } = await supabase.auth.getUser();
 if (sessionError || user?.id !== userId) {
  await sub.unsubscribe(); throw new Error('로그인 계정이 변경됐어요. 다시 로그인한 뒤 알림을 설정해주세요.');
 }
 const json = sub.toJSON();
 const { error } = await supabase.rpc('bv_push_subscribe', {
  p_endpoint:sub.endpoint, p_p256dh:json.keys.p256dh, p_auth:json.keys.auth,
  p_notices:preferences.notices, p_replies:preferences.replies,
  p_missions:preferences.missions, p_insights:preferences.insights,
 });
 if (error) { await sub.unsubscribe(); throw new Error('알림 등록에 실패했어요. 잠시 후 다시 시도해주세요.'); }
 localStorage.setItem(PUSH_OWNER,userId);
 window.dispatchEvent(new Event('bv-push-changed'));
}
