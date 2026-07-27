import React, { useState } from "react";
import {
  ArrowLeft,
  Lock,
  Send,
} from "lucide-react";

const CATEGORIES = [
  "질문",
  "운영 제안",
  "도움 요청",
  "아이디어",
  "기타",
];

const STORES = [
  "올리브영N 성수",
  "올리브영 뷰티 맨션 성수",
  "올리브영 센트럴 강남 타운",
];

const INITIAL_FORM = {
  category: CATEGORIES[0],
  title: "",
  content: "",
  store: STORES[0],
  adminOnly: false,
};

const styles = {
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  heading: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
  },
  privateOption: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  privateOptionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontWeight: 700,
  },
  privateOptionDescription: {
    display: "block",
    marginTop: 4,
  },
};

export default function WritePost({
  onBack,
  onSubmit,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = event => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = event => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content) {
      alert("내용을 입력해주세요.");
      return;
    }

    onSubmit({
      ...form,
      title,
      content,
    });
  };

  return (
    <section className="panel">
      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        style={styles.backButton}
      >
        <ArrowLeft size={18} />
        목록으로
      </button>

      <header style={styles.heading}>
        <h2 style={styles.title}>글쓰기</h2>
        <p className="sub">
          서로를 존중하며 자유롭게 의견을 나눠주세요.
        </p>
      </header>

      <form
        className="form"
        onSubmit={handleSubmit}
      >
        <label htmlFor="board-category">
          카테고리
        </label>
        <select
          id="board-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          {CATEGORIES.map(category => (
            <option
              key={category}
              value={category}
            >
              {category}
            </option>
          ))}
        </select>

        <label htmlFor="board-title">
          제목
        </label>
        <input
          id="board-title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="게시글 제목을 입력해주세요."
          maxLength={80}
          disabled={isSubmitting}
          autoComplete="off"
        />
        <small className="sub">
          {form.title.length}/80
        </small>

        <label htmlFor="board-content">
          내용
        </label>
        <textarea
          id="board-content"
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="의견이나 경험을 자유롭게 작성해주세요."
          rows={10}
          maxLength={3000}
          disabled={isSubmitting}
        />
        <small className="sub">
          {form.content.length}/3000
        </small>

        <label htmlFor="board-store">
          소속 매장
        </label>
        <select
          id="board-store"
          name="store"
          value={form.store}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          {STORES.map(store => (
            <option
              key={store}
              value={store}
            >
              {store}
            </option>
          ))}
        </select>

        <label
          className="check"
          style={styles.privateOption}
        >
          <input
            type="checkbox"
            name="adminOnly"
            checked={form.adminOnly}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <span>
            <span style={styles.privateOptionTitle}>
              <Lock size={16} />
              운영자에게만 전달하기
            </span>

            <span
              className="sub"
              style={styles.privateOptionDescription}
            >
              선택하면 게시판에 공개되지 않으며
              운영자만 확인할 수 있습니다.
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !form.title.trim() ||
            !form.content.trim()
          }
        >
          <Send size={18} />
          {isSubmitting ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </section>
  );
}