import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Lock,
  RefreshCw,
  Search,
} from "lucide-react";

import { getAdminPosts } from "../../services/postService";

export default function AdminBoardPosts() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("전체");
  const [statusFilter, setStatusFilter] =
    useState("전체");

  const loadPosts = async () => {
    try {
      setIsLoading(true);

      const data = await getAdminPosts();

      setPosts(data);
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
      const matchesKeyword =
        !normalizedKeyword ||
        `${post.title ?? ""} ${post.content ?? ""} ${post.store ?? ""}`
          .toLowerCase()
          .includes(normalizedKeyword);

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
            관리합니다.
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
            <option key={category}>
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
            <option key={status}>
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
                  (post.status || "접수") === "접수"
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
            const formattedDate =
              post.created_at
                ? new Date(
                    post.created_at
                  ).toLocaleDateString("ko-KR")
                : "";

            return (
              <article
                key={post.id}
                className="card"
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

                  <span className="postStatusBadge">
                    {post.status || "접수"}
                  </span>
                </div>

                <h3 style={{ marginBottom: 8 }}>
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}