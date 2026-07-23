import React, { useState } from "react";
import {
  ArrowLeft,
  MessageCircle,
  ThumbsUp,
  Lock,
  Send,
} from "lucide-react";

export default function BoardDetail({ post, onBack }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [comment, setComment] = useState("");

  const sampleComments = [
    {
      id: 1,
      nickname: "익명 BC",
      content: "저도 비슷한 상황을 경험했어요. 좋은 의견인 것 같습니다.",
      createdAt: "1시간 전",
      isWriter: false,
    },
    {
      id: 2,
      nickname: "작성자",
      content: "공감해주셔서 감사합니다!",
      createdAt: "30분 전",
      isWriter: true,
    },
  ];

  const handleLike = () => {
    setLiked(prev => !prev);
    setLikeCount(prev => (liked ? prev - 1 : prev + 1));
  };

  const handleSubmitComment = event => {
    event.preventDefault();

    if (!comment.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    alert("댓글 등록 기능은 DB 연결 단계에서 추가할 예정입니다.");
    setComment("");
  };

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
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {post.category}
          </span>

          <span style={{ fontSize: 12, fontWeight: 700 }}>
            {post.status}
          </span>
        </div>

        <h2 style={{ marginBottom: 14 }}>{post.title}</h2>

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
            <span>{post.store}</span>
          )}

          <span>·</span>
          <span>{post.createdAt}</span>
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
          className={liked ? "active" : ""}
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

      <div style={{ marginTop: 28 }}>
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 16,
          }}
        >
          <MessageCircle size={19} />
          댓글 {sampleComments.length}
        </h3>

        <div
          style={{
            display: "grid",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {sampleComments.map(item => (
            <div key={item.id} className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <strong>{item.nickname}</strong>

                {item.isWriter && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    작성자
                  </span>
                )}

                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 12,
                  }}
                >
                  {item.createdAt}
                </span>
              </div>

              <p style={{ lineHeight: 1.6 }}>{item.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmitComment} className="form">
          <label>댓글 작성</label>

          <textarea
            value={comment}
            onChange={event => setComment(event.target.value)}
            placeholder="서로를 존중하는 댓글을 남겨주세요."
          />

          <button type="submit">
            <Send size={17} />
            댓글 등록
          </button>
        </form>
      </div>
    </section>
  );
}