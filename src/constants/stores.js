// Shared store IDs match beauty_voice_stores in Supabase.
export const STORE_CATALOG = [
  { id: 'seongsu', name: '올리브영N 성수' },
  { id: 'beauty_mansion', name: '올리브영 뷰티 맨션 성수' },
  { id: 'gangnam', name: '올리브영 센트럴 강남 타운' },
  { id: 'hongdae', name: '컬러 그라운드 홍대' },
];
export const STORE_NAMES = STORE_CATALOG.map(store => store.name);
