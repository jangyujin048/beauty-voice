import supabase from "../api/supabase";

/**
 * 공개 게시글 조회
 * 게시글별 댓글 개수 포함
 */
export async function getPosts() {
  const { data, error } = await supabase
    .from("beauty_voice_posts")
    .select(`
      *,
      beauty_voice_comments(count)
    `)
    .eq("admin_only", false)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(post => ({
    ...post,

    comment_count:
      post.beauty_voice_comments?.[0]?.count ?? 0,
  }));
}

/**
 * 게시글 등록
 */
export async function createPost(post) {
  const { data, error } = await supabase
    .from("beauty_voice_posts")
    .insert(post)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 로그인한 사용자의 게시글 조회
 */
export async function getMyPosts(userId) {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("beauty_voice_posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * 운영자에게만 전달된 게시글 조회
 */
export async function getAdminPosts() {
  const { data, error } = await supabase
    .from("beauty_voice_posts")
    .select("*")
    .eq("admin_only", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * 게시글 상태 변경
 */
export async function updatePostStatus(
  postId,
  status
) {
  const { data, error } = await supabase
    .from("beauty_voice_posts")
    .update({
      status,
    })
    .eq("id", postId)
    .select();

  if (error) {
    throw error;
  }

  return data?.[0] ?? null;
}

/**
 * 게시글 수정
 */
/**
 * 게시글 공감 토글
 * DB 함수가 현재 사용자의 공감 여부를 기준으로
 * likes 값을 안전하게 증가/감소시킵니다.
 */
export async function togglePostLike(postId) {
  if (!postId) {
    throw new Error("게시글 정보를 확인할 수 없습니다.");
  }

  const { data, error } = await supabase.rpc(
    "toggle_beauty_voice_post_like",
    {
      p_post_id: postId,
    }
  );

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 게시글 수정
 */
export async function updatePost(
  postId,
  updateData
) {
  const { data, error } = await supabase
    .from("beauty_voice_posts")
    .update({
      ...updateData,
    })
    .eq("id", postId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 게시글 삭제
 */
export async function deletePost(postId) {
  const { error } = await supabase
    .from("beauty_voice_posts")
    .delete()
    .eq("id", postId);

  if (error) {
    throw error;
  }
}
