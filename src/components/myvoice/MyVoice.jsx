import React, {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Lock,
  MessageCircle,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { getMyPosts } from "../../services/postService";

export default function MyVoice({
  onBack,
}) {
  const {
    user,
    isLoggedIn,
    isAuthLoading,
  } = useAuth();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    loadMyPosts();
  }, [user, isAuthLoading]);

  const loadMyPosts = async () => {
    try {
      setIsLoading(true);

      const data = await getMyPosts(user.id);

      setPosts(data);
    } catch (error) {
      console.error(error);
      alert(
        "내 게시글을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <section className="panel">
        <div className="card">
          로그인 정보를 확인하는 중...
        </div>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="panel center">
        <MessageCircle size={48} />

        <h2>My Voice</h2>

        <p className="sub">
          로그인 후 내가 작성한 글을
          확인할 수 있습니다.
        </p>

        {onBack && (
          <button
            type="button"
            onClick={onBack}
          >
            <ArrowLeft size={17} />
            돌아가기
          </button>
        )}
      </section>
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
            My Voice
          </h2>

          <p className="sub">
            내가 작성한 공개 게시글과
            운영자에게 전달한 내용을 확인할
            수 있습니다.
          </p>
        </div>

	<button
	  type="button"
	  className="myVoiceRefreshButton"
	  onClick={loadMyPosts}
	>
	  새로고침
	</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div className="storeCard">
          <b>{posts.length}</b>
          <span>전체</span>
        </div>

        <div className="storeCard">
          <b>
            {
              posts.filter(
                post => !post.admin_only
              ).length
            }
          </b>
          <span>공개 글</span>
        </div>

        <div className="storeCard">
          <b>
            {
              posts.filter(
                post => post.admin_only
              ).length
            }
          </b>
          <span>운영자 전달</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {isLoading ? (
          <div className="card">
            내 게시글을 불러오는 중...
          </div>
        ) : posts.length === 0 ? (
          <div className="empty">
            아직 작성한 게시글이 없습니다.
          </div>
        ) : (
          posts.map(post => {
            const formattedDate =
              post.created_at
                ? new Date(
                    post.created_at
                  ).toLocaleDateString(
                    "ko-KR"
                  )
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
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                      }}
                    >
                      {post.category}
                    </span>

                    {post.admin_only && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 9px",
                          borderRadius: 999,
                          background: "#f1edff",
                          color: "#6147a8",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        <Lock size={13} />
                        운영자에게 전달
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      padding: "5px 9px",
                      borderRadius: 999,
                      background: "#e8eef9",
                      color: "#0e2d69",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {post.status || "접수"}
                  </span>
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
                    marginBottom: 16,
                    whiteSpace: "pre-line",
                  }}
                >
                  {post.content}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 12,
                    fontSize: 13,
                  }}
                >
                  <span>
                    {post.store} ·{" "}
                    {formattedDate}
                  </span>

                  <span>
                    공감 {post.likes ?? 0}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}