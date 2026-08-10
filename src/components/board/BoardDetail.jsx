import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  Check,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from "../../services/commentService";
import {
  deletePost,
  updatePost,
} from "../../services/postService";

const LIKE_STORAGE_KEY =
  "beauty_voice_liked_post_ids";

const CATEGORIES = [
  "질문",
  "운영 제안",
  "도움 요청",
  "아이디어",
  "기타",
];

const STORES = [
  "올리브영N 성수",
  "올리브영 뷰티 맨션 성수",
  "올리브영 센트럴 강남 타운",
];

const styles = {
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  postHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  category: {
    fontSize: 13,
    fontWeight: 700,
  },
  status: {
    fontSize: 12,
    fontWeight: 700,
  },
  title: {
    marginBottom: 14,
    overflowWrap: "anywhere",
  },
  metadata: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 22,
    fontSize: 13,
  },
  privateStore: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  content: {
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    lineHeight: 1.8,
    marginBottom: 28,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  actionButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },
  dangerButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },
  commentsSection: {
    marginTop: 28,
  },
  commentsTitle: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginBottom: 16,
  },
  commentList: {
    display: "grid",
    gap: 12,
    marginBottom: 20,
  },
  commentHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  commentDate: {
    marginLeft: "auto",
    fontSize: 12,
    color: "#777",
  },
  commentContent: {
    lineHeight: 1.6,
    whiteSpace: "pre-line",
    overflowWrap: "anywhere",
    margin: 0,
  },
  badge: {
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
  },
  adminBadge: {
    background: "#f1edff",
    color: "#6147a8",
  },
  writerBadge: {
    background: "#e8eef9",
    color: "#0e2d69",
  },
  myBadge: {
    background: "#eef7ff",
    color: "#2463c5",
  },
  commentMenuWrap: {
    position: "relative",
    marginLeft: 4,
  },
  commentMenuButton: {
    width: 32,
    height: 32,
    minWidth: 32,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  commentMenu: {
    position: "absolute",
    top: 36,
    right: 0,
    zIndex: 20,
    minWidth: 112,
    padding: 6,
    background: "#fff",
    border: "1px solid rgba(15, 23, 42, 0.1)",
    borderRadius: 12,
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
  },
  commentMenuItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    padding: "9px 10px",
    border: 0,
    background: "transparent",
  },
  commentEditActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  editedText: {
    fontSize: 11,
    color: "#8a8a8a",
  },
  editActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
};

function getAnonymousBcNumber(postId, userId) {
  if (!postId || !userId) {
    return 0;
  }

  const value = `${postId}-${userId}`;
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) % 900 + 100;
}

function formatDate(value, includeTime = false) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return includeTime
    ? date.toLocaleString("ko-KR")
    : date.toLocaleDateString("ko-KR");
}

function readLikedPostIds() {
  try {
    const storedValue =
      localStorage.getItem(LIKE_STORAGE_KEY);
    const parsedValue = JSON.parse(
      storedValue || "[]"
    );

    return Array.isArray(parsedValue)
      ? parsedValue
      : [];
  } catch {
    return [];
  }
}

function writeLikedPostIds(postIds) {
  try {
    localStorage.setItem(
      LIKE_STORAGE_KEY,
      JSON.stringify(postIds)
    );
  } catch {
    // localStorage 사용이 제한된 환경에서는
    // 현재 화면 상태만 유지합니다.
  }
}

function CommentBadge({
  type,
  children,
}) {
  const typeStyle = {
    admin: styles.adminBadge,
    writer: styles.writerBadge,
    mine: styles.myBadge,
  }[type];

  return (
    <span
      style={{
        ...styles.badge,
        ...typeStyle,
      }}
    >
      {children}
    </span>
  );
}

export default function BoardDetail({
  post,
  currentUser,
  onBack,
  onEdit,
  onPostUpdated,
  onPostDeleted,
}) {
  const {
    user: authUser,
    isLoggedIn,
  } = useAuth();

  const user = currentUser ?? authUser;
  const isOwner =
    Boolean(user?.id) &&
    user.id === post?.user_id;

  const [currentPost, setCurrentPost] =
    useState(post);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  const [isLiked, setIsLiked] =
    useState(false);
  const [isLikeSubmitting, setIsLikeSubmitting] =
    useState(false);

  const [isCommentLoading, setIsCommentLoading] =
    useState(true);
  const [
    isCommentSubmitting,
    setIsCommentSubmitting,
  ] = useState(false);

  const [
    openCommentMenuId,
    setOpenCommentMenuId,
  ] = useState(null);
  const [
    editingCommentId,
    setEditingCommentId,
  ] = useState(null);
  const [
    editingCommentText,
    setEditingCommentText,
  ] = useState("");
  const [
    isCommentSaving,
    setIsCommentSaving,
  ] = useState(false);
  const [
    deletingCommentId,
    setDeletingCommentId,
  ] = useState(null);

  const [isEditing, setIsEditing] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);
  const [isDeleting, setIsDeleting] =
    useState(false);

  const [editForm, setEditForm] = useState({
    category: post?.category || CATEGORIES[0],
    title: post?.title || "",
    content: post?.content || "",
    store: post?.store || STORES[0],
  });

  useEffect(() => {
    setCurrentPost(post);
    setEditForm({
      category: post?.category || CATEGORIES[0],
      title: post?.title || "",
      content: post?.content || "",
      store: post?.store || STORES[0],
    });
    setIsEditing(false);
    setOpenCommentMenuId(null);
    setEditingCommentId(null);
    setEditingCommentText("");
  }, [post]);

  useEffect(() => {
    const likedPostIds = readLikedPostIds();
    setIsLiked(likedPostIds.includes(post?.id));
  }, [post?.id]);

  const loadComments = useCallback(async () => {
    if (!post?.id) {
      setComments([]);
      setIsCommentLoading(false);
      return;
    }

    try {
      setIsCommentLoading(true);

      const data = await getComments(post.id);
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "Beauty Voice 댓글 조회 오류:",
        error
      );
      alert("댓글을 불러오지 못했습니다.");
    } finally {
      setIsCommentLoading(false);
    }
  }, [post?.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const formattedPostDate = useMemo(
    () =>
      formatDate(
        currentPost?.created_at ||
          currentPost?.createdAt
      ),
    [
      currentPost?.created_at,
      currentPost?.createdAt,
    ]
  );

  const updateCurrentPost = useCallback(
    updatedPost => {
      setCurrentPost(previous => ({
        ...previous,
        ...updatedPost,
      }));

      onPostUpdated?.({
        ...currentPost,
        ...updatedPost,
      });
    },
    [currentPost, onPostUpdated]
  );

  const handleLike = async () => {
    if (!isLoggedIn || !user?.id) {
      alert("로그인 후 공감할 수 있습니다.");
      return;
    }

    if (isLikeSubmitting || !currentPost?.id) {
      return;
    }

    const nextIsLiked = !isLiked;
    const previousLikeCount =
      currentPost.likes ?? 0;
    const nextLikeCount = nextIsLiked
      ? previousLikeCount + 1
      : Math.max(previousLikeCount - 1, 0);

    setIsLiked(nextIsLiked);
    setCurrentPost(previous => ({
      ...previous,
      likes: nextLikeCount,
    }));
    setIsLikeSubmitting(true);

    try {
      const updatedPost = await updatePost(
        currentPost.id,
        {
          likes: nextLikeCount,
        }
      );

      const likedPostIds = readLikedPostIds();
      const nextLikedPostIds = nextIsLiked
        ? Array.from(
            new Set([
              ...likedPostIds,
              currentPost.id,
            ])
          )
        : likedPostIds.filter(
            postId => postId !== currentPost.id
          );

      writeLikedPostIds(nextLikedPostIds);
      updateCurrentPost(updatedPost);
    } catch (error) {
      console.error(
        "Beauty Voice 공감 처리 오류:",
        error
      );

      setIsLiked(!nextIsLiked);
      setCurrentPost(previous => ({
        ...previous,
        likes: previousLikeCount,
      }));

      alert("공감을 처리하지 못했습니다.");
    } finally {
      setIsLikeSubmitting(false);
    }
  };

  const handleSubmitComment = async event => {
    event.preventDefault();

    if (!isLoggedIn || !user?.id) {
      alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }

    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    if (isCommentSubmitting) {
      return;
    }

    try {
      setIsCommentSubmitting(true);

      const newComment = await createComment({
        postId: currentPost.id,
        content: trimmedComment,
        writer: "익명 BC",
        userId: user.id,
        isAdmin: false,
      });

      setComments(previous => [
        ...previous,
        newComment,
      ]);
      setComment("");

      onPostUpdated?.({
        ...currentPost,
        comment_count: comments.length + 1,
      });
    } catch (error) {
      console.error(
        "Beauty Voice 댓글 등록 오류:",
        error
      );
      alert("댓글을 등록하지 못했습니다.");
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleStartCommentEdit = item => {
    setOpenCommentMenuId(null);
    setEditingCommentId(item.id);
    setEditingCommentText(item.content || "");
  };

  const handleCancelCommentEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleSaveComment = async commentId => {
    const trimmedContent =
      editingCommentText.trim();

    if (!trimmedContent) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    if (isCommentSaving) {
      return;
    }

    try {
      setIsCommentSaving(true);

      const updatedComment =
        await updateComment(
          commentId,
          trimmedContent
        );

      setComments(previous =>
        previous.map(item =>
          item.id === commentId
            ? {
                ...item,
                ...updatedComment,
                __edited: true,
              }
            : item
        )
      );

      handleCancelCommentEdit();
    } catch (error) {
      console.error(
        "Beauty Voice 댓글 수정 오류:",
        error
      );
      alert(
        error?.message ||
          "댓글을 수정하지 못했습니다."
      );
    } finally {
      setIsCommentSaving(false);
    }
  };

  const handleDeleteComment =
    async commentId => {
      if (
        !commentId ||
        deletingCommentId
      ) {
        return;
      }

      const shouldDelete = window.confirm(
        "이 댓글을 삭제할까요?\n삭제한 댓글은 복구할 수 없습니다."
      );

      if (!shouldDelete) {
        return;
      }

      try {
        setDeletingCommentId(commentId);

        await deleteComment(commentId);

        setComments(previous =>
          previous.filter(
            item => item.id !== commentId
          )
        );

        setOpenCommentMenuId(null);

        onPostUpdated?.({
          ...currentPost,
          comment_count: Math.max(
            comments.length - 1,
            0
          ),
        });
      } catch (error) {
        console.error(
          "Beauty Voice 댓글 삭제 오류:",
          error
        );
        alert(
          error?.message ||
            "댓글을 삭제하지 못했습니다."
        );
      } finally {
        setDeletingCommentId(null);
      }
    };

  const handleOpenPostEdit = () => {
    if (!isOwner) {
      return;
    }

    if (onEdit) {
      onEdit(currentPost);
      return;
    }

    setIsEditing(true);
  };

  const handleEditChange = event => {
    const {
      name,
      value,
    } = event.target;

    setEditForm(previous => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCancelEdit = () => {
    setEditForm({
      category:
        currentPost?.category || CATEGORIES[0],
      title: currentPost?.title || "",
      content: currentPost?.content || "",
      store: currentPost?.store || STORES[0],
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async event => {
    event.preventDefault();

    const title = editForm.title.trim();
    const content = editForm.content.trim();

    if (!title || !content) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    if (!isOwner || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const updatedPost = await updatePost(
        currentPost.id,
        {
          category: editForm.category,
          title,
          content,
          store: editForm.store,
        }
      );

      updateCurrentPost(updatedPost);
      setIsEditing(false);
      alert("게시글이 수정되었습니다.");
    } catch (error) {
      console.error(
        "Beauty Voice 게시글 수정 오류:",
        error
      );
      alert("게시글을 수정하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isOwner || isDeleting) {
      return;
    }

    const shouldDelete = window.confirm(
      "이 게시글을 삭제할까요?\n삭제한 글은 복구할 수 없습니다."
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setIsDeleting(true);
      await deletePost(currentPost.id);
      onPostDeleted?.(currentPost.id);
    } catch (error) {
      console.error(
        "Beauty Voice 게시글 삭제 오류:",
        error
      );
      alert("게시글을 삭제하지 못했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentPost) {
    return (
      <section className="panel">
        <div className="empty">
          게시글 정보를 확인할 수 없습니다.
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <button
        type="button"
        className="soft"
        onClick={onBack}
        disabled={
          isSaving ||
          isDeleting ||
          isCommentSubmitting
        }
        style={styles.backButton}
      >
        <ArrowLeft size={18} />
        목록으로
      </button>

      <article className="card">
        {isEditing ? (
         
<form
  onSubmit={handleSaveEdit}
  style={{
    maxWidth: 820,
    margin: "0 auto",
  }}
>
  {/* 수정 폼 헤더 */}
  <div
    style={{
      marginBottom: 28,
      paddingBottom: 20,
      borderBottom: "1px solid #E8EDF5",
    }}
  >
    <h2
      style={{
        margin: "0 0 6px",
        fontSize: 24,
      }}
    >
      Beauty Voice 수정
    </h2>

    <p
      className="sub"
      style={{ margin: 0 }}
    >
      작성한 내용을 수정할 수 있습니다.
    </p>
  </div>

  {/* 카테고리 + 소속 매장 */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 16,
      marginBottom: 20,
    }}
  >
    <div>
      <label
        htmlFor="edit-category"
        style={{
          display: "block",
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
        카테고리
      </label>

      <select
        id="edit-category"
        name="category"
        value={editForm.category}
        onChange={handleEditChange}
        disabled={isSaving}
        style={{
          width: "100%",
          height: 48,
          padding: "0 14px",
          border: "1px solid #DDE5F3",
          borderRadius: 12,
          background: "#F8FAFD",
          fontSize: 15,
        }}
      >
        {CATEGORIES.map(category => (
          <option
            key={category}
            value={category}
          >
            {category}
          </option>
        ))}
      </select>
    </div>

    <div>
      <label
        htmlFor="edit-store"
        style={{
          display: "block",
          marginBottom: 8,
          fontWeight: 700,
        }}
      >
        소속 매장
      </label>

      <select
        id="edit-store"
        name="store"
        value={editForm.store}
        onChange={handleEditChange}
        disabled={isSaving}
        style={{
          width: "100%",
          height: 48,
          padding: "0 14px",
          border: "1px solid #DDE5F3",
          borderRadius: 12,
          background: "#F8FAFD",
          fontSize: 15,
        }}
      >
        {STORES.map(store => (
          <option
            key={store}
            value={store}
          >
            {store}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* 제목 */}
  <div style={{ marginBottom: 20 }}>
    <label
      htmlFor="edit-title"
      style={{
        display: "block",
        marginBottom: 8,
        fontWeight: 700,
      }}
    >
      제목
    </label>

    <input
      id="edit-title"
      name="title"
      value={editForm.title}
      onChange={handleEditChange}
      maxLength={80}
      disabled={isSaving}
      style={{
        width: "100%",
        height: 48,
        boxSizing: "border-box",
        padding: "0 14px",
        border: "1px solid #DDE5F3",
        borderRadius: 12,
        background: "#F8FAFD",
        fontSize: 15,
      }}
    />
  </div>

  {/* 내용 */}
  <div style={{ marginBottom: 24 }}>
    <label
      htmlFor="edit-content"
      style={{
        display: "block",
        marginBottom: 8,
        fontWeight: 700,
      }}
    >
      내용
    </label>

    <textarea
      id="edit-content"
      name="content"
      value={editForm.content}
      onChange={handleEditChange}
      rows={8}
      maxLength={3000}
      disabled={isSaving}
      style={{
        width: "100%",
        minHeight: 200,
        boxSizing: "border-box",
        padding: 14,
        border: "1px solid #DDE5F3",
        borderRadius: 12,
        background: "#F8FAFD",
        fontSize: 15,
        lineHeight: 1.6,
        resize: "vertical",
      }}
    />
  </div>

  {/* 하단 버튼 */}
  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: 10,
      paddingTop: 4,
    }}
  >
    <button
      type="button"
      className="soft"
      onClick={handleCancelEdit}
      disabled={isSaving}
      style={{
        minWidth: 90,
      }}
    >
      <X size={17} />
      취소
    </button>

    <button
      type="submit"
      disabled={
        isSaving ||
        !editForm.title.trim() ||
        !editForm.content.trim()
      }
style={{
  minWidth: 120,
  height: 44,
  padding: "0 18px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  background: "#163A73",
  color: "#FFFFFF",
  border: "1px solid #163A73",
  borderRadius: 12,
  fontWeight: 700,
  cursor: isSaving ? "not-allowed" : "pointer",
}}
    >
      <Check size={17} />

      {isSaving
        ? "저장 중..."
        : "수정 저장"}
    </button>
  </div>
</form>
        ) : (
          <>
            <div style={styles.postHeader}>
              <span style={styles.category}>
                {currentPost.category || "기타"}
              </span>

              <span style={styles.status}>
                {currentPost.status || "접수"}
              </span>
            </div>

            <h2 style={styles.title}>
              {currentPost.title}
            </h2>

            <div style={styles.metadata}>
              <span>익명</span>
              <span aria-hidden="true">·</span>

              {currentPost.store_private ||
              currentPost.storePrivate ? (
                <span style={styles.privateStore}>
                  <Lock
                    size={14}
                    aria-hidden="true"
                  />
                  매장 비공개
                </span>
              ) : (
                <span>
                  {currentPost.store ||
                    "매장 정보 없음"}
                </span>
              )}

              {formattedPostDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <time
                    dateTime={
                      currentPost.created_at ||
                      currentPost.createdAt
                    }
                  >
                    {formattedPostDate}
                  </time>
                </>
              )}
            </div>

            <p style={styles.content}>
              {currentPost.content}
            </p>

            <div style={styles.actions}>
              <button
  type="button"
  onClick={handleLike}
  disabled={isLikeSubmitting}
  aria-pressed={isLiked}
  style={{
    ...styles.actionButton,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 14px",
    borderRadius: 999,
    border: isLiked
      ? "1px solid #163A73"
      : "1px solid #DDE5F3",
    background: isLiked
      ? "#EEF4FF"
      : "#FFFFFF",
    color: "#163A73",
    fontWeight: 700,
    cursor: isLikeSubmitting
      ? "not-allowed"
      : "pointer",
  }}
>
  <ThumbsUp
    size={17}
    fill={isLiked ? "currentColor" : "none"}
  />

  <span>
    {isLiked ? "공감했어요" : "공감"}
  </span>

  <span
    style={{
      fontSize: 13,
      opacity: 0.7,
    }}
  >
    {currentPost.likes ?? 0}
  </span>
</button>

              {isOwner && (
                <>
                  <button
                    type="button"
                    className="soft"
                    onClick={handleOpenPostEdit}
                    style={styles.actionButton}
                  >
                    <Pencil size={17} />
                    수정
                  </button>

                  <button
                    type="button"
                    className="soft"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={styles.dangerButton}
                  >
                    <Trash2 size={17} />
                    {isDeleting
                      ? "삭제 중..."
                      : "삭제"}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </article>

      <section style={styles.commentsSection}>
        <h3 style={styles.commentsTitle}>
          <MessageCircle size={19} />
          댓글 {comments.length}
        </h3>

        <div style={styles.commentList}>
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
              const isAdmin = Boolean(
                item.is_admin
              );
              const isPostWriter =
                item.user_id ===
                currentPost.user_id;
              const isMyComment =
                item.user_id === user?.id;
              const anonymousNumber =
                getAnonymousBcNumber(
                  currentPost.id,
                  item.user_id
                );
              const commentDate = formatDate(
                item.created_at,
                true
              );

              return (
                <article
                  key={item.id}
                  className="card"
                >
                  <header
                    style={styles.commentHeader}
                  >
                    <strong>
                      {isAdmin
                        ? "운영진"
                        : anonymousNumber
                          ? `BC·${anonymousNumber}`
                          : "익명 BC"}
                    </strong>

                    {isAdmin && (
                      <CommentBadge type="admin">
                        운영진
                      </CommentBadge>
                    )}

                    {!isAdmin &&
                      isPostWriter && (
                        <CommentBadge type="writer">
                          작성자
                        </CommentBadge>
                      )}

                    {!isAdmin &&
                      isMyComment && (
                        <CommentBadge type="mine">
                          나
                        </CommentBadge>
                      )}

                    {(item.__edited ||
                      (item.updated_at &&
                        item.updated_at !==
                          item.created_at)) && (
                      <span style={styles.editedText}>
                        수정됨
                      </span>
                    )}

                    {commentDate && (
                      <time
                        dateTime={item.created_at}
                        style={styles.commentDate}
                      >
                        {commentDate}
                      </time>
                    )}

                    {isMyComment && (
                      <div
                        style={styles.commentMenuWrap}
                      >
                        <button
                          type="button"
                          className="soft"
                          aria-label="댓글 메뉴"
                          style={styles.commentMenuButton}
                          onClick={() =>
                            setOpenCommentMenuId(
                              previous =>
                                previous === item.id
                                  ? null
                                  : item.id
                            )
                          }
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openCommentMenuId ===
                          item.id && (
                          <div
                            style={styles.commentMenu}
                          >
                            <button
                              type="button"
                              style={styles.commentMenuItem}
                              onClick={() =>
                                handleStartCommentEdit(
                                  item
                                )
                              }
                            >
                              <Pencil size={15} />
                              수정
                            </button>

                            <button
                              type="button"
                              style={styles.commentMenuItem}
                              disabled={
                                deletingCommentId ===
                                item.id
                              }
                              onClick={() =>
                                handleDeleteComment(
                                  item.id
                                )
                              }
                            >
                              <Trash2 size={15} />
                              {deletingCommentId ===
                              item.id
                                ? "삭제 중..."
                                : "삭제"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </header>

                  {editingCommentId === item.id ? (
                    <>
                      <textarea
                        value={editingCommentText}
                        onChange={event =>
                          setEditingCommentText(
                            event.target.value
                          )
                        }
                        rows={4}
                        maxLength={1000}
                        disabled={isCommentSaving}
                      />

                      <div
                        style={
                          styles.commentEditActions
                        }
                      >
                        <button
  type="button"
  className="soft"
  disabled={
    isCommentSaving ||
    !editingCommentText.trim()
  }
                          onClick={() =>
                            handleSaveComment(
                              item.id
                            )
                          }
                        >
                          <Check size={16} />
                          {isCommentSaving
                            ? "저장 중..."
                            : "저장"}
                        </button>

                        <button
                          type="button"
                          className="soft"
                          disabled={isCommentSaving}
                          onClick={
                            handleCancelCommentEdit
                          }
                        >
                          <X size={16} />
                          취소
                        </button>
                      </div>
                    </>
                  ) : (
                    <p style={styles.commentContent}>
                      {item.content}
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>

        {isLoggedIn ? (
          <form
            className="form"
            onSubmit={handleSubmitComment}
          >
            <label htmlFor="board-comment">
              댓글 작성
            </label>

            <textarea
              id="board-comment"
              value={comment}
              onChange={event =>
                setComment(event.target.value)
              }
              placeholder="서로를 존중하는 댓글을 남겨주세요."
              rows={4}
              maxLength={1000}
              disabled={isCommentSubmitting}
            />

            <button
  type="submit"
  className="soft"
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
            로그인 후 댓글을 작성할 수 있습니다.
          </div>
        )}
      </section>
    </section>
  );
}