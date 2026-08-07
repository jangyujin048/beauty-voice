import React from "react";
import {
  Lock,
  MessageCircle,
  ThumbsUp,
} from "lucide-react";

const MAX_PREVIEW_LENGTH = 150;

const styles = {
  card: {
    cursor: "pointer",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
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
    marginBottom: 8,
    overflowWrap: "anywhere",
  },
  preview: {
    marginBottom: 16,
    whiteSpace: "pre-line",
    overflowWrap: "anywhere",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    maxHeight: 220,
    objectFit: "cover",
    borderRadius: 14,
    marginBottom: 16,
    display: "block",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  metadata: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    fontSize: 13,
  },
  privateStore: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  edited: {
    fontSize: 11,
    color: "#8a8a8a",
  },
  counters: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    fontSize: 13,
  },
  counter: {
    display: "flex",
    alignItems: "center",
    gap: 5,
  },
};

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("ko-KR");
}

function getPreview(content) {
  const normalizedContent =
    content?.trim() ?? "";

  if (
    normalizedContent.length <=
    MAX_PREVIEW_LENGTH
  ) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(
    0,
    MAX_PREVIEW_LENGTH
  )}…`;
}

function isEdited(post) {
  if (
    !post?.created_at ||
    !post?.updated_at
  ) {
    return false;
  }

  const created = new Date(
    post.created_at
  ).getTime();

  const updated = new Date(
    post.updated_at
  ).getTime();

  if (
    Number.isNaN(created) ||
    Number.isNaN(updated)
  ) {
    return false;
  }

  return updated - created > 1000;
}

export default function BoardCard({
  post,
  onClick,
}) {
  const formattedDate = formatDate(
    post?.created_at
  );

  const preview = getPreview(
    post?.content
  );

  const status =
    post?.status || "접수";

  const edited = isEdited(post);

  const isStorePrivate = Boolean(
    post?.store_private ||
      post?.storePrivate
  );

  const handleKeyDown = event => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <article
      className="card"
      role="button"
      tabIndex={0}
      aria-label={`${
        post?.title || "게시글"
      } 상세 보기`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={styles.card}
    >
      <div style={styles.header}>
        <span style={styles.category}>
          {post?.category || "기타"}
        </span>

        <span style={styles.status}>
          {status}
        </span>
      </div>

      <h3 style={styles.title}>
        {post?.title || "제목 없음"}
      </h3>

      <p
        className="sub"
        style={styles.preview}
      >
        {preview || "내용이 없습니다."}
      </p>

      {post?.image_url && (
        <img
          src={post.image_url}
          alt=""
          loading="lazy"
          style={styles.image}
        />
      )}

      <footer style={styles.footer}>
        <div style={styles.metadata}>
          {isStorePrivate ? (
            <span
              style={styles.privateStore}
            >
              <Lock
                size={13}
                aria-hidden="true"
              />
              매장 비공개
            </span>
          ) : (
            <span>
              {post?.store ||
                "매장 정보 없음"}
            </span>
          )}

          {formattedDate && (
            <>
              <span aria-hidden="true">
                ·
              </span>

              <time
                dateTime={
                  post.created_at
                }
              >
                {formattedDate}
              </time>
            </>
          )}

          {edited && (
            <span style={styles.edited}>
              수정됨
            </span>
          )}
        </div>

        <div style={styles.counters}>
          <span style={styles.counter}>
            <ThumbsUp
              size={15}
              aria-hidden="true"
            />
            <span>
              {post?.likes ?? 0}
            </span>
          </span>

          <span style={styles.counter}>
            <MessageCircle
              size={15}
              aria-hidden="true"
            />
            <span>
              {post?.comment_count ?? 0}
            </span>
          </span>
        </div>
      </footer>
    </article>
  );
}