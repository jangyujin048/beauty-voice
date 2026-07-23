import React, { useState } from "react";
import {
  Search,
  Plus,
  MessageCircle,
  ThumbsUp,
  Lock,
} from "lucide-react";

const boardCategories = [
  "전체",
  "아이디어",
  "질문",
  "도움 요청",
  "칭찬",
  "운영 제안",
  "자유 이야기",
];

const samplePosts = [
  {
    id: 1,
    category: "아이디어",
    title: "교육자료에 고객 응대 사례를 추가하면 좋을 것 같아요.",
    content:
      "현장에서 자주 발생하는 상황별 응대 사례를 함께 볼 수 있으면 실무에 더 도움이 될 것 같습니다.",
    store: "N 성수",
    storePrivate: false,
    status: "검토 중",
    likes: 12,
    comments: 5,
    createdAt: "2시간 전",
  },
  {
    id: 2,
    category: "질문",
    title: "이런 고객님께는 어떻게 안내하는 게 좋을까요?",
    content:
      "원하는 메이크업과 진단 결과가 다를 때 자연스럽게 설명하는 방법이 궁금합니다.",
    store: "N 강남",
    storePrivate: true,
    status: "접수",
    likes: 8,
    comments: 13,
    createdAt: "1일 전",
  },
  {
    id: 3,
    category: "칭찬",
    title: "오늘 교육을 진행해주신 강사님께 감사드립니다.",
    content:
      "실습 중 어려웠던 부분을 자세히 알려주셔서 많은 도움이 되었습니다.",
    store: "N 명동",
    storePrivate: false,
    status: "완료",
    likes: 21,
    comments: 4,
    createdAt: "3일 전",
  },
];

export default function BeautyVoiceBoard() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [keyword, setKeyword] = useState("");

  const filteredPosts = samplePosts.filter(post => {
    const matchesCategory =
      selectedCategory === "전체" ||
      post.category === selectedCategory;

    const searchText =
      `${post.title} ${post.content}`.toLowerCase();

    const matchesKeyword = searchText.includes(
      keyword.trim().toLowerCase()
    );

    return matchesCategory && matchesKeyword;
  });

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
          <h2 style={{ marginBottom: 8 }}>Beauty Voice</h2>

          <p className="sub">
            메이크업 BC의 생각과 경험이 모이는 소통 공간입니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("글쓰기 화면은 다음 단계에서 연결할 예정입니다.")}
        >
          <Plus size={18} />
          글쓰기
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <Search size={18} />

        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="제목 또는 내용 검색"
          style={{ flex: 1 }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 24,
        }}
      >
        {boardCategories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={
              selectedCategory === category ? "active" : ""
            }
          >
            {category}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {filteredPosts.length === 0 ? (
          <div className="card">
            <p>조건에 맞는 게시글이 없습니다.</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <article
              key={post.id}
              className="card"
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

              <p className="sub" style={{ marginBottom: 16 }}>
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
                  {post.storePrivate ? (
                    <>
                      <Lock size={14} />
                      <span>매장 비공개</span>
                    </>
                  ) : (
                    <span>{post.store}</span>
                  )}

                  <span>·</span>
                  <span>{post.createdAt}</span>
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
                    {post.likes}
                  </span>

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <MessageCircle size={15} />
                    {post.comments}
                  </span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}