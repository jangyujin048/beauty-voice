import supabase from "../api/supabase";

export async function getComments(postId) {
  const { data, error } = await supabase
    .from("beauty_voice_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return data ?? [];
}

export async function createComment({
  postId,
  content,
  writer,
  userId,
  isAdmin = false,
}) {
  const trimmedContent = content?.trim();

  if (!trimmedContent) {
    throw new Error(
      "댓글 내용을 입력해주세요."
    );
  }

  if (!userId) {
    throw new Error(
      "로그인 정보가 없습니다."
    );
  }

  const { data, error } = await supabase
    .from("beauty_voice_comments")
    .insert([
      {
        post_id: postId,
        content: trimmedContent,
        writer: writer || "익명 BC",
        user_id: userId,
        is_admin: isAdmin,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}