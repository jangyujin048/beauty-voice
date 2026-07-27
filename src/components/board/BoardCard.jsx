import React from "react";
import {
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
  },
  preview: {
    marginBottom: 16,
    whiteSpace: "pre-line",
    overflowWrap: "anywhere",
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
  const normalizedContent = content?.trim() ?? "";

  if (normalizedContent.length <= MAX_PREVIEW_LENGTH) {
    return normalizedContent;
  }

  return `${normalizedContent.slice(0, MAX_PREVIEW_LENGTH)}…`;
}

export default function BoardCard({
  post,
  onClick,
}) {
  const formattedDate = formatDate(post?.created_at);
  const preview = getPreview(post?.content);
  const status = post?.status || "접수";

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
      aria-label={`${post?.title || "게시글"} 상세 보기`}
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

      <footer style={styles.footer}>
        <div style={styles.metadata}>
          <span>{post?.store || "매장 정보 없음"}</span>

          {formattedDate && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={post.created_at}>
                {formattedDate}
              </time>
            </>
          )}
        </div>

        <div style={styles.counters}>
          <span style={styles.counter}>
            <ThumbsUp
              size={15}
              aria-hidden="true"
            />
            <span>{post?.likes ?? 0}</span>
          </span>

          <span style={styles.counter}>
            <MessageCircle
              size={15}
              aria-hidden="true"
            />
            <span>{post?.comment_count ?? 0}</span>
          </span>
        </div>
      </footer>
    </article>
  );
}