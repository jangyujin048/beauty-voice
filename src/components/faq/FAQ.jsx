import React from "react";
import { dateLabel } from "../../utils/date";

export default function FAQ({
  faqCategoryFilter,
  setFaqCategoryFilter,
  faqCategories,
  faqKeyword,
  setFaqKeyword,
  filteredFaqs,
  groupedFaqs,
  openFaqCategories,
  toggleFaqCategory,
  openFaqId,
  setOpenFaqId,
}) {
  return (
    <section className="panel">
      <h2>FAQ</h2>
      <p className="sub">
        반복 문의와 운영 기준을 빠르게 확인할 수 있는 공간입니다.
      </p>

<div
  style={{
    maxWidth: 680,
    marginTop: 28,
    marginBottom: 26,
  }}
>
  {/* 카테고리 */}
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        display: "block",
        marginBottom: 8,
        fontSize: 14,
        fontWeight: 700,
        color: "#1D2433",
      }}
    >
      FAQ 카테고리
    </label>

    <select
      value={faqCategoryFilter}
      onChange={(e) =>
        setFaqCategoryFilter(e.target.value)
      }
      style={{
        width: "100%",
        height: 48,
        padding: "0 14px",
        border: "1px solid #DDE5F3",
        borderRadius: 12,
        background: "#F9FBFF",
        color: "#1D2433",
        fontSize: 14,
        outline: "none",
        cursor: "pointer",
      }}
    >
      {faqCategories.map((category) => (
        <option
          key={category}
          value={category}
        >
          {category}
        </option>
      ))}
    </select>
  </div>

  {/* 검색 */}
  <div>
    <label
      style={{
        display: "block",
        marginBottom: 8,
        fontSize: 14,
        fontWeight: 700,
        color: "#1D2433",
      }}
    >
      FAQ 검색
    </label>

    <div
      style={{
        position: "relative",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 15,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 16,
          pointerEvents: "none",
        }}
      >
        🔍
      </span>

      <input
        type="search"
        value={faqKeyword}
        onChange={(e) =>
          setFaqKeyword(e.target.value)
        }
        placeholder="시스템, 건의, 운영 검색"
        style={{
          width: "100%",
          height: 48,
          padding: "0 42px",
          border: "1px solid #DDE5F3",
          borderRadius: 12,
          background: "#F9FBFF",
          color: "#1D2433",
          fontSize: 14,
          outline: "none",
        }}
      />

      {faqKeyword && (
        <button
          type="button"
          onClick={() => setFaqKeyword("")}
          aria-label="검색어 지우기"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 28,
            height: 28,
            padding: 0,
            border: 0,
            borderRadius: 8,
            background: "transparent",
            color: "#98A2B3",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      )}
    </div>
  </div>
</div>

      <div className="faq-list">
        {filteredFaqs.length === 0 && (
          <div className="empty">검색 결과가 없습니다.</div>
        )}

        {groupedFaqs.map((group) => {
          const isCategoryOpen = openFaqCategories.includes(group.category);

          return (
            <div className="faq-category" key={group.category}>
              <button
                type="button"
                className="faq-category-header"
                onClick={() => toggleFaqCategory(group.category)}
              >
                <span className="faq-category-title">
                  <span>{isCategoryOpen ? "▼" : "▶"}</span>
                  <span>{group.category}</span>
                </span>

                <span className="faq-category-count">
                  {group.items.length}개
                </span>
              </button>

              {isCategoryOpen && (
                <div className="faq-category-content">
                  {group.items.map((item) => {
                    const isOpen = openFaqId === item.id;

                    return (
                      <div className="faq-item" key={item.id}>
                        <button
                          type="button"
                          className="faq-question-button"
                          onClick={() =>
                            setOpenFaqId(isOpen ? null : item.id)
                          }
                        >
                          <span className="faq-question-text">
                            <span className="faq-question-label">Q.</span>
                            <span>{item.question}</span>
                          </span>

                          <span
                            className={`faq-chevron ${
                              isOpen ? "open" : ""
                            }`}
                          >
                            ▼
                          </span>
                        </button>

                        {isOpen && (
                          <div className="faq-answer">
                            <p>
                              <strong>A.</strong> {item.answer}
                            </p>
                            <div>
  <small>
    등록일 · {dateLabel(item.created_at)}
  </small>

  {item.updated_at && (
    <>
      <br />
      <small>
        ✏ 수정됨 · {dateLabel(item.updated_at)}
      </small>
    </>
  )}
</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}