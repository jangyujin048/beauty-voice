import React, { useState } from "react";

export default function Thanks({
  thanksForm,
  setThanksForm,
  submitThanks,
  thanksList,
  likeThanks,
  likedThanksIds,
  dateLabel,
}) {
const [expandedIds, setExpandedIds] =
  useState([]);
const toggleExpanded = (id) => {
  setExpandedIds((previous) =>
    previous.includes(id)
      ? previous.filter(
          (itemId) => itemId !== id
        )
      : [...previous, id]
  );
};
  return (
    <section className="panel">
      {/* 상단 타이틀 */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          Thanks Lounge
        </h2>

        <p
          className="sub"
          style={{
            marginTop: 10,
            marginBottom: 0,
          }}
        >
          동료에게 전하고 싶은 고마운 마음을 따뜻하게 남겨주세요.
        </p>
      </div>

      {/* Thanks 작성 영역 */}
      <form
        onSubmit={submitThanks}
        className="card"
        style={{
          padding: 24,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "#FFF1F3",
              display: "grid",
              placeItems: "center",
              fontSize: 19,
              flexShrink: 0,
            }}
          >
            💌
          </div>

          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 17,
              }}
            >
              Thanks 남기기
            </h3>

            <p
              className="sub"
              style={{
                margin: "4px 0 0",
                fontSize: 13,
              }}
            >
              고마웠던 순간을 동료에게 전해보세요.
            </p>
          </div>
        </div>

        {/* 대상 */}
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          감사를 전할 대상
        </label>

        <input
          value={thanksForm.receiver}
          onChange={(e) =>
            setThanksForm({
              ...thanksForm,
              receiver: e.target.value,
            })
          }
          placeholder="예: 올리브님"
          style={{
            width: "100%",
            height: 46,
            padding: "0 14px",
            border: "1px solid #DDE5F3",
            borderRadius: 12,
            background: "#F9FBFF",
            outline: "none",
            marginBottom: 18,
          }}
        />

        {/* 감사 내용 */}
        <label
          style={{
            display: "block",
            marginBottom: 8,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          감사 내용
        </label>

        <textarea
          value={thanksForm.message}
          onChange={(e) =>
            setThanksForm({
              ...thanksForm,
              message: e.target.value,
            })
          }
          placeholder="고마웠던 순간이나 칭찬하고 싶은 내용을 남겨주세요."
          rows={5}
          style={{
            width: "100%",
            minHeight: 130,
            padding: 14,
            border: "1px solid #DDE5F3",
            borderRadius: 12,
            background: "#F9FBFF",
            outline: "none",
            resize: "vertical",
            lineHeight: 1.6,
          }}
        />

        {/* 등록 버튼 */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <button
            type="submit"
            style={{
              padding: "10px 18px",
              border: 0,
              borderRadius: 10,
              background: "#163A73",
              color: "#FFFFFF",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            💌 Thanks 남기기
          </button>
        </div>
      </form>

      {/* Thanks 목록 제목 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 18,
          }}
        >
          💗 우리들의 Thanks
        </h3>

        <span
          className="sub"
          style={{
            fontSize: 13,
          }}
        >
          총 {thanksList.length}개
        </span>
      </div>

      {/* Thanks 목록 */}
      <section className="grid">
        {thanksList.length === 0 && (
          <div className="empty">
            아직 등록된 Thanks가 없습니다.
          </div>
        )}

        {thanksList.map((item) => {
          const isLiked =
            likedThanksIds.includes(item.id);

const isExpanded =
  expandedIds.includes(item.id);

const isLongMessage =
  item.message?.length > 120;

          return (
            <div
              className="card"
              key={item.id}
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                minHeight: 220,
              }}
            >
              {/* 대상 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                  }}
                >
                  ❤️
                </span>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                  }}
                >
                  {item.receiver}
                </h3>
              </div>

              {/* 내용 */}
<div>
  <p
    style={{
      margin: 0,
      lineHeight: 1.6,
      fontSize: 14,
      ...(isExpanded
        ? {}
        : {
            display: "-webkit-box",
            WebkitLineClamp: 5,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }),
    }}
  >
    {item.message}
  </p>

  {isLongMessage && (
    <button
      type="button"
      onClick={() =>
        toggleExpanded(item.id)
      }
      style={{
        marginTop: 8,
        padding: 0,
        border: 0,
        background: "transparent",
        color: "#163A73",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {isExpanded
        ? "접기"
        : "더보기"}
    </button>
  )}
</div>

              {/* 하단 */}
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 18,
                }}
              >
                <small
                  style={{
                    display: "block",
                    color: "#667085",
                    marginBottom: 10,
                  }}
                >
                  {dateLabel(item.created_at)}
                </small>

                <button
                  type="button"
                  className="soft"
                  onClick={() =>
                    likeThanks(item)
                  }
                  disabled={isLiked}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {isLiked
                    ? `❤️ 공감완료 ${item.likes || 0}`
                    : `❤️ 공감 ${item.likes || 0}`}
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
}