import React, { useState } from "react";
import { ArrowLeft, ImagePlus, Send } from "lucide-react";

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
  "미공개",
];

export default function WritePost({ onBack, onSubmit }) {
  const [form, setForm] = useState({
    category: "질문",
    title: "",
    content: "",
    store: "올리브영N 성수",
    adminOnly: false,
    nickname: "",
    imageFile: null,
  });

  const handleChange = event => {
    const { name, value, type, checked, files } = event.target;

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
        <label>카테고리</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <label>제목</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="게시글 제목을 입력해주세요."
          maxLength={80}
        />

        <label>내용</label>
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="의견이나 경험을 자유롭게 작성해주세요."
          rows={10}
        />

	<label>소속 매장</label>
	<select
 	 name="store"
 	 value={form.store}
 	 onChange={handleChange}
	>
 	 {stores.map(store => (
   	   <option key={store} value={store}>
   	     {store}
   	   </option>
 	 ))}
 </select>

	<label className="check">
	  <input
  	  type="checkbox"
	    name="adminOnly"
	    checked={form.adminOnly}
	    onChange={handleChange}
  />
  운영자에게만 공개 (게시판에는 매장명이 노출되지 않습니다.)
</label>

{form.adminOnly && (
  <p className="sub">
    운영자만 확인할 수 있으며, 다른 구성원에게는 공개되지 않습니다.
  </p>
)}

        <label>닉네임 (선택)</label>
        <input
          name="nickname"
          value={form.nickname}
          onChange={handleChange}
          placeholder="비워두면 익명으로 등록됩니다."
          maxLength={20}
        />

        <label>사진 첨부</label>
        <label
          style={{
            border: "1px dashed #c9c9c9",
            borderRadius: 12,
            padding: 18,
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
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
            style={{ display: "none" }}
          />
        </label>

        <button type="submit">
          <Send size={18} />
          등록하기
        </button>
      </form>
    </section>
  );
}