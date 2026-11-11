export const INSIGHT_STORES = [
  { id: 'seongsu', name: '올리브영N 성수' },
  { id: 'beauty_mansion', name: '올리브영 뷰티 맨션 성수' },
  { id: 'gangnam', name: '올리브영 센트럴 강남 타운' },
];
export function insightImages(item) {
  if (Array.isArray(item?.image_urls) && item.image_urls.length) return item.image_urls.filter(Boolean).slice(0, 3);
  return item?.image_url ? [item.image_url] : [];
}
export function validateInsightImages(existing, files) {
  if (existing.length + files.length > 3) return '사진은 최대 3장까지 첨부할 수 있습니다.';
  if (files.some(file => !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))) return 'JPG, PNG, WebP, GIF 사진을 선택해주세요.';
  if (files.some(file => file.size > 10 * 1024 * 1024)) return '사진은 한 장당 10MB 이하로 첨부해주세요.';
  return '';
}
