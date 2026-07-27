import supabase from "../api/supabase";

/**
 * 게시글의 댓글 조회
 */
export async function getComments(postId) {
  if (!postId) {
    return [];
  }

  const { data, error } = await supabase
    .from("beauty_voice_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * 댓글 등록
 */
export async function createComment({
  postId,
  content,
  writer,
  userId,
  isAdmin = false,
}) {
  const trimmedContent = content?.trim();

  if (!postId) {
    throw new Error("게시글 정보를 확인할 수 없습니다.");
  }

  if (!trimmedContent) {
    throw new Error("댓글 내용을 입력해주세요.");
  }

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
        writer: writer?.trim() || "익명 BC",
        user_id: resolvedUserId,
        is_admin: Boolean(isAdmin),
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 댓글 수정
 */
export async function updateComment(
  commentId,
  content
) {
  const trimmedContent = content?.trim();

  if (!commentId) {
    throw new Error("댓글 정보를 확인할 수 없습니다.");
  }

  if (!trimmedContent) {
    throw new Error("댓글 내용을 입력해주세요.");
  }

  const { data, error } = await supabase
    .from("beauty_voice_comments")
    .update({
      content: trimmedContent,
    })
    .eq("id", commentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId) {
  if (!commentId) {
    throw new Error("댓글 정보를 확인할 수 없습니다.");
  }

  const { error } = await supabase
    .from("beauty_voice_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    throw error;
  }

  return commentId;
}