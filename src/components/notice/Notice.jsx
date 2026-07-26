import React from "react";
import { dateLabel } from "../../utils/date";

export default function Notice({
  notices,
  selectedNotice,
  setSelectedNotice,
  renderLinkedText,
}) {
  return (
    <section className="panel">
      <h2>공지사항</h2>

      <p className="sub">
        교육 일정, 취합 안내, 주간 동향 등 주요 공지를 확인하는 공간입니다.
      </p>

      <section className="grid">
        {notices.length === 0 && (
          <div className="empty">
            등록된 공지가 없습니다.
          </div>
        )}

        {notices.map((n, i) => (
          <button
            className="card"
            key={n.id}
            onClick={() => setSelectedNotice(n)}
            style={{ textAlign: "left" }}
          >
            <h3>
              {i === 0 ? "📢" : "💡"} {n.title}
            </h3>

            <p className="sub">
              {dateLabel(n.created_at)}
            </p>
          </button>
        ))}
      </section>

      {selectedNotice && (
        <div
          className="card"
          style={{ marginTop: 24 }}
        >
          <div className="row">
            <div>
              <h2>{selectedNotice.title}</h2>

              <div className="sub">
	  <div>
	    공지일 · {dateLabel(selectedNotice.created_at)}
	  </div>

	  {selectedNotice.updated_at && (
	    <div style={{ marginTop: 4 }}>
	      ✏ 수정됨 · {dateLabel(selectedNotice.updated_at)}
	    </div>
	  )}
	</div>
            </div>

            <button
              className="soft"
              onClick={() => setSelectedNotice(null)}
            >
              닫기
            </button>
          </div>

          <p
            style={{
              whiteSpace: "pre-line",
              marginTop: 16,
            }}
          >
            {renderLinkedText(selectedNotice.body)}
          </p>

          {selectedNotice.image_url && (
            <a
              href={selectedNotice.image_url}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={selectedNotice.image_url}
                alt="공지 이미지"
                style={{
                  width: "100%",
                  maxWidth: 520,
                  maxHeight: 360,
                  objectFit: "cover",
                  borderRadius: 18,
                  border: "1px solid #DDE5F3",
                  marginTop: 16,
                }}
              />
            </a>
          )}
        </div>
      )}
    </section>
  );
}