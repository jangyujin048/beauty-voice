import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  ChevronUp,
  Lock,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";

import {
  getAdminPosts,
  updatePostStatus,
} from "../../services/postService";

import {
  createComment,
  getComments,
} from "../../services/commentService";

export default function AdminBoardPosts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("전체");
  const [statusFilter, setStatusFilter] =
    useState("전체");

  const [selectedPostId, setSelectedPostId] =
    useState(null);

  const [commentsByPost, setCommentsByPost] =
    useState({});

  const [commentLoadingPostId, setCommentLoadingPostId] =
    useState(null);

  const [commentText, setCommentText] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const loadPosts = async () => {
    try {
      setIsLoading(true);

      const data = await getAdminPosts();

      setPosts(data ?? []);
    } catch (error) {
      console.error(error);

      alert(
        "운영자에게 전달된 게시글을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const categories = useMemo(() => {
    const values = posts
      .map(post => post.category)
      .filter(Boolean);

    return ["전체", ...new Set(values)];
  }, [posts]);

  const statuses = [
    "전체",
    "접수",
    "검토중",
    "처리중",
    "답변완료",
  ];

  const filteredPosts = useMemo(() => {
    const normalizedKeyword =
      keyword.trim().toLowerCase();

    return posts.filter(post => {
      const searchTarget =
        `${post.title ?? ""} ${post.content ?? ""} ${post.store ?? ""}`
          .toLowerCase();

      const matchesKeyword =
        !normalizedKeyword ||
        searchTarget.includes(normalizedKeyword);

      const matchesCategory =
        categoryFilter === "전체" ||
        post.category === categoryFilter;

      const matchesStatus =
        statusFilter === "전체" ||
        (post.status || "접수") === statusFilter;

      return (
        matchesKeyword &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    posts,
    keyword,
    categoryFilter,
    statusFilter,
  ]);

  const resetFilters = () => {
    setKeyword("");
    setCategoryFilter("전체");
    setStatusFilter("전체");
  };

  const loadComments = async postId => {
    try {
      setCommentLoadingPostId(postId);

      const data = await getComments(postId);

      setCommentsByPost(previous => ({
        ...previous,
        [postId]: data,
      }));
    } catch (error) {
	console.error(error.message);
	console.error(error.details);
	console.error(error.hint);
	console.error(error.code);
    } finally {
      setCommentLoadingPostId(null);
    }
  };

  const handleTogglePost = async postId => {
    if (selectedPostId === postId) {
      setSelectedPostId(null);
      setCommentText("");
      return;
    }

    setSelectedPostId(postId);
    setCommentText("");

    await loadComments(postId);
  };

  const handleSubmitComment = async post => {
    const trimmedComment = commentText.trim();

    if (!trimmedComment) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      const newComment = await createComment({
        postId: post.id,
        content: trimmedComment,
        writer: "운영진",
      });

      setCommentsByPost(previous => ({
        ...previous,
        [post.id]: [
          ...(previous[post.id] ?? []),
          newComment,
        ],
      }));

      if (post.status !== "답변완료") {
        const updatedPost =
          await updatePostStatus(
            post.id,
            "답변완료"
          );

        setPosts(previous =>
          previous.map(item =>
            item.id === post.id
              ? {
                  ...item,
                  ...updatedPost,
                }
              : item
          )
        );
      }

      setCommentText("");

      alert("답변이 등록되었습니다.");
    } catch (error) {
      console.error(error);

      alert(
        "답변을 등록하지 못했습니다. Supabase 권한 설정을 확인해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h3 style={{ marginBottom: 6 }}>
            Beauty Voice 관리
          </h3>

          <p className="sub">
            운영자에게 전달된 게시글을 확인하고
            답변을 등록합니다.
          </p>
        </div>

        <button
          type="button"
          className="soft"
          onClick={loadPosts}
        >
          <RefreshCw size={16} />
          새로고침
        </button>
      </div>

      <div className="adminBoardFilters">
        <div className="adminBoardSearch">
          <Search size={18} />

          <input
            value={keyword}
            onChange={event =>
              setKeyword(event.target.value)
            }
            placeholder="제목, 내용, 매장 검색"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={event =>
            setCategoryFilter(event.target.value)
          }
        >
          {categories.map(category => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={event =>
            setStatusFilter(event.target.value)
          }
        >
          {statuses.map(status => (
            <option
              key={status}
              value={status}
            >
              {status}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="soft"
          onClick={resetFilters}
        >
          초기화
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div className="storeCard">
          <b>{posts.length}</b>
          <span>전체 전달</span>
        </div>

        <div className="storeCard">
          <b>
            {
              posts.filter(
                post =>
                  (post.status || "접수") ===
                  "접수"
              ).length
            }
          </b>

          <span>신규 접수</span>
        </div>

        <div className="storeCard">
          <b>
            {
              posts.filter(
                post =>
                  post.status === "답변완료"
              ).length
            }
          </b>

          <span>답변 완료</span>
        </div>
      </div>

      <p
        style={{
          marginBottom: 14,
          fontSize: 14,
          fontWeight: 800,
        }}
      >
        검색 결과 {filteredPosts.length}건
      </p>

      {isLoading ? (
        <div className="empty">
          게시글을 불러오는 중...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="empty">
          조건에 맞는 전달 글이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          {filteredPosts.map(post => {
            const isSelected =
              selectedPostId === post.id;

            const comments =
              commentsByPost[post.id] ?? [];

            const formattedDate =
              post.created_at
                ? new Date(
                    post.created_at
                  ).toLocaleDateString("ko-KR")
                : "";

            return (
              <article
                key={post.id}
                className="card adminVoiceCard"
              >
                <button
                  type="button"
                  className="adminVoiceCardHeader"
                  onClick={() =>
                    handleTogglePost(post.id)
                  }
                >
                  <div
                    style={{
                      width: "100%",
                      textAlign: "left",
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
                        <strong>
                          {post.category}
                        </strong>

                        <span className="adminOnlyBadge">
                          <Lock size={13} />
                          운영자에게 전달
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span className="postStatusBadge">
                          {post.status || "접수"}
                        </span>

                        {isSelected ? (
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
                        whiteSpace: "pre-line",
                        marginBottom: 16,
                      }}
                    >
                      {post.content}
                    </p>

                    <small>
                      {post.store} · {formattedDate}
                    </small>
                  </div>
                </button>

                {isSelected && (
                  <div className="adminReplyArea">
                    <div className="adminReplyTitle">
                      <MessageCircle size={18} />

                      <strong>
                        운영진 답변
                      </strong>

                      <span>
                        {comments.length}개
                      </span>
                    </div>

                    {commentLoadingPostId ===
                    post.id ? (
                      <div className="adminReplyEmpty">
                        답변을 불러오는 중...
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="adminReplyEmpty">
                        아직 등록된 답변이 없습니다.
                      </div>
                    ) : (
                      <div className="adminReplyList">
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
                              className="adminReplyItem"
                            >
                              <div className="adminReplyMeta">
                                <strong>
                                  {comment.writer ||
                                    "운영진"}
                                </strong>

                                <span>
                                  {commentDate}
                                </span>
                              </div>

                              <p>
                                {comment.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="adminReplyComposer">
                      <textarea
                        value={commentText}
                        onChange={event =>
                          setCommentText(
                            event.target.value
                          )
                        }
                        placeholder="구성원에게 전달할 답변을 입력해주세요."
                        rows={4}
                      />

                      <div className="adminReplyActions">
                        <span>
                          답변 등록 시 게시글 상태가
                          답변완료로 변경됩니다.
                        </span>

                        <button
                          type="button"
                          className="primary"
                          disabled={isSubmitting}
                          onClick={() =>
                            handleSubmitComment(post)
                          }
                        >
                          <Send size={16} />

                          {isSubmitting
                            ? "등록 중..."
                            : "답변 등록"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}