// Push only: deliberately no fetch handler or authenticated-content cache.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
const messages = {
 notice: ['새로운 공지사항이 등록됐어요.', 'notice'],
 reply: ['내 글에 운영진 답변이 도착했어요.', 'myVoice'],
 mission: ['새로운 뷰티 미션이 등록됐어요.', 'challenge'],
 insight: ['새로운 BC 인사이트가 등록됐어요.', 'insight'],
};
self.addEventListener('push', event => {
 let data = {};
 try { data = event.data?.json() || {}; } catch { /* Always display a safe notification. */ }
 const [body, tab] = messages[data.kind] || ['새로운 소식이 도착했어요.', 'home'];
 event.waitUntil(self.registration.showNotification('Beauty Voice', {
  body, icon:'/icons/bv-192.png', badge:'/icons/bv-192.png',
  tag: typeof data.id === 'string' ? `bv-${data.id}` : 'bv-news',
  data: { tab },
 }));
});
self.addEventListener('notificationclick', event => {
 event.notification.close();
 const allowed = ['notice','myVoice','challenge','insight','home'];
 const tab = allowed.includes(event.notification.data?.tab) ? event.notification.data.tab : 'home';
 const url = new URL(`/#push=${tab}`, self.location.origin).href;
 event.waitUntil((async () => {
  const clients = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
  for (const client of clients) {
   if (new URL(client.url).origin === self.location.origin && 'navigate' in client) {
    const navigated = await client.navigate(url);
    if (navigated) return navigated.focus();
   }
  }
  return self.clients.openWindow(url);
 })());
});
