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
    throw new Error("댓글 내용을 입력해주세요.");
  }

  // 전달받은 userId가 없으면 현재 로그인 세션에서 직접 확인
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    resolvedUserId = session?.user?.id;
  }

  if (!resolvedUserId) {
    throw new Error(
      "로그인 세션을 확인할 수 없습니다. 로그아웃 후 다시 로그인해주세요."
    );
  }

  const { data, error } = await supabase
    .from("beauty_voice_comments")
    .insert([
      {
        post_id: postId,
        content: trimmedContent,
        writer: writer || "익명 BC",
        user_id: resolvedUserId,
        is_admin: isAdmin,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}