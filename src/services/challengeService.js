import supabase from "../api/supabase";

/**
 * 주간 미션 전체 조회
 * 최신 시작일 기준 정렬 + 댓글 개수 포함
 */
export async function getWeeklyChallenges() {
  const { data, error } = await supabase
    .from("weekly_challenges")
    .select(`
      *,
      weekly_challenge_comments(count)
    `)
    .order("start_date", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(item => ({
    ...item,

    participant_count:
      item.weekly_challenge_comments?.[0]?.count ?? 0,
  }));
}

/**
 * 특정 미션 조회
 */
export async function getWeeklyChallenge(
  challengeId
) {
  if (!challengeId) {
    throw new Error(
      "미션 정보를 확인할 수 없습니다."
    );
  }

  const { data, error } = await supabase
    .from("weekly_challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 미션 댓글 조회
 */
export async function getChallengeComments(
  challengeId
) {
  if (!challengeId) {
    return [];
  }

  const { data, error } = await supabase
    .from("weekly_challenge_comments")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * 미션 댓글 작성
 */
export async function createChallengeComment({
  challengeId,
  content,
  userId,
  writer = "익명 BC",
}) {
  const trimmedContent =
    content?.trim();

  if (!challengeId) {
    throw new Error(
      "미션 정보를 확인할 수 없습니다."
    );
  }

  if (!trimmedContent) {
    throw new Error(
      "참여 내용을 입력해주세요."
    );
  }

  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { session },
      error: sessionError,
    } =
      await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    resolvedUserId =
      session?.user?.id;
  }

  if (!resolvedUserId) {
    throw new Error(
      "로그인 세션을 확인할 수 없습니다."
    );
  }

  const { data, error } =
    await supabase
      .from(
        "weekly_challenge_comments"
      )
      .insert([
        {
          challenge_id:
            challengeId,

          user_id:
            resolvedUserId,

          content:
            trimmedContent,

          writer:
            writer?.trim() ||
            "익명 BC",
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
 * 미션 댓글 수정
 */
export async function updateChallengeComment(
  commentId,
  content
) {
  const trimmedContent =
    content?.trim();

  if (!commentId) {
    throw new Error(
      "댓글 정보를 확인할 수 없습니다."
    );
  }

  if (!trimmedContent) {
    throw new Error(
      "댓글 내용을 입력해주세요."
    );
  }

  const { data, error } =
    await supabase
      .from(
        "weekly_challenge_comments"
      )
      .update({
        content:
          trimmedContent,

        updated_at:
          new Date().toISOString(),
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
 * 미션 댓글 삭제
 */
export async function deleteChallengeComment(
  commentId
) {
  if (!commentId) {
    throw new Error(
      "댓글 정보를 확인할 수 없습니다."
    );
  }

  const { error } =
    await supabase
      .from(
        "weekly_challenge_comments"
      )
      .delete()
      .eq("id", commentId);

  if (error) {
    throw error;
  }

  return commentId;
}

/* =====================================================
   운영진 기능
===================================================== */

/**
 * 현재 로그인 계정이 운영진인지 확인
 */
export async function checkIsAdmin() {
  const {
    data,
    error,
  } = await supabase.rpc("is_admin");

  if (error) {
    console.error(
      "운영진 권한 확인 오류:",
      error
    );

    throw error;
  }

  console.log(
    "운영진 권한 확인 결과:",
    data
  );

  return data === true;
}

/**
 * 운영진 - 새 미션 등록
 */
export async function createWeeklyChallenge({
  title,
  description,
  prompt,
  startDate,
  endDate,
  status = "active",
}) {
  const trimmedTitle =
    title?.trim();

  const trimmedDescription =
    description?.trim();

  if (!trimmedTitle) {
    throw new Error(
      "미션 제목을 입력해주세요."
    );
  }

  if (!trimmedDescription) {
    throw new Error(
      "미션 설명을 입력해주세요."
    );
  }

  if (!startDate || !endDate) {
    throw new Error(
      "미션 기간을 입력해주세요."
    );
  }

  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  if (!session?.user?.id) {
    throw new Error(
      "로그인 정보를 확인할 수 없습니다."
    );
  }
if (status === "active") {
  await closeOtherActiveChallenges();
}
  const { data, error } =
    await supabase
      .from("weekly_challenges")
      .insert([
        {
          title:
            trimmedTitle,

          description:
            trimmedDescription,

          prompt:
            prompt?.trim() || null,

          start_date:
            startDate,

          end_date:
            endDate,

          status,

          created_by:
            session.user.id,
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
 * 운영진 - 미션 수정
 */
export async function updateWeeklyChallenge(
  challengeId,
  {
    title,
    description,
    prompt,
    startDate,
    endDate,
    status,
  }
) {
  if (!challengeId) {
    throw new Error(
      "미션 정보를 확인할 수 없습니다."
    );
  }

  const updatePayload = {
    updated_at:
      new Date().toISOString(),
  };

  if (title !== undefined) {
    updatePayload.title =
      title.trim();
  }

  if (description !== undefined) {
    updatePayload.description =
      description.trim();
  }

  if (prompt !== undefined) {
    updatePayload.prompt =
      prompt?.trim() || null;
  }

  if (startDate !== undefined) {
    updatePayload.start_date =
      startDate;
  }

  if (endDate !== undefined) {
    updatePayload.end_date =
      endDate;
  }

  if (status !== undefined) {
    updatePayload.status =
      status;
  }
if (status === "active") {
  await closeOtherActiveChallenges(
    challengeId
  );
}
  const { data, error } =
    await supabase
      .from("weekly_challenges")
      .update(updatePayload)
      .eq("id", challengeId)
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 운영진 - 진행 종료
 */
export async function closeWeeklyChallenge(
  challengeId
) {
  return updateWeeklyChallenge(
    challengeId,
    {
      status: "closed",
    }
  );
}

/**
 * 운영진 - 다시 진행 상태로 변경
 */
export async function reopenWeeklyChallenge(
  challengeId
) {
  if (!challengeId) {
    throw new Error(
      "미션 정보를 확인할 수 없습니다."
    );
  }

  // 현재 진행 중인 다른 미션 자동 종료
  await closeOtherActiveChallenges(
    challengeId
  );

  // 선택한 미션를 다시 진행
  return updateWeeklyChallenge(
    challengeId,
    {
      status: "active",
    }
  );
}

/**
 * 운영진 - 미션 삭제
 *
 * challenge 댓글은
 * ON DELETE CASCADE 설정으로 함께 삭제됨
 */
export async function deleteWeeklyChallenge(
  challengeId
) {
  if (!challengeId) {
    throw new Error(
      "미션 정보를 확인할 수 없습니다."
    );
  }

  const { error } =
    await supabase
      .from("weekly_challenges")
      .delete()
      .eq("id", challengeId);

  if (error) {
    throw error;
  }

  return challengeId;
}

/**
 * 현재 진행 중인 다른 미션 종료
 */
async function closeOtherActiveChallenges(
  exceptChallengeId = null
) {
  let query = supabase
    .from("weekly_challenges")
    .update({
      status: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "active");

  if (exceptChallengeId) {
    query = query.neq(
      "id",
      exceptChallengeId
    );
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}