import React, { useState } from "react";
import BoardDetail from "./BoardDetail";
import WritePost from "./WritePost";
import {
  Search,
  Plus,
  MessageCircle,
  ThumbsUp,
  Lock,
} from "lucide-react";

const categories = [
  "전체",
  "질문",
  "운영 제안",
  "도움 요청",
  "아이디어",
  "기타",
];

const samplePosts = [
  {
    id: 1,
    category: "질문",
    title: "교육자료에 고객 응대 사례를 추가하면 좋을 것 같아요.",
    content:
      "현장에서 자주 발생하는 상황별 응대 사례를 함께 볼 수 있으면 실무에 더 도움이 될 것 같습니다.",
    store: "올리브영N 성수",
    storePrivate: false,
    status: "검토 중",
    likes: 12,
    comments: 5,
    createdAt: "2시간 전",
    createdOrder: 3,
  },
  {
    id: 2,
    category: "운영 제안",
    title: "서비스 운영 방식에 대한 의견이 있습니다.",
    content:
      "고객 대기시간을 줄이기 위해 예약 간격을 조금 조정하면 좋을 것 같습니다.",
    store: "올리브영 뷰티 맨션 성수",
    storePrivate: true,
    status: "접수",
    likes: 8,
    comments: 13,
    createdAt: "1일 전",
    createdOrder: 2,
  },
  {
    id: 3,
    category: "도움 요청",
    title: "고객이 진단 결과를 신뢰하지 않을 때 어떻게 설명하시나요?",
    content:
      "진단 결과와 고객이 생각하는 이미지가 다를 때 자연스럽게 설명하는 방법이 궁금합니다.",
    store: "올리브영 센트럴 강남 타운",
    storePrivate: false,
    status: "완료",
    likes: 21,
    comments: 4,
    createdAt: "3일 전",
    createdOrder: 1,
  },
];

export default function BeautyVoiceBoard() {
  const [posts, setPosts] = useState(samplePosts);

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [keyword, setKeyword] = useState("");
  const [sortType, setSortType] = useState("latest");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriting, setIsWriting] = useState(false);

  const filteredPosts = posts.filter(post => {
	if (post.adminOnly) {
  	  return false;
	}
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

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortType === "likes") {
      return b.likes - a.likes;
    }

    return b.createdOrder - a.createdOrder;
  });

if (isWriting) {
  return (
    <WritePost
      onBack={() => setIsWriting(false)}
      onSubmit={form => {
        const newPost = {
          id: Date.now(),
          category: form.category,
          title: form.title,
          content: form.content,
          store: form.store,
          storePrivate: false,
          adminOnly: form.adminOnly,
          nickname: form.nickname || "익명",
          status: "접수",
          likes: 0,
          comments: 0,
          createdAt: "방금 전",
          createdOrder: Date.now(),
        };

        setPosts(prev => [newPost, ...prev]);

        setIsWriting(false);
      }}
    />
  );
}

  if (selectedPost) {
    return (
      <BoardDetail
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
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
          <h2 style={{ marginBottom: 8 }}>Beauty Voice</h2>

          <p className="sub">
            메이크업 BC의 생각과 경험이 모이는 소통 공간입니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWriting(true)}
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
        {categories.map(category => (
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {selectedCategory === "전체"
            ? "전체"
            : selectedCategory}{" "}
          {sortedPosts.length}건
        </p>

        <select
          value={sortType}
          onChange={event => setSortType(event.target.value)}
          style={{
            width: "auto",
            minWidth: 110,
          }}
        >
          <option value="latest">최신순</option>
          <option value="likes">공감순</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {sortedPosts.length === 0 ? (
          <div className="card">
            <p>조건에 맞는 게시글이 없습니다.</p>
          </div>
        ) : (
          sortedPosts.map(post => (
            <article
              key={post.id}
              className="card"
              onClick={() => setSelectedPost(post)}
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