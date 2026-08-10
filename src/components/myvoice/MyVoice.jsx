import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  ChevronRight,
  Lock,
  MessageCircle,
  Pencil,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import BoardDetail from "../board/BoardDetail";

import { getMyPosts } from "../../services/postService";
import { getComments } from "../../services/commentService";

import {
  getMyProfile,
  saveMyNickname,
} from "../../services/profileService";

export default function MyVoice({ onBack }) {
  const {
    user,
    isLoggedIn,
    isAuthLoading,
  } = useAuth();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  const [
    replyInfoByPost,
    setReplyInfoByPost,
  ] = useState({});

  const [profile, setProfile] = useState(null);
  const [nickname, setNickname] = useState("");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  const loadMyProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setNickname("");
      setIsProfileLoading(false);
      return;
    }

    try {
      setIsProfileLoading(true);

      const data = await getMyProfile();

      setProfile(data);
      setNickname(data?.nickname || "");
    } catch (error) {
      console.error(
        "My Voice 프로필 조회 오류:",
        error
      );
    } finally {
      setIsProfileLoading(false);
    }
  }, [user?.id]);

  const loadMyPosts = useCallback(async () => {
    if (!user?.id) {
      setPosts([]);
      setReplyInfoByPost({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const data = await getMyPosts(user.id);
      const postList = Array.isArray(data) ? data : [];

      setPosts(postList);

      const replyEntries = await Promise.all(
        postList.map(async post => {
          try {
            const comments = await getComments(post.id);

            const commentList =
              Array.isArray(comments)
                ? comments
                : [];

            return [
              post.id,
              {
                totalCount:
                  commentList.length,
                hasAdminReply:
                  commentList.some(
                    comment =>
                      comment.is_admin
                  ),
              },
            ];
          } catch (error) {
            console.error(
              `답글 정보 조회 오류 (${post.id}):`,
              error
            );

            return [
              post.id,
              {
                totalCount: 0,
                hasAdminReply: false,
              },
            ];
          }
        })
      );

      setReplyInfoByPost(
        Object.fromEntries(replyEntries)
      );
    } catch (error) {
      console.error(
        "My Voice 게시글 조회 오류:",
        error
      );

      alert("내 게시글을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user?.id) {
      setPosts([]);
      setSelectedPost(null);
      setReplyInfoByPost({});
      setProfile(null);
      setNickname("");
      setIsLoading(false);
      setIsProfileLoading(false);
      return;
    }

    loadMyPosts();
    loadMyProfile();
  }, [
    user?.id,
    isAuthLoading,
    loadMyPosts,
    loadMyProfile,
  ]);

  const handleSaveNickname = async () => {
    const trimmed = nickname.trim();

    if (trimmed.length < 2) {
      alert("닉네임은 2자 이상 입력해주세요.");
      return;
    }

    if (trimmed.length > 12) {
      alert("닉네임은 12자 이하로 입력해주세요.");
      return;
    }

    try {
      setIsSavingNickname(true);

      const savedProfile =
        await saveMyNickname(trimmed);

      setProfile(savedProfile);
      setNickname(savedProfile.nickname);
      setIsEditingNickname(false);

      alert(
        profile
          ? "닉네임이 변경되었습니다."
          : "닉네임이 설정되었습니다."
      );
    } catch (error) {
      console.error(
        "닉네임 저장 오류:",
        error
      );

      alert(
        error?.message ||
          "닉네임 저장에 실패했습니다."
      );
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleOpenDetail = post => {
    setSelectedPost(post);
  };

  const handleCloseDetail = async () => {
    setSelectedPost(null);
    await loadMyPosts();
  };

  const handlePostUpdated = updatedPost => {
    if (!updatedPost?.id) {
      return;
    }

    setPosts(previous =>
      previous.map(post =>
        post.id === updatedPost.id
          ? {
              ...post,
              ...updatedPost,
            }
          : post
      )
    );

    setSelectedPost(previous =>
      previous?.id === updatedPost.id
        ? {
            ...previous,
            ...updatedPost,
          }
        : previous
    );
  };

  const handlePostDeleted = deletedPostId => {
    const postId =
      deletedPostId ??
      selectedPost?.id;

    if (!postId) {
      return;
    }

    setPosts(previous =>
      previous.filter(
        post => post.id !== postId
      )
    );

    setReplyInfoByPost(previous => {
      const next = {
        ...previous,
      };

      delete next[postId];

      return next;
    });

    setSelectedPost(null);
  };

  if (isAuthLoading) {
    return (
      <section className="panel">
        <div className="card">
          로그인 정보를 확인하는 중...
        </div>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="panel center">
        <MessageCircle size={48} />

        <h2>My Voice</h2>

        <p className="sub">
          로그인 후 내가 작성한 글을
          확인할 수 있습니다.
        </p>

        {onBack && (
          <button
            type="button"
            className="soft"
            onClick={onBack}
          >
            <ArrowLeft size={17} />
            돌아가기
          </button>
        )}
      </section>
    );
  }

  if (selectedPost) {
    return (
      <BoardDetail
        post={selectedPost}
        currentUser={user}
        onBack={handleCloseDetail}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
      />
    );
  }

  return (
    <section className="panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              marginBottom: 8,
            }}
          >
            My Voice
          </h2>

          <p className="sub">
            내가 작성한 공개 게시글과
            운영자에게 전달한 내용을
            확인하고 관리할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="myVoiceRefreshButton"
          onClick={loadMyPosts}
          disabled={isLoading}
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      <div
        className="card"
        style={{
          padding: 22,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "#f1edff",
                color: "#6147a8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <UserRound size={20} />
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  marginBottom: 6,
                }}
              >
                내 닉네임
              </strong>

              {isProfileLoading ? (
                <span className="sub">
                  닉네임을 확인하는 중...
                </span>
              ) : !isEditingNickname ? (
                <>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    {profile?.nickname ||
                      "아직 설정하지 않았어요."}
                  </div>

                  <p
                    className="sub"
                    style={{
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    챌린지에서 닉네임으로 참여할 경우 이 이름으로 표시됩니다.
                  </p>
                </>
              ) : (
                <div
                  style={{
                    marginTop: 8,
                  }}
                >
                  <input
                    type="text"
                    value={nickname}
                    onChange={event =>
                      setNickname(
                        event.target.value
                      )
                    }
                    maxLength={12}
                    placeholder="2~12자 닉네임"
                    disabled={isSavingNickname}
                    style={{
                      width: "100%",
                      maxWidth: 300,
                      padding: "11px 13px",
                      border:
                        "1px solid #ddd",
                      borderRadius: 12,
                      font: "inherit",
                    }}
                  />

                  <div
                    style={{
                      marginTop: 6,
                      color: "#999",
                      fontSize: 12,
                    }}
                  >
                    {nickname.trim().length}/12자 ·
                    다른 구성원과 중복할 수 없습니다.
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isProfileLoading &&
            (!isEditingNickname ? (
              <button
                type="button"
                className="soft"
                onClick={() => {
                  setNickname(
                    profile?.nickname || ""
                  );
                  setIsEditingNickname(true);
                }}
              >
                <Pencil size={15} />
                {profile
                  ? "닉네임 변경"
                  : "닉네임 설정"}
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  className="soft"
                  onClick={() => {
                    setNickname(
                      profile?.nickname || ""
                    );
                    setIsEditingNickname(false);
                  }}
                  disabled={isSavingNickname}
                >
                  취소
                </button>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveNickname}
                  disabled={
                    isSavingNickname ||
                    nickname.trim().length < 2
                  }
                >
                  {isSavingNickname
                    ? "저장 중..."
                    : "저장"}
                </button>
              </div>
            ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="storeCard">
          <b>{posts.length}</b>
          <span>전체</span>
        </div>

        <div className="storeCard">
          <b>
            {
              posts.filter(
                post =>
                  !post.admin_only
              ).length
            }
          </b>
          <span>공개 글</span>
        </div>

        <div className="storeCard">
          <b>
            {
              posts.filter(
                post =>
                  post.admin_only
              ).length
            }
          </b>
          <span>운영자 전달</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        {isLoading ? (
          <div className="card">
            내 게시글을 불러오는 중...
          </div>
        ) : posts.length === 0 ? (
          <div className="empty">
            아직 작성한 게시글이 없습니다.
          </div>
        ) : (
          posts.map(post => {
            const replyInfo =
              replyInfoByPost[
                post.id
              ] || {
                totalCount: 0,
                hasAdminReply: false,
              };

            const displayStatus =
              replyInfo.hasAdminReply
                ? "답변완료"
                : post.status ||
                  "접수";

            return (
              <article
                key={post.id}
                className="card"
                style={{
                  padding: "18px 22px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 9,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {post.category || "기타"}
                      </span>

                      {post.admin_only && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 8px",
                            borderRadius: 999,
                            background: "#f1edff",
                            color: "#6147a8",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          <Lock size={12} />
                          운영자에게 전달
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize: 17,
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                      }}
                    >
                      {post.title}
                    </h3>
                  </div>

                  <span
                    style={{
                      flexShrink: 0,
                      padding: "5px 9px",
                      borderRadius: 999,
                      background:
                        displayStatus === "답변완료"
                          ? "#eaf7ef"
                          : "#e8eef9",
                      color:
                        displayStatus === "답변완료"
                          ? "#247044"
                          : "#0e2d69",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {displayStatus}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop:
                      "1px solid #edf1f6",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#667085",
                      fontSize: 13,
                    }}
                  >
                    <MessageCircle size={15} />
                    답글 {replyInfo.totalCount}
                  </span>

                  <button
                    type="button"
                    className="soft"
                    onClick={() =>
                      handleOpenDetail(post)
                    }
                    style={{
                      padding: "7px 11px",
                      fontSize: 13,
                    }}
                  >
                    상세보기
                    <ChevronRight size={15} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}