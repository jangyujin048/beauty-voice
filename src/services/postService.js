import { supabase } from "../supabaseClient";

/**
 * 게시글 전체 조회
 */
export async function getPosts() {
  const { data, error } = await supabase
    .from("beauty_voice_posts")
    .select("*")
    .eq("admin_only", false)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
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

  if (error) throw error;

  return data;
}