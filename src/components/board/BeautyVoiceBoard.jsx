import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import BoardDetail from "./BoardDetail";
import WritePost from "./WritePost";
import BoardCard from "./BoardCard";
import SearchBar from "./SearchBar";

import {
  getPosts,
  createPost,
} from "../../services/postService";

const categories = [
  "전체",
  "질문",
  "운영 제안",
  "도움 요청",
  "아이디어",
  "기타",
];

export default function BeautyVoiceBoard() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState("전체");
  const [keyword, setKeyword] = useState("");
  const [sortType, setSortType] = useState("latest");
  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriting, setIsWriting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);

      const data = await getPosts();

      setPosts(data ?? []);
    } catch (error) {
      console.error(error);
      alert("게시글을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
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
      return (b.likes ?? 0) - (a.likes ?? 0);
    }

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });

  const handleCreatePost = async form => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const newPost = await createPost({
        category: form.category,
        title: form.title.trim(),
        content: form.content.trim(),
        store: form.store,
        admin_only: form.adminOnly,
        status: "접수",
        image_url: null,
        likes: 0,
      });

      if (!newPost.admin_only) {
        setPosts(prev => [newPost, ...prev]);
      }

      setIsWriting(false);

      alert(
        newPost.admin_only
          ? "운영자에게 게시글이 전달되었습니다."
          : "게시글이 등록되었습니다."
      );
    } catch (error) {
      console.error(error);
      alert("게시글을 등록하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isWriting) {
    return (
      <WritePost
        onBack={() => setIsWriting(false)}
        onSubmit={handleCreatePost}
        isSubmitting={isSubmitting}
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
          <h2 style={{ marginBottom: 8 }}>
            Beauty Voice
          </h2>

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

      <SearchBar
  value={keyword}
  onChange={setKeyword}
/>

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
            onClick={() =>
              setSelectedCategory(category)
            }
            className={
              selectedCategory === category
                ? "active"
                : ""
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
          {selectedCategory} {sortedPosts.length}건
        </p>

        <select
          value={sortType}
          onChange={event =>
            setSortType(event.target.value)
          }
          style={{
            width: "auto",
            minWidth: 110,
          }}
        >
          <option value="latest">
            최신순
          </option>

          <option value="likes">
            공감순
          </option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {isLoading ? (
          <div className="card">
            <p>게시글을 불러오는 중...</p>
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="card">
            <p>
              조건에 맞는 게시글이 없습니다.
            </p>
          </div>
        ) : (
          sortedPosts.map(post => (
            <BoardCard
              key={post.id}
              post={post}
              onClick={() =>
                setSelectedPost(post)
              }
            />
          ))
        )}
      </div>
    </section>
  );
}