import React, { useEffect, useMemo, useRef, useState } from "react";
import supabase from "../../api/supabase";
import AdminModal from "./AdminModal";

const CONFIG = {
  notice: {
    label: "공지사항",
    singular: "공지",
    icon: "📢",
    description: "구성원에게 전달할 주요 공지를 등록하고 관리합니다.",
    table: "notices",
    searchFields: ["title", "body"],
    titleField: "title",
    bodyField: "body",
    imageField: "image_url",
    storageFolder: "notices",
  },
  faq: {
    label: "FAQ",
    singular: "FAQ",
    icon: "❓",
    description: "반복 문의와 운영 기준을 질문·답변 형태로 관리합니다.",
    table: "faqs",
    searchFields: ["category", "question", "answer"],
    titleField: "question",
    bodyField: "answer",
  },
  insight: {
    label: "BC 인사이트",
    singular: "인사이트",
    icon: "💡",
    description: "월별 인사이트와 카드뉴스를 등록하고 관리합니다.",
    table: "bc_insights",
    searchFields: ["month", "title", "content"],
    titleField: "title",
    bodyField: "content",
    imageField: "image_url",
    storageFolder: "insights",
  },
};

function emptyForm(type) {
  if (type === "notice") {
    return {
      title: "",
      body: "",
      imageFile: null,
      imageUrl: "",
      isFeatured: false,
    };
  }
  if (type === "faq") {
    return { category: "교육", question: "", answer: "" };
  }
  return { month: "", title: "", content: "", imageFile: null, imageUrl: "" };
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminToast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(onClose, 2400);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;
  return (
    <div className={`admin-toast ${toast.type || "success"}`} role="status">
      <span>{toast.icon || "✓"}</span>
      <strong>{toast.message}</strong>
    </div>
  );
}

function ConfirmDeleteModal({ open, label, onCancel, onConfirm, loading }) {
  return (
    <AdminModal
      open={open}
      title={`${label} 삭제`}
      description="삭제 후에는 되돌릴 수 없습니다."
      onClose={loading ? () => {} : onCancel}
    >
      <div className="admin-delete-confirm">
        <div className="admin-delete-confirm-icon">🗑️</div>
        <p>선택한 항목을 정말 삭제할까요?</p>
        <div className="admin-modal-footer">
          <button type="button" className="admin-secondary-button" onClick={onCancel} disabled={loading}>
            취소
          </button>
          <button type="button" className="admin-danger-button" onClick={onConfirm} disabled={loading}>
            {loading ? "삭제 중…" : "삭제하기"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}

function ImageDropzone({ file, imageUrl, onFile, onRemove }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return imageUrl || "";
  }, [file, imageUrl]);

  useEffect(() => {
    return () => {
      if (file && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file, previewUrl]);

  function acceptFile(nextFile) {
    if (!nextFile) return;
    if (!nextFile.type?.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    onFile(nextFile);
  }

  return (
    <div className="admin-image-field">
      <button
        type="button"
        className={`admin-dropzone ${dragging ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFile(event.dataTransfer.files?.[0]);
        }}
      >
        <span className="admin-dropzone-icon">🖼️</span>
        <strong>이미지를 끌어놓거나 클릭해 선택하세요.</strong>
        <small>JPG, PNG, WEBP 등 이미지 파일</small>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      {previewUrl && (
        <div className="admin-image-preview">
          <img src={previewUrl} alt="업로드 이미지 미리보기" />
          <div>
            <strong>{file ? file.name : "현재 등록된 이미지"}</strong>
            <span>{file ? "저장하면 새 이미지로 교체됩니다." : "이미지를 유지하거나 삭제할 수 있습니다."}</span>
          </div>
          <button type="button" onClick={onRemove} aria-label="이미지 제거">×</button>
        </div>
      )}
    </div>
  );
}

export default function AdminContentManager({
  type,
  items,
  onReload,
  faqCategories = ["전체", "시스템", "서비스", "교육", "기타"],
}) {
  const config = CONFIG[type];
  const [form, setForm] = useState(() => emptyForm(type));
  const [editingItem, setEditingItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

const [
  openFaqAdminCategories,
  setOpenFaqAdminCategories,
] = useState(
  faqCategories.filter(
    category => category !== "전체"
  )
);

function toggleAdminFaqCategory(category) {
  setOpenFaqAdminCategories(previous =>
    previous.includes(category)
      ? previous.filter(
          item => item !== category
        )
      : [...previous, category]
  );
}

  useEffect(() => {
    setForm(emptyForm(type));
    setEditingItem(null);
    setFormOpen(false);
    setDeleteTarget(null);
    setKeyword("");
    setSortOrder("newest");
  }, [type]);

  const visibleItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    const filtered = (items || []).filter((item) => {
      if (!normalizedKeyword) return true;
      return config.searchFields.some((field) =>
        String(item[field] || "").toLowerCase().includes(normalizedKeyword)
      );
    });

    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });
  }, [items, keyword, sortOrder, config.searchFields]);

  function showToast(message, icon = "✓", toastType = "success") {
    setToast({ message, icon, type: toastType });
  }

  function openCreate() {
    setEditingItem(null);
    setForm(emptyForm(type));
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
if (type === "notice") {
  setForm({
    title: item.title || "",
    body: item.body || "",
    imageFile: null,
    imageUrl: item.image_url || "",
    isFeatured: Boolean(item.is_featured),
  });
    } else if (type === "faq") {
      setForm({ category: item.category || "기타", question: item.question || "", answer: item.answer || "" });
    } else {
      setForm({ month: item.month || "", title: item.title || "", content: item.content || "", imageFile: null, imageUrl: item.image_url || "" });
    }
    setFormOpen(true);
  }

  function closeForm() {
    if (loading) return;
    setFormOpen(false);
    setEditingItem(null);
    setForm(emptyForm(type));
  }

  async function uploadImage(file) {
    if (!file || !config.storageFolder) return "";
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${config.storageFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;
    const { error } = await supabase.storage.from("voice-images").upload(filePath, file);
    if (error) throw error;
    return supabase.storage.from("voice-images").getPublicUrl(filePath).data.publicUrl;
  }

  function validateForm() {
    if (type === "notice") {
      if (!form.title.trim()) return "공지 제목을 입력해주세요.";
      if (!form.body.trim()) return "공지 내용을 입력해주세요.";
    } else if (type === "faq") {
      if (!form.question.trim()) return "FAQ 질문을 입력해주세요.";
      if (!form.answer.trim()) return "FAQ 답변을 입력해주세요.";
    } else {
      if (!form.month.trim()) return "월 정보를 입력해주세요.";
      if (!form.title.trim()) return "인사이트 제목을 입력해주세요.";
      if (!form.content.trim()) return "인사이트 내용을 입력해주세요.";
    }
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) return alert(validationMessage);

    setLoading(true);
    try {
      let payload;
      if (type === "notice") {
        let imageUrl = form.imageUrl || "";
        if (form.imageFile) imageUrl = await uploadImage(form.imageFile);
        payload = {
  title: form.title.trim(),
  body: form.body.trim(),
  image_url: imageUrl,
  is_featured: Boolean(form.isFeatured),
};
      } else if (type === "faq") {
        payload = { category: form.category, question: form.question.trim(), answer: form.answer.trim() };
      } else {
        let imageUrl = form.imageUrl || "";
        if (form.imageFile) imageUrl = await uploadImage(form.imageFile);
        payload = { month: form.month.trim(), title: form.title.trim(), content: form.content.trim(), image_url: imageUrl };
      }

      const query = editingItem
        ? supabase.from(config.table).update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingItem.id)
        : supabase.from(config.table).insert(payload);

      const { error } = await query;
      if (error) throw error;

      const wasEditing = Boolean(editingItem);
      await onReload();
      setFormOpen(false);
      setEditingItem(null);
      setForm(emptyForm(type));
      showToast(
        wasEditing ? `${config.singular}이 수정되었습니다.` : `${config.singular}이 등록되었습니다.`,
        wasEditing ? "✏️" : "✅"
      );
    } catch (error) {
      console.error(error);
      alert(`${config.singular} 저장 중 오류가 발생했습니다. updated_at 컬럼과 Supabase 권한을 확인해주세요.`);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.from(config.table).delete().eq("id", deleteTarget.id);
      if (error) throw error;
      await onReload();
      setDeleteTarget(null);
      showToast(`${config.singular}이 삭제되었습니다.`, "🗑️");
    } catch (error) {
      console.error(error);
      alert(`${config.singular} 삭제 중 오류가 발생했습니다.`);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section className="admin-content-section">
      <div className="admin-section-header">
        <div>
          <span className="admin-section-eyebrow">CONTENT MANAGEMENT</span>
          <h2>{config.label}</h2>
          <p>{config.description}</p>
        </div>
        <button type="button" className="admin-primary-button" onClick={openCreate}>
          <span>＋</span> 새 {config.singular}
        </button>
      </div>

      <div className="admin-content-toolbar">
        <div className="admin-search-box">
          <span>⌕</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={`${config.label} 검색`}
          />
          {keyword && <button type="button" onClick={() => setKeyword("")}>×</button>}
        </div>
        <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
          <option value="newest">최신순</option>
          <option value="oldest">오래된순</option>
        </select>
        <span className="admin-result-count">{visibleItems.length}개</span>
      </div>

      {loading && (
        <div className="admin-loading-overlay" aria-live="polite">
          <span className="admin-spinner" /> 저장 중입니다…
        </div>
      )}

{visibleItems.length === 0 ? (
  <div className="admin-empty-state">
    <div className="admin-empty-icon">
      {config.icon}
    </div>

    <h3>
      {keyword
        ? "검색 결과가 없습니다."
        : `아직 등록된 ${config.label}이 없습니다.`}
    </h3>

    <p>
      {keyword
        ? "다른 검색어로 다시 확인해보세요."
        : `새 ${config.singular}을 등록해보세요.`}
    </p>

    {!keyword && (
      <button
        type="button"
        className="admin-secondary-button"
        onClick={openCreate}
      >
        새 {config.singular} 작성
      </button>
    )}
  </div>
) : type === "faq" ? (
  <div className="admin-faq-list">
    {faqCategories
      .filter(
        category => category !== "전체"
      )
      .map(category => {
        const categoryItems =
          visibleItems.filter(
            item =>
              (item.category || "기타") ===
              category
          );

        if (categoryItems.length === 0) {
          return null;
        }

        const isOpen =
          openFaqAdminCategories.includes(
            category
          );

        return (
          <section
            key={category}
            className="admin-faq-group"
          >
            <button
              type="button"
              className="admin-faq-group-header"
              onClick={() =>
                toggleAdminFaqCategory(
                  category
                )
              }
            >
              <span>
                {isOpen ? "▼" : "▶"}{" "}
                {category}
              </span>

              <span>
                {categoryItems.length}개
              </span>
            </button>

            {isOpen && (
              <div className="admin-faq-items">
                {categoryItems.map(item => (
                  <article
                    key={item.id}
                    className="admin-faq-item"
                  >
                    <div className="admin-faq-main">
                      <h3>
                        <span>Q.</span>{" "}
                        {item.question}
                      </h3>

                      <p>
                        <span>A.</span>{" "}
                        {item.answer}
                      </p>

                      <div className="admin-card-date">
                        <span>
                          등록 ·{" "}
                          {formatDate(
                            item.created_at
                          )}
                        </span>

                        {item.updated_at && (
                          <span className="admin-updated-label">
                            ✏ 수정됨 ·{" "}
                            {formatDate(
                              item.updated_at
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="admin-faq-actions">
                      <button
                        type="button"
                        className="admin-text-button"
                        onClick={() =>
                          openEdit(item)
                        }
                      >
                        수정
                      </button>

                      <button
                        type="button"
                        className="admin-text-button danger"
                        onClick={() =>
                          setDeleteTarget(item)
                        }
                      >
                        삭제
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
  </div>
) : (
  <div className="admin-content-grid">
    {visibleItems.map(item => (
      <article
        key={item.id}
        className="admin-content-card"
      >
        {type === "insight" && (
          <div className="admin-card-top">
            <span className="admin-category-badge">
              {item.month}
            </span>
          </div>
        )}

        <div className="admin-card-content">
          <h3>
            {item[config.titleField]}
          </h3>

          <div className="admin-card-date">
            <span>
              등록 ·{" "}
              {formatDate(item.created_at)}
            </span>

            {item.updated_at && (
              <span className="admin-updated-label">
                ✏ 수정됨 ·{" "}
                {formatDate(
                  item.updated_at
                )}
              </span>
            )}
          </div>

          <p className="admin-card-preview">
            {item[config.bodyField]}
          </p>
        </div>

        {config.imageField &&
          item[config.imageField] && (
            <div className="admin-card-thumbnail">
              <img
                src={item[config.imageField]}
                alt=""
              />
            </div>
          )}

        <footer className="admin-card-footer">
          <button
            type="button"
            className="admin-text-button"
            onClick={() =>
              openEdit(item)
            }
          >
            수정
          </button>

          <button
            type="button"
            className="admin-text-button danger"
            onClick={() =>
              setDeleteTarget(item)
            }
          >
            삭제
          </button>
        </footer>
      </article>
    ))}
  </div>
)}
      <AdminModal
        open={formOpen}
        title={editingItem ? `${config.singular} 수정` : `새 ${config.singular}`}
        description={editingItem ? "기존 내용을 수정합니다." : "새로운 내용을 등록합니다."}
        onClose={closeForm}
      >
        <form onSubmit={handleSubmit} className="admin-modal-form">
          {type === "faq" && (
            <div className="admin-form-field">
              <label htmlFor="admin-category">카테고리</label>
              <select id="admin-category" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
                {faqCategories.filter((category) => category !== "전체").map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
          )}

          {type === "insight" && (
            <div className="admin-form-field">
              <label htmlFor="admin-month">월</label>
              <input id="admin-month" value={form.month} onChange={(event) => setForm((prev) => ({ ...prev, month: event.target.value }))} placeholder="예: 2026년 07월" autoFocus />
            </div>
          )}

          <div className="admin-form-field">
            <label htmlFor="admin-title">{type === "faq" ? "질문" : "제목"}</label>
            <input
              id="admin-title"
              value={type === "faq" ? form.question : form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, [type === "faq" ? "question" : "title"]: event.target.value }))}
              placeholder={type === "faq" ? "예: 교육 신청은 어떻게 하나요?" : "제목을 입력하세요."}
              autoFocus={type !== "insight"}
            />
          </div>

          <div className="admin-form-field">
            <label htmlFor="admin-body">{type === "faq" ? "답변" : "내용"}</label>
            <textarea
              id="admin-body"
              rows={10}
              value={type === "notice" ? form.body : type === "faq" ? form.answer : form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, [type === "notice" ? "body" : type === "faq" ? "answer" : "content"]: event.target.value }))}
              placeholder={type === "faq" ? "FAQ 답변을 입력하세요." : "내용을 입력하세요."}
            />
          </div>
          {type === "notice" && (
  <div
    className="admin-form-field"
    style={{
      padding: "12px 14px",
      border: "1px solid #e3e8f0",
      borderRadius: 14,
      background: "#f8faff",
    }}
  >
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        margin: 0,
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      <input
        type="checkbox"
        checked={Boolean(form.isFeatured)}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            isFeatured: event.target.checked,
          }))
        }
        style={{
          width: 16,
          height: 16,
          margin: 0,
          accentColor: "#173f86",
          flexShrink: 0,
        }}
      />

      <span>📌 대표 공지로 설정</span>
    </label>

    <p
      className="sub"
      style={{
        margin: "5px 0 0 25px",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      선택 시 공지사항 상단에 크게 노출됩니다.
    </p>
  </div>
)}
          {config.imageField && (
            <div className="admin-form-field">
              <label>이미지</label>
              <ImageDropzone
                file={form.imageFile}
                imageUrl={form.imageUrl}
                onFile={(imageFile) => setForm((prev) => ({ ...prev, imageFile }))}
                onRemove={() => setForm((prev) => ({ ...prev, imageFile: null, imageUrl: "" }))}
              />
            </div>
          )}

          <footer className="admin-modal-footer">
            <button type="button" className="admin-secondary-button" onClick={closeForm} disabled={loading}>취소</button>
            <button type="submit" className="admin-primary-button" disabled={loading}>
              {loading ? <><span className="admin-spinner small" /> 저장 중…</> : editingItem ? "수정 내용 저장" : `${config.singular} 등록`}
            </button>
          </footer>
        </form>
      </AdminModal>

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        label={config.singular}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />

      <AdminToast toast={toast} onClose={() => setToast(null)} />
    </section>
  );
}
