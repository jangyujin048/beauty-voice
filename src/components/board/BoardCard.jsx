import React from "react";
import {
  MessageCircle,
  ThumbsUp,
} from "lucide-react";

export default function BoardCard({
  post,
  onClick,
}) {
  const formattedDate = post.created_at
    ? new Date(post.created_at).toLocaleDateString("ko-KR")
    : "";

  return (
    <article
      className="card"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
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
          {post.status}
        </span>
      </div>

      <h3 style={{ marginBottom: 8 }}>
        {post.title}
      </h3>

      <p
        className="sub"
        style={{ marginBottom: 16 }}
      >
        {post.content}
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
          }}
        >
          <span>{post.store}</span>
          <span>·</span>
          <span>{formattedDate}</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 13,
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <ThumbsUp size={15} />
            {post.likes ?? 0}
          </span>

          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <MessageCircle size={15} />
            0
          </span>
        </div>
      </div>
    </article>
  );
}