import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  MessageCircle,
  ThumbsUp,
  Lock,
  Send,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

import {
  createComment,
  getComments,
} from "../../services/commentService";

function getAnonymousBcNumber(postId, userId) {
  if (!postId || !userId) {
    return 0;
  }

  const value = `${postId}-${userId}`;

  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // BC#100부터 BC#999 사이의 번호 생성
  return (hash >>> 0) % 900 + 100;
}

export default function BoardDetail({
  post,
  onBack,
}) {
  const {
    user,
    isLoggedIn,
  } = useAuth();

  const [liked, setLiked] =
    useState(false);

  const [likeCount, setLikeCount] =
    useState(post.likes ?? 0);

  const [comment, setComment] =
    useState("");

  const [comments, setComments] =
    useState([]);

  const [isCommentLoading, setIsCommentLoading] =
    useState(true);

  const [isCommentSubmitting, setIsCommentSubmitting] =
    useState(false);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    try {
      setIsCommentLoading(true);

      const data = await getComments(
        post.id
      );

      setComments(data ?? []);
    } catch (error) {
      console.error(
        "댓글 조회 오류",
        error
      );

      alert(
        "댓글을 불러오지 못했습니다."
      );
    } finally {
      setIsCommentLoading(false);
    }
  };

  const handleLike = () => {
    setLiked(previous => !previous);

    setLikeCount(previous =>
      liked
        ? Math.max(previous - 1, 0)
        : previous + 1
    );
  };

  const handleSubmitComment = async event => {
    event.preventDefault();

    if (!isLoggedIn || !user) {
      alert(
        "로그인 후 댓글을 작성할 수 있습니다."
      );
      return;
    }

    const trimmedComment =
      comment.trim();

    if (!trimmedComment) {
      alert(
        "댓글 내용을 입력해주세요."
      );
      return;
    }

    if (isCommentSubmitting) return;

    try {
      setIsCommentSubmitting(true);

      const newComment =
        await createComment({
          postId: post.id,
          content: trimmedComment,

          // 익명 게시판이므로 실제 이름은 저장하지 않음
          writer: "익명 BC",

          userId: user.id,
          isAdmin: false,
        });

      setComments(previous => [
        ...previous,
        newComment,
      ]);

      setComment("");
    } catch (error) {
      console.error(
        "댓글 등록 오류",
        error
      );

      alert(
        "댓글을 등록하지 못했습니다."
      );
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const formattedPostDate =
    post.created_at
      ? new Date(
          post.created_at
        ).toLocaleDateString("ko-KR")
      : post.createdAt || "";

  return (
    <section className="panel">
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={18} />
        목록으로
      </button>

      <article className="card">
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {post.category}
          </span>

          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {post.status || "접수"}
          </span>
        </div>

        <h2
          style={{
            marginBottom: 14,
          }}
        >
          {post.title}
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 22,
            fontSize: 13,
          }}
        >
          <span>익명</span>

          <span>·</span>

          {post.storePrivate ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Lock size={14} />
              매장 비공개
            </span>
          ) : (
            <span>
              {post.store}
            </span>
          )}

          <span>·</span>

          <span>
            {formattedPostDate}
          </span>
        </div>

        <p
          style={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.8,
            marginBottom: 28,
          }}
        >
          {post.content}
        </p>

        <button
          type="button"
          onClick={handleLike}
          className={
            liked ? "active" : ""
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <ThumbsUp size={17} />
          공감 {likeCount}
        </button>
      </article>

      <div
        style={{
          marginTop: 28,
        }}
      >
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 16,
          }}
        >
          <MessageCircle size={19} />
          댓글 {comments.length}
        </h3>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {isCommentLoading ? (
            <div className="card">
              댓글을 불러오는 중...
            </div>
          ) : comments.length === 0 ? (
            <div className="empty">
              아직 등록된 댓글이 없습니다.
            </div>
          ) : (
		comments.map(item => {
		  const isAdmin = item.is_admin;

		  const isPostWriter =
		    item.user_id === post.user_id;

		  const isMyComment =
		    item.user_id === user?.id;

		  const anonymousNumber =
		    getAnonymousBcNumber(
		      post.id,
		      item.user_id
		    );

              const formattedCommentDate =
                item.created_at
                  ? new Date(
                      item.created_at
                    ).toLocaleString(
                      "ko-KR"
                    )
                  : "";

              return (
                <div
                  key={item.id}
                  className="card"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                      flexWrap: "wrap",
                    }}
                  >
		<strong>
		  {isAdmin
		    ? "운영진"
		    : `BC·${anonymousNumber}`}
		</strong>

                    {item.is_admin && (
                      <span
                        style={{
                          padding:
                            "4px 8px",
                          borderRadius: 999,
                          background:
                            "#f1edff",
                          color:
                            "#6147a8",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        운영진
                      </span>
                    )}

                    {!item.is_admin &&
                      isPostWriter && (
                        <span
                          style={{
                            padding:
                              "4px 8px",
                            borderRadius:
                              999,
                            background:
                              "#e8eef9",
                            color:
                              "#0e2d69",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          작성자
                        </span>
                      )}
		{!isAdmin && isMyComment && (
		  <span
		    style={{
		      padding: "4px 8px",
		      borderRadius: 999,
		      background: "#eef7ff",
		      color: "#2463c5",
		      fontSize: 11,
		      fontWeight: 800,
		    }}
		  >
		    나
		  </span>
		)}
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        color: "#777",
                      }}
                    >
                      {formattedCommentDate}
                    </span>
                  </div>

                  <p
                    style={{
                      lineHeight: 1.6,
                      whiteSpace:
                        "pre-line",
                      margin: 0,
                    }}
                  >
                    {item.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {isLoggedIn ? (
          <form
            onSubmit={
              handleSubmitComment
            }
            className="form"
          >
            <label>
              댓글 작성
            </label>

            <textarea
              value={comment}
              onChange={event =>
                setComment(
                  event.target.value
                )
              }
              placeholder="서로를 존중하는 댓글을 남겨주세요."
              disabled={
                isCommentSubmitting
              }
            />

            <button
              type="submit"
              disabled={
                isCommentSubmitting ||
                !comment.trim()
              }
            >
              <Send size={17} />

              {isCommentSubmitting
                ? "등록 중..."
                : "댓글 등록"}
            </button>
          </form>
        ) : (
          <div className="empty">
            로그인 후 댓글을 작성할 수
            있습니다.
          </div>
        )}
      </div>
    </section>
  );
}