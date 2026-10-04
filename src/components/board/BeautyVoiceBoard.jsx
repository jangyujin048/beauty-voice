import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import BoardCard from "./BoardCard";
import BoardDetail from "./BoardDetail";
import BoardHeader from "./BoardHeader";
import SearchBar from "./SearchBar";
import WritePost from "./WritePost";

import { useAuth } from "../../contexts/AuthContext";
import {
  createPost,
  getPosts,
} from "../../services/postService";

const ALL_CATEGORY = "전체";
const ALL_STORES = "__all_stores__";
const DEFAULT_SORT_TYPE = "latest";

const CATEGORIES = [
  ALL_CATEGORY,
  "질문",
  "운영 제안",
  "도움 요청",
  "아이디어",
  "기타",
];

const STORES = [
  {
    value: ALL_STORES,
    label: "전체 매장",
  },
  {
    value: "전체",
    label: "전체",
  },
  {
    value: "올리브영N 성수",
    label: "올리브영N 성수",
  },
  {
    value: "올리브영 뷰티 맨션 성수",
    label: "올리브영 뷰티 맨션 성수",
  },
  {
    value: "올리브영 센트럴 강남 타운",
    label: "올리브영 센트럴 강남 타운",
  },
];

const SORT_OPTIONS = [
  {
    value: "latest",
    label: "최신순",
  },
  {
    value: "likes",
    label: "공감순",
  },
];

const styles = {
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  resultCount: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
  },
  sortSelect: {
    width: "auto",
    minWidth: 110,
  },
  postList: {
    display: "grid",
    gap: 14,
  },
};

function getCreatedAtTimestamp(post) {
  const timestamp = new Date(post?.created_at ?? 0).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getSearchText(post) {
  return [
    post?.title,
    post?.content,
    post?.store,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function createPostPayload(form, userId) {
  return {
    category: form.category,
    title: form.title.trim(),
    content: form.content.trim(),
    store: form.store,
    admin_only: Boolean(form.adminOnly),
    status: "접수",
    image_url: null,
    likes: 0,
    user_id: userId,
  };
}

function BoardMessage({ children }) {
  return (
    <div className="card">
      <p>{children}</p>
    </div>
  );
}

export default function BeautyVoiceBoard() {
  const { user, isLoggedIn } = useAuth();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

const [selectedStore, setSelectedStore] =
  useState(ALL_STORES);

const [selectedCategory, setSelectedCategory] =
  useState(ALL_CATEGORY);

const [keyword, setKeyword] = useState("");

const [sortType, setSortType] =
  useState(DEFAULT_SORT_TYPE);

  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriting, setIsWriting] = useState(false);

  const loadPosts = useCallback(async ({
    showLoading = true,
  } = {}) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const data = await getPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Beauty Voice 게시글 조회 오류:", error);
      alert("게시글을 불러오지 못했습니다.");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const visiblePosts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return posts

.filter(post => {
  const matchesStore =
    selectedStore === ALL_STORES ||
    post.store === selectedStore;

  const matchesCategory =
    selectedCategory === ALL_CATEGORY ||
    post.category === selectedCategory;

  const matchesKeyword =
    normalizedKeyword === "" ||
    getSearchText(post).includes(normalizedKeyword);

  return (
    matchesStore &&
    matchesCategory &&
    matchesKeyword
  );
})

      .sort((a, b) => {
        if (sortType === "likes") {
          const likeDifference =
            (b.likes ?? 0) - (a.likes ?? 0);

          if (likeDifference !== 0) {
            return likeDifference;
          }
        }

        return (
          getCreatedAtTimestamp(b) -
          getCreatedAtTimestamp(a)
        );
      });
}, [
  posts,
  selectedStore,
  selectedCategory,
  keyword,
  sortType,
]);

  const handleOpenWrite = useCallback(() => {
    if (!isLoggedIn || !user) {
      alert("로그인 후 글을 작성할 수 있습니다.");
      return;
    }

    setSelectedPost(null);
    setIsWriting(true);
  }, [isLoggedIn, user]);

  const handleCloseWrite = useCallback(() => {
    if (isSubmitting) {
      return;
    }

    setIsWriting(false);
  }, [isSubmitting]);

  const handleSelectPost = useCallback(post => {
    setIsWriting(false);
    setSelectedPost(post);
  }, []);

  const handleCloseDetail = useCallback(async () => {
    setSelectedPost(null);

    // 댓글 수 등 상세 화면에서 달라질 수 있는 값을 다시 동기화합니다.
    await loadPosts({
      showLoading: false,
    });
  }, [loadPosts]);

  const handlePostUpdated = useCallback(updatedPost => {
    if (!updatedPost?.id) {
      return;
    }

    setSelectedPost(previous =>
      previous?.id === updatedPost.id
        ? {
            ...previous,
            ...updatedPost,
          }
        : previous
    );

    setPosts(previous =>
      previous.map(post =>
        post.id === updatedPost.id
          ? {
              ...post,
              ...updatedPost,
            }
          : post
      )
    );
  }, []);

  const handlePostDeleted = useCallback(deletedPostId => {
    const postId = deletedPostId ?? selectedPost?.id;

    if (!postId) {
      return;
    }

    setPosts(previous =>
      previous.filter(post => post.id !== postId)
    );
    setSelectedPost(null);
  }, [selectedPost?.id]);

  const handleCreatePost = useCallback(async form => {
    if (isSubmitting) {
      return;
    }

    if (!user?.id) {
      alert("로그인 후 글을 작성할 수 있습니다.");
      return;
    }

    const title = form.title?.trim();
    const content = form.content?.trim();

    if (!title || !content) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      const newPost = await createPost(
        createPostPayload(form, user.id)
      );

      if (!newPost) {
        throw new Error("등록된 게시글 정보를 받지 못했습니다.");
      }

      if (!newPost.admin_only) {
        setPosts(previous => [
          {
            comment_count: 0,
            ...newPost,
          },
          ...previous,
        ]);
      }

      setIsWriting(false);

      alert(
        newPost.admin_only
          ? "운영자에게 게시글이 전달되었습니다."
          : "게시글이 등록되었습니다."
      );
    } catch (error) {
      console.error("Beauty Voice 게시글 등록 오류:", error);
      alert("게시글을 등록하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, user?.id]);

  if (isWriting) {
    return (
      <WritePost
        onBack={handleCloseWrite}
        onSubmit={handleCreatePost}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (selectedPost) {
    return (
      <BoardDetail
        post={selectedPost}
        currentUser={user}
        onBack={handleCloseDetail}
        onPostUpdated={handlePostUpdated}
        onPostDeleted={handlePostDeleted}
      />
    );
  }

  return (
    <section className="panel">
      <BoardHeader
        title="Beauty Voice"
        description="메이크업 BC의 생각과 경험이 모이는 소통 공간입니다."
        onWrite={handleOpenWrite}
      />

      <SearchBar
  value={keyword}
  onChange={setKeyword}
/>

<div className="beautyVoiceFilterBar">
  <div className="beautyVoiceFilterSelect">
    <span>매장</span>

    <select
      aria-label="매장 필터"
      value={selectedStore}
      onChange={event =>
        setSelectedStore(event.target.value)
      }
    >
      {STORES.map(store => (
        <option
          key={store.value}
          value={store.value}
        >
          {store.label}
        </option>
      ))}
    </select>
  </div>

  <div className="beautyVoiceFilterSelect">
    <span>카테고리</span>

    <select
      aria-label="카테고리 필터"
      value={selectedCategory}
      onChange={event =>
        setSelectedCategory(event.target.value)
      }
    >
      {CATEGORIES.map(category => (
        <option
          key={category}
          value={category}
        >
          {category === ALL_CATEGORY
            ? "전체 카테고리"
            : category}
        </option>
      ))}
    </select>
  </div>

</div>

<div className="beautyVoiceResultRow">
  <p>
    검색 결과 <strong>{visiblePosts.length}</strong>건
  </p>

  <select
    aria-label="게시글 정렬 방식"
    value={sortType}
    onChange={event =>
      setSortType(event.target.value)
    }
    className="ui-select"
    style={{
      width: "auto",
      minWidth: 110,
    }}
  >
    {SORT_OPTIONS.map(option => (
      <option
        key={option.value}
        value={option.value}
      >
        {option.label}
      </option>
    ))}
  </select>
</div>
      <div style={styles.postList}>
        {isLoading ? (
          <BoardMessage>
            게시글을 불러오는 중...
          </BoardMessage>
        ) : visiblePosts.length === 0 ? (
          <BoardMessage>
            조건에 맞는 게시글이 없습니다.
          </BoardMessage>
        ) : (
          visiblePosts.map(post => (
            <BoardCard
              key={post.id}
              post={post}
              onClick={() => handleSelectPost(post)}
            />
          ))
        )}
      </div>
    </section>
  );
}