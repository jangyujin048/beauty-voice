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

      <div className="form" style={{ maxWidth: 560 }}>
        <label>FAQ 카테고리</label>
        <select
          value={faqCategoryFilter}
          onChange={(e) => setFaqCategoryFilter(e.target.value)}
        >
          {faqCategories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>

        <label>FAQ 검색</label>
        <input
          value={faqKeyword}
          onChange={(e) => setFaqKeyword(e.target.value)}
          placeholder="예: 교육 신청, 뷰티맨션, Color Fit"
        />
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
                            <small>{dateLabel(item.created_at)}</small>
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