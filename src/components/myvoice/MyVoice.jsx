import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { getMyPosts } from "../../services/postService";
import { getComments } from "../../services/commentService";

export default function MyVoice({
  onBack,
}) {
  const {
    user,
    isLoggedIn,
    isAuthLoading,
  } = useAuth();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);

  const [openedPostId, setOpenedPostId] =
    useState(null);

  const [commentsByPost, setCommentsByPost] =
    useState({});

  const [commentLoadingPostId, setCommentLoadingPostId] =
    useState(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setPosts([]);
      setOpenedPostId(null);
      setCommentsByPost({});
      setIsLoading(false);
      return;
    }

    loadMyPosts();
  }, [user, isAuthLoading]);

  const loadMyPosts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const data = await getMyPosts(user.id);

      setPosts(data ?? []);
    } catch (error) {
      console.error(error);

      alert(
        "내 게시글을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async postId => {
    try {
      setCommentLoadingPostId(postId);

      const data = await getComments(postId);

      setCommentsByPost(previous => ({
        ...previous,
        [postId]: data ?? [],
      }));
    } catch (error) {
      console.error(
        "운영진 답변 조회 오류",
        error
      );

      alert(
        "운영진 답변을 불러오지 못했습니다."
      );
    } finally {
      setCommentLoadingPostId(null);
    }
  };

  const handleTogglePost = async postId => {
    if (openedPostId === postId) {
      setOpenedPostId(null);
      return;
    }

    setOpenedPostId(postId);

    if (
      !Object.prototype.hasOwnProperty.call(
        commentsByPost,
        postId
      )
    ) {
      await loadComments(postId);
    }
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
            onClick={onBack}
          >
            <ArrowLeft size={17} />
            돌아가기
          </button>
        )}
      </section>
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
          <h2 style={{ marginBottom: 8 }}>
            My Voice
          </h2>

          <p className="sub">
            내가 작성한 공개 게시글과
            운영자에게 전달한 내용을 확인할
            수 있습니다.
          </p>
        </div>

        <button
          type="button"
          className="myVoiceRefreshButton"
          onClick={loadMyPosts}
        >
          <RefreshCw size={16} />
          새로고침
        </button>
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
                post => !post.admin_only
              ).length
            }
          </b>
          <span>공개 글</span>
        </div>

        <div className="storeCard">
          <b>
            {
              posts.filter(
                post => post.admin_only
              ).length
            }
          </b>
          <span>운영자 전달</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
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
            const formattedDate =
              post.created_at
                ? new Date(
                    post.created_at
                  ).toLocaleDateString(
                    "ko-KR"
                  )
                : "";

            const isOpened =
              openedPostId === post.id;

            const comments =
              commentsByPost[post.id] ?? [];

            const isCommentLoading =
              commentLoadingPostId === post.id;

            const displayStatus =
              comments.length > 0
                ? "답변완료"
                : post.status || "접수";

            return (
              <article
                key={post.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    handleTogglePost(post.id)
                  }
                  style={{
                    width: "100%",
                    padding: 22,
                    border: 0,
                    background: "transparent",
                    color: "inherit",
                    font: "inherit",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {post.category}
                      </span>

                      {post.admin_only && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 9px",
                            borderRadius: 999,
                            background: "#f1edff",
                            color: "#6147a8",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          <Lock size={13} />
                          운영자에게 전달
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {comments.length > 0 && (
                        <span
                          style={{
                            padding: "5px 9px",
                            borderRadius: 999,
                            background: "#f1edff",
                            color: "#6147a8",
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          답변 {comments.length}개
                        </span>
                      )}

                      <span
                        style={{
                          padding: "5px 9px",
                          borderRadius: 999,
                          background:
                            displayStatus ===
                            "답변완료"
                              ? "#eaf7ef"
                              : "#e8eef9",
                          color:
                            displayStatus ===
                            "답변완료"
                              ? "#247044"
                              : "#0e2d69",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {displayStatus}
                      </span>

                      {isOpened ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </div>

                  <h3
                    style={{
                      marginBottom: 8,
                    }}
                  >
                    {post.title}
                  </h3>

                  <p
                    className="sub"
                    style={{
                      marginBottom: 16,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {post.content}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 13,
                    }}
                  >
                    <span>
                      {post.store} ·{" "}
                      {formattedDate}
                    </span>

                    <span>
                      공감 {post.likes ?? 0}
                    </span>
                  </div>
                </button>

                {isOpened && (
                  <div
                    style={{
                      padding: "20px 22px 22px",
                      borderTop:
                        "1px solid #ececec",
                      background: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 14,
                      }}
                    >
                      <MessageCircle size={18} />

                      <strong>
                        운영진 답변
                      </strong>

                      <span
                        style={{
                          color: "#777",
                          fontSize: 13,
                        }}
                      >
                        {comments.length}개
                      </span>
                    </div>

                    {isCommentLoading ? (
                      <div className="empty">
                        답변을 불러오는 중...
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="empty">
                        아직 등록된 답변이
                        없습니다.
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        {comments.map(comment => {
                          const commentDate =
                            comment.created_at
                              ? new Date(
                                  comment.created_at
                                ).toLocaleString(
                                  "ko-KR"
                                )
                              : "";

                          return (
                            <div
                              key={comment.id}
                              style={{
                                padding: 16,
                                border:
                                  "1px solid #e8e8e8",
                                borderRadius: 14,
                                background: "#fff",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  gap: 12,
                                  marginBottom: 8,
                                }}
                              >
                                <strong
                                  style={{
                                    fontSize: 14,
                                  }}
                                >
                                  {comment.writer ||
                                    "운영진"}
                                </strong>

                                <span
                                  style={{
                                    color: "#999",
                                    fontSize: 12,
                                  }}
                                >
                                  {commentDate}
                                </span>
                              </div>

                              <p
                                style={{
                                  margin: 0,
                                  lineHeight: 1.65,
                                  whiteSpace:
                                    "pre-line",
                                }}
                              >
                                {comment.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}