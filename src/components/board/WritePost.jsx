import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ImagePlus,
  Lock,
  Send,
  X,
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

function getInitialForm(initialPost) {
  return {
    category:
      initialPost?.category || CATEGORIES[0],
    title: initialPost?.title || "",
    content: initialPost?.content || "",
    store:
      initialPost?.store || STORES[0],
    adminOnly:
      Boolean(initialPost?.admin_only),
    imageFile: null,
    imageUrl:
      initialPost?.image_url || "",
  };
}

export default function WritePost({
  onBack,
  onSubmit,
  isSubmitting = false,
  initialPost = null,
  isEditing = Boolean(initialPost),
}) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() =>
    getInitialForm(initialPost)
  );

  const [isDragging, setIsDragging] =
    useState(false);

  useEffect(() => {
    setForm(getInitialForm(initialPost));
  }, [initialPost]);

  const imagePreviewUrl = useMemo(() => {
    if (form.imageFile) {
      return URL.createObjectURL(
        form.imageFile
      );
    }

    return form.imageUrl || "";
  }, [form.imageFile, form.imageUrl]);

  useEffect(() => {
    return () => {
      if (
        imagePreviewUrl &&
        imagePreviewUrl.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          imagePreviewUrl
        );
      }
    };
  }, [imagePreviewUrl]);

  const handleChange = event => {
    const {
      name,
      value,
      type,
      checked,
      files,
    } = event.target;

    setForm(previous => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : type === "file"
            ? files?.[0] || null
            : value,
    }));
  };

  const handleDrop = event => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsDragging(false);

    const droppedFile =
      event.dataTransfer.files?.[0];

    if (!droppedFile) {
      return;
    }

    if (
      !droppedFile.type.startsWith(
        "image/"
      )
    ) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      return;
    }

    setForm(previous => ({
      ...previous,
      imageFile: droppedFile,
    }));
  };

  const handleDragOver = event => {
    event.preventDefault();

    if (!isSubmitting) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = event => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    setForm(previous => ({
      ...previous,
      imageFile: null,
      imageUrl: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        style={{
          marginBottom: 20,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={18} />
        {isEditing
          ? "게시글로 돌아가기"
          : "목록으로"}
      </button>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>
          {isEditing
            ? "Beauty Voice 수정"
            : "Beauty Voice 작성"}
        </h2>

        <p className="sub">
          {isEditing
            ? "작성한 내용을 수정할 수 있습니다."
            : "서로를 존중하며 자유롭게 의견을 나눠주세요."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="form"
      >
        <label htmlFor="category">
          카테고리
        </label>

        <select
          id="category"
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

        <label htmlFor="title">
          제목
        </label>

        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="게시글 제목을 입력해주세요."
          maxLength={80}
          disabled={isSubmitting}
        />

        <label htmlFor="content">
          내용
        </label>

        <textarea
          id="content"
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="의견이나 경험을 자유롭게 작성해주세요."
          rows={10}
          disabled={isSubmitting}
        />

        <label htmlFor="store">
          소속 매장
        </label>

        <select
          id="store"
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
              선택하면 게시판에 공개되지 않으며
              운영자만 확인할 수 있습니다.
            </span>
          </span>
        </label>

        <label>사진 첨부</label>

        {imagePreviewUrl ? (
          <div
            style={{
              position: "relative",
              border:
                "1px solid rgba(15, 23, 42, 0.1)",
              borderRadius: 16,
              padding: 12,
              overflow: "hidden",
            }}
          >
            <img
              src={imagePreviewUrl}
              alt="첨부 이미지 미리보기"
              style={{
                width: "100%",
                maxHeight: 320,
                display: "block",
                objectFit: "cover",
                borderRadius: 12,
              }}
            />

            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isSubmitting}
              aria-label="첨부 이미지 제거"
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                width: 34,
                height: 34,
                padding: 0,
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={17} />
            </button>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() =>
              fileInputRef.current?.click()
            }
            onKeyDown={event => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                fileInputRef.current?.click();
              }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{
              border: isDragging
                ? "1px solid #111827"
                : "1px dashed #c9c9c9",
              borderRadius: 14,
              padding: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              cursor: isSubmitting
                ? "not-allowed"
                : "pointer",
              opacity: isSubmitting
                ? 0.6
                : 1,
              background: isDragging
                ? "rgba(15, 23, 42, 0.04)"
                : "transparent",
              textAlign: "center",
            }}
          >
            <ImagePlus size={20} />

            <span>
              이미지를 끌어놓거나 클릭해
              선택해주세요.
            </span>

            <input
              ref={fileInputRef}
              type="file"
              name="imageFile"
              accept="image/*"
              onChange={handleChange}
              disabled={isSubmitting}
              style={{ display: "none" }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
        >
          <Send size={18} />

          {isSubmitting
            ? isEditing
              ? "수정 중..."
              : "등록 중..."
            : isEditing
              ? "수정 완료"
              : "등록하기"}
        </button>
      </form>
    </section>
  );
}