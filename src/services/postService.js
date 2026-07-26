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
