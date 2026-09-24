import supabase from "../api/supabase";

const MEMBER_FIELDS = "id,email,store_id,is_active,created_at,updated_at";

function memberError(error) {
  if (error?.code === "23505") return new Error("이미 등록된 이메일입니다. 목록에서 해당 구성원을 수정하거나 이용을 재개해주세요.");
  if (error?.code === "42501") return new Error("등록된 운영진만 구성원을 관리할 수 있습니다.");
  if (error?.code === "PGRST116") return new Error("구성원 정보가 변경되었습니다. 새로고침 후 다시 시도해주세요.");
  return error;
}

export async function getStores({ includeOperations = false } = {}) {
  const { data, error } = await supabase.from("beauty_voice_stores")
    .select("id,name,sort_order").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).filter(store => includeOperations || store.id !== "operations");
}

export async function getMembers() {
  const { data, error } = await supabase.from("beauty_voice_members")
    .select(MEMBER_FIELDS).order("created_at", { ascending: false });
  if (error) throw memberError(error);
  return data ?? [];
}

export async function getMyMissionMembership() {
  const { data, error } = await supabase.rpc("beauty_voice_my_membership");
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function createMember({ email, storeId }) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || normalizedEmail.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("로그인에 사용할 올바른 Google 이메일을 입력해주세요.");
  }
  if (!storeId) throw new Error("소속을 선택해주세요.");
  const { data, error } = await supabase.from("beauty_voice_members")
    .insert({ email: normalizedEmail, store_id: storeId, is_active: true })
    .select(MEMBER_FIELDS).single();
  if (error) throw memberError(error);
  return data;
}

export async function updateMember(member, { storeId, isActive }) {
  if (!member?.id || !member.updated_at) throw new Error("수정할 구성원을 다시 선택해주세요.");
  if (!storeId || typeof isActive !== "boolean") throw new Error("소속과 이용 상태를 확인해주세요.");
  const { data, error } = await supabase.from("beauty_voice_members")
    .update({ store_id: storeId, is_active: isActive })
    .eq("id", member.id).eq("updated_at", member.updated_at)
    .select(MEMBER_FIELDS).single();
  if (error) throw memberError(error);
  return data;
}
