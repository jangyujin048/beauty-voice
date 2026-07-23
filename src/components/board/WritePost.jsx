import React, { useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Lock,
  Send,
} from "lucide-react";

const categories = [
  "질문",
  "운영 제안",
  "도움 요청",
  "아이디어",
  "기타",
];

const stores = [
  "올리브영N 성수",
  "올리브영 뷰티 맨션 성수",
  "올리브영 센트럴 강남 타운",
];

export default function WritePost({
  onBack,
  onSubmit,
  isSubmitting = false,
}) {
  const [form, setForm] = useState({
    category: "질문",
    title: "",
    content: "",
    store: "올리브영N 성수",
    adminOnly: false,
    imageFile: null,
  });

  const handleChange = event => {
    const { name, value, type, checked, files } =
      event.target;

    setForm(prev => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
            ? files?.[0] || null
            : value,
    }));
  };

  const handleSubmit = event => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!form.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    onSubmit(form);
  };

  return (
    <section className="panel">
      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
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

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>글쓰기</h2>

        <p className="sub">
          서로를 존중하며 자유롭게 의견을 나눠주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <label htmlFor="category">카테고리</label>

        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label htmlFor="title">제목</label>

        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="게시글 제목을 입력해주세요."
          maxLength={80}
          disabled={isSubmitting}
        />

        <label htmlFor="content">내용</label>

        <textarea
          id="content"
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="의견이나 경험을 자유롭게 작성해주세요."
          rows={10}
          disabled={isSubmitting}
        />

        <label htmlFor="store">소속 매장</label>

        <select
          id="store"
          name="store"
          value={form.store}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          {stores.map(store => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>

        <label
          className="check"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <input
            type="checkbox"
            name="adminOnly"
            checked={form.adminOnly}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 700,
              }}
            >
              <Lock size={16} />
              운영자에게만 전달하기
            </span>

            <span
              className="sub"
              style={{
                display: "block",
                marginTop: 4,
              }}
            >
              선택하면 게시판에 공개되지 않으며 운영자만
              확인할 수 있습니다.
            </span>
          </span>
        </label>

        <label>사진 첨부</label>

        <label
          style={{
            border: "1px dashed #c9c9c9",
            borderRadius: 12,
            padding: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          <ImagePlus size={19} />

          <span>
            {form.imageFile
              ? form.imageFile.name
              : "이미지를 선택해주세요."}
          </span>

          <input
            type="file"
            name="imageFile"
            accept="image/*"
            onChange={handleChange}
            disabled={isSubmitting}
            style={{ display: "none" }}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
        >
          <Send size={18} />
          {isSubmitting ? "등록 중..." : "등록하기"}
        </button>
      </form>
    </section>
  );
}