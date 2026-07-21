export function normalizeVoice(row) {
  return {
    id: row.id,
    anonId: row.anon_id,
    title: row.title || "제목 없음",
    store: row.store || "올리브영N 성수",
    category: row.category || "기타",
    content: row.content || "",
    imageUrl: row.image_url || "",
    userPassword: row.user_password || "",
    wantsReply: Boolean(row.wants_reply),
    status: row.status || "접수",
    createdAt: row.created_at,
    adminReply: row.admin_reply || "",
    repliedAt: row.replied_at || null,
    replySeen: Boolean(row.reply_seen)
  };
}


import supabase from "./supabase";

export async function loadVoices() {

  const { data, error } = await supabase
    .from("voices")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map(normalizeVoice);

}
