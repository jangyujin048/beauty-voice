import supabase from "../api/supabase";

/**
 * 내 프로필 조회
 */
export async function getMyProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 닉네임 저장 / 변경
 */
export async function saveMyNickname(nickname) {
  const trimmedNickname = nickname.trim();

  if (trimmedNickname.length < 2) {
    throw new Error("닉네임은 2자 이상 입력해주세요.");
  }

  if (trimmedNickname.length > 12) {
    throw new Error("닉네임은 12자 이하로 입력해주세요.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

console.log("닉네임 저장 auth user:", {
  id: user.id,
  email: user.email,
});

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: user.id,
        nickname: trimmedNickname,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select()
    .single();

  if (error) {
    // 닉네임 UNIQUE 충돌
    if (error.code === "23505") {
      throw new Error(
        "이미 사용 중인 닉네임입니다."
      );
    }

    throw error;
  }

  return data;
}