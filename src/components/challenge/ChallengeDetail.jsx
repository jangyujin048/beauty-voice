import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

import {
  getChallengeComments,
  createChallengeComment,
  updateChallengeComment,
  deleteChallengeComment,
} from "../../services/challengeService";

import {
  getMyProfile,
} from "../../services/profileService";

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("ko-KR");
}

function isEdited(comment) {
  if (
    !comment?.created_at ||
    !comment?.updated_at
  ) {
    return false;
  }

  const created = new Date(
    comment.created_at
  ).getTime();

  const updated = new Date(
    comment.updated_at
  ).getTime();

  if (
    Number.isNaN(created) ||
    Number.isNaN(updated)
  ) {
    return false;
  }

  return updated - created > 1000;
}

export default function ChallengeDetail({
  challenge,
  onBack,
  onChallengeUpdated,
}) {
  const {
    user,
    isLoggedIn,
  } = useAuth();

  const [comments, setComments] =
    useState([]);

  const [comment, setComment] =
    useState("");

  const [profile, setProfile] =
  useState(null);

  const [writerMode, setWriterMode] =
  useState("anonymous");

  const [isProfileLoading, setIsProfileLoading] =
  useState(true);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState(null);

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    editingText,
    setEditingText,
  ] = useState("");

  const [
    isSavingEdit,
    setIsSavingEdit,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState(null);

  const loadComments =
    useCallback(async () => {
      if (!challenge?.id) {
        setComments([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const data =
          await getChallengeComments(
            challenge.id
          );

        setComments(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "미션 댓글 조회 오류:",
          error
        );

        alert(
          "댓글을 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }, [challenge?.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

useEffect(() => {
  const loadProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    try {
      setIsProfileLoading(true);

      const data =
        await getMyProfile();

      setProfile(data);
    } catch (error) {
      console.error(
        "미션 프로필 조회 오류:",
        error
      );

      setProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  };

  loadProfile();
}, [user?.id]);

  const handleSubmit =
    async event => {
      event.preventDefault();

      if (
        !isLoggedIn ||
        !user?.id
      ) {
        alert(
          "로그인 후 참여할 수 있습니다."
        );
        return;
      }

      const trimmed =
        comment.trim();

      if (!trimmed) {
        alert(
          "참여 내용을 입력해주세요."
        );
        return;
      }

      if (isSubmitting) {
        return;
      }

      try {
        setIsSubmitting(true);

if (
  writerMode === "nickname" &&
  !profile?.nickname
) {
  alert(
    "My Voice에서 닉네임을 먼저 설정해주세요."
  );
  return;
}

const newComment =
  await createChallengeComment({
    challengeId:
      challenge.id,

    content: trimmed,

    userId: user.id,

    writer:
      writerMode === "nickname"
        ? profile.nickname
        : "익명 BC",
  });

        setComments(previous => [
          ...previous,
          newComment,
        ]);

        setComment("");

        onChallengeUpdated?.({
          ...challenge,
          participant_count:
            comments.length + 1,
        });
      } catch (error) {
        console.error(
          "미션 댓글 등록 오류:",
          error
        );

        alert(
          error?.message ||
            "댓글 등록에 실패했습니다."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const handleStartEdit =
    commentItem => {
      setOpenMenuId(null);

      setEditingId(
        commentItem.id
      );

      setEditingText(
        commentItem.content || ""
      );
    };

  const handleCancelEdit =
    () => {
      setEditingId(null);
      setEditingText("");
    };

  const handleSaveEdit =
    async commentId => {
      const trimmed =
        editingText.trim();

      if (!trimmed) {
        alert(
          "댓글 내용을 입력해주세요."
        );
        return;
      }

      if (isSavingEdit) {
        return;
      }

      try {
        setIsSavingEdit(true);

        const updated =
          await updateChallengeComment(
            commentId,
            trimmed
          );

        setComments(previous =>
          previous.map(item =>
            item.id === commentId
              ? {
                  ...item,
                  ...updated,
                }
              : item
          )
        );

        handleCancelEdit();
      } catch (error) {
        console.error(
          "미션 댓글 수정 오류:",
          error
        );

        alert(
          error?.message ||
            "댓글을 수정하지 못했습니다."
        );
      } finally {
        setIsSavingEdit(false);
      }
    };

  const handleDelete =
    async commentId => {
      if (
        !commentId ||
        deletingId
      ) {
        return;
      }

      const shouldDelete =
        window.confirm(
          "이 댓글을 삭제할까요?\n삭제한 댓글은 복구할 수 없습니다."
        );

      if (!shouldDelete) {
        return;
      }

      try {
        setDeletingId(
          commentId
        );

        await deleteChallengeComment(
          commentId
        );

        setComments(previous =>
          previous.filter(
            item =>
              item.id !== commentId
          )
        );

        setOpenMenuId(null);

        onChallengeUpdated?.({
          ...challenge,
          participant_count:
            Math.max(
              comments.length - 1,
              0
            ),
        });
      } catch (error) {
        console.error(
          "미션 댓글 삭제 오류:",
          error
        );

        alert(
          error?.message ||
            "댓글을 삭제하지 못했습니다."
        );
      } finally {
        setDeletingId(null);
      }
    };

  return (
    <section className="panel">
<button
  type="button"
  onClick={onBack}
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    marginBottom: 20,
    padding: "10px 14px",
    border: "1px solid #DDE5F3",
    borderRadius: 12,
    background: "#FFFFFF",
    color: "#163A73",
    fontWeight: 700,
    cursor: "pointer",
  }}
>
  <ArrowLeft size={17} />
  미션 목록
</button>

      <article
        className="card"
        style={{
          marginBottom: 24,
          padding: 26,
        }}
      >
        <span
          style={{
            display:
              "inline-block",
            marginBottom: 12,
            fontSize: 12,
            fontWeight: 900,
            letterSpacing:
              "0.08em",
          }}
        >
          ♥ BEAUTY MISSION
        </span>

        <h2
          style={{
            marginBottom: 12,
          }}
        >
          {challenge.title}
        </h2>

        <p
          className="sub"
          style={{
            marginBottom: 20,
            lineHeight: 1.75,
            whiteSpace:
              "pre-line",
          }}
        >
          {challenge.description}
        </p>

        {challenge.prompt && (
          <div
            style={{
              padding: 16,
              borderRadius: 16,
              background:
                "#faf7ff",
              lineHeight: 1.65,
              fontWeight: 700,
            }}
          >
            {challenge.prompt}
          </div>
        )}
      </article>

      <section>
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 16,
          }}
        >
          <MessageCircle
            size={19}
          />
          참여 댓글{" "}
          {comments.length}
        </h3>

        {isLoggedIn ? (
          <form
            className="form"
            onSubmit={
              handleSubmit
            }
            style={{
              marginBottom: 24,
            }}
          >
            <label htmlFor="challenge-comment">
              이번 주 미션에
              참여해보세요
            </label>

            <textarea
              id="challenge-comment"
              value={comment}
              onChange={event =>
                setComment(
                  event.target.value
                )
              }
              rows={4}
              maxLength={1000}
              placeholder="가볍게 한마디를 남겨주세요."
              disabled={
                isSubmitting
              }
            />

<div
  style={{
    marginTop: 14,
    marginBottom: 14,
  }}
>
  <strong
    style={{
      display: "block",
      marginBottom: 10,
      fontSize: 14,
    }}
  >
    공개 방식
  </strong>

  <div
    style={{
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    }}
  >
    <button
      type="button"
      className={
        writerMode === "anonymous"
          ? ""
          : "soft"
      }
      onClick={() =>
        setWriterMode("anonymous")
      }
    >
      {writerMode === "anonymous"
        ? "●"
        : "○"}{" "}
      익명으로 참여
    </button>

    <button
      type="button"
      className={
        writerMode === "nickname"
          ? ""
          : "soft"
      }
      onClick={() => {
        if (!profile?.nickname) {
          alert(
            "My Voice에서 닉네임을 먼저 설정해주세요."
          );
          return;
        }

        setWriterMode("nickname");
      }}
      disabled={
        isProfileLoading
      }
    >
      {writerMode === "nickname"
        ? "●"
        : "○"}{" "}
      {profile?.nickname
        ? `${profile.nickname}로 참여`
        : "닉네임으로 참여"}
    </button>
  </div>

  {!isProfileLoading &&
    !profile?.nickname && (
      <p
        className="sub"
        style={{
          marginTop: 8,
          marginBottom: 0,
          fontSize: 12,
        }}
      >
        닉네임 참여를 원하면 My Voice에서
        닉네임을 먼저 설정해주세요.
      </p>
    )}
</div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !comment.trim()
              }
            >
              <Send size={17} />

              {isSubmitting
                ? "등록 중..."
                : "참여하기"}
            </button>
          </form>
        ) : (
          <div
            className="empty"
            style={{
              marginBottom: 24,
            }}
          >
            로그인 후 BEAUTY MISSION에
            참여할 수 있습니다.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          {isLoading ? (
            <div className="empty">
              댓글을 불러오는 중...
            </div>
          ) : comments.length ===
            0 ? (
            <div className="empty">
              아직 참여 댓글이
              없습니다. 첫 번째로
              참여해보세요!
            </div>
          ) : (
            comments.map(
              commentItem => {
                const isMine =
                  Boolean(
                    user?.id
                  ) &&
                  commentItem.user_id ===
                    user.id;

                const isEditing =
                  editingId ===
                  commentItem.id;

                return (
                  <article
                    key={
                      commentItem.id
                    }
                    className="card"
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap: 12,
                        marginBottom:
                          8,
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 8,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <strong>
                          {commentItem.writer ||
                            "익명 BC"}
                        </strong>

                        {isMine && (
                          <span
                            style={{
                              padding:
                                "4px 8px",
                              borderRadius:
                                999,
                              background:
                                "#eef7ff",
                              color:
                                "#2463c5",
                              fontSize:
                                11,
                              fontWeight:
                                800,
                            }}
                          >
                            나
                          </span>
                        )}

                        {isEdited(
                          commentItem
                        ) && (
                          <span
                            style={{
                              color:
                                "#999",
                              fontSize:
                                11,
                            }}
                          >
                            수정됨
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 8,
                          position:
                            "relative",
                        }}
                      >
                        <span
                          style={{
                            color:
                              "#999",
                            fontSize:
                              12,
                          }}
                        >
                          {formatDate(
                            commentItem.created_at
                          )}
                        </span>

                        {isMine && (
                          <button
                            type="button"
                            className="soft"
                            onClick={() =>
                              setOpenMenuId(
                                previous =>
                                  previous ===
                                  commentItem.id
                                    ? null
                                    : commentItem.id
                              )
                            }
                            style={{
                              width: 34,
                              height: 34,
                              minWidth:
                                34,
                              padding: 0,
                              borderRadius:
                                999,
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                            }}
                            aria-label="댓글 메뉴"
                          >
                            <MoreHorizontal
                              size={18}
                            />
                          </button>
                        )}

                        {isMine &&
                          openMenuId ===
                            commentItem.id && (
                            <div
                              style={{
                                position:
                                  "absolute",
                                right: 0,
                                top: 40,
                                zIndex:
                                  20,
                                minWidth:
                                  116,
                                padding:
                                  6,
                                background:
                                  "#fff",
                                border:
                                  "1px solid rgba(15, 23, 42, 0.1)",
                                borderRadius:
                                  12,
                                boxShadow:
                                  "0 12px 32px rgba(15, 23, 42, 0.12)",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartEdit(
                                    commentItem
                                  )
                                }
                                style={{
                                  width:
                                    "100%",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: 8,
                                  justifyContent:
                                    "flex-start",
                                  padding:
                                    "9px 10px",
                                  border: 0,
                                  background:
                                    "transparent",
                                }}
                              >
                                <Pencil
                                  size={
                                    15
                                  }
                                />
                                수정
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    commentItem.id
                                  )
                                }
                                disabled={
                                  deletingId ===
                                  commentItem.id
                                }
                                style={{
                                  width:
                                    "100%",
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: 8,
                                  justifyContent:
                                    "flex-start",
                                  padding:
                                    "9px 10px",
                                  border: 0,
                                  background:
                                    "transparent",
                                }}
                              >
                                <Trash2
                                  size={
                                    15
                                  }
                                />

                                {deletingId ===
                                commentItem.id
                                  ? "삭제 중..."
                                  : "삭제"}
                              </button>
                            </div>
                          )}
                      </div>
                    </div>

                    {isEditing ? (
                      <>
                        <textarea
                          value={
                            editingText
                          }
                          onChange={
                            event =>
                              setEditingText(
                                event
                                  .target
                                  .value
                              )
                          }
                          rows={4}
                          maxLength={
                            1000
                          }
                          disabled={
                            isSavingEdit
                          }
                        />

                        <div
                          style={{
                            display:
                              "flex",
                            gap: 8,
                            marginTop:
                              10,
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleSaveEdit(
                                commentItem.id
                              )
                            }
                            disabled={
                              isSavingEdit ||
                              !editingText.trim()
                            }
style={{
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 14px",
  border: "1px solid #163A73",
  borderRadius: 12,
  background: isSavingEdit
    ? "#AEB8C8"
    : "#163A73",
  color: "#FFFFFF",
  fontWeight: 700,
  cursor: isSavingEdit
    ? "not-allowed"
    : "pointer",
}}
                          >
                            <Check
                              size={16}
                            />

                            {isSavingEdit
                              ? "저장 중..."
                              : "저장"}
                          </button>

                          <button
                            type="button"
                            className="soft"
                            onClick={
                              handleCancelEdit
                            }
                            disabled={
                              isSavingEdit
                            }
                          >
                            <X
                              size={16}
                            />
                            취소
                          </button>
                        </div>
                      </>
                    ) : (
                      <p
                        style={{
                          margin: 0,
                          lineHeight: 1.65,
                          whiteSpace:
                            "pre-line",
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {
                          commentItem.content
                        }
                      </p>
                    )}
                  </article>
                );
              }
            )
          )}
        </div>
      </section>
    </section>
  );
}