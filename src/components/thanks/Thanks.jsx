import React from "react";

export default function Thanks({
  thanksForm,
  setThanksForm,
  submitThanks,
  thanksList,
  likeThanks,
  likedThanksIds,
  dateLabel,
}) {
  return (
    <section className="panel">
      <h2>Thanks Lounge</h2>

      <p className="sub">
        동료에게 전하고 싶은 고마운 마음을 따뜻하게 남겨주세요.
      </p>

      <form
        onSubmit={submitThanks}
        className="form"
        style={{ maxWidth: 560 }}
      >
        <label>감사를 전할 대상</label>

        <input
          value={thanksForm.receiver}
          onChange={(e) =>
            setThanksForm({
              ...thanksForm,
              receiver: e.target.value,
            })
          }
          placeholder="예: 올리브님"
        />

        <label>감사 내용</label>

        <textarea
          value={thanksForm.message}
          onChange={(e) =>
            setThanksForm({
              ...thanksForm,
              message: e.target.value,
            })
          }
          placeholder="고마웠던 순간이나 칭찬하고 싶은 내용을 남겨주세요."
        />

        <button type="submit">
          Thanks 남기기
        </button>
      </form>

      <section
        className="grid"
        style={{ marginTop: 24 }}
      >
        {thanksList.length === 0 && (
          <div className="empty">
            아직 등록된 Thanks가 없습니다.
          </div>
        )}

        {thanksList.map((item) => {
          const isLiked = likedThanksIds.includes(item.id);

          return (
            <div
              className="card"
              key={item.id}
            >
              <h3>❤️ {item.receiver}</h3>

              <p>{item.message}</p>

              <small>
                {dateLabel(item.created_at)}
              </small>

              <button
                type="button"
                className="soft"
                onClick={() => likeThanks(item)}
                disabled={isLiked}
                style={{ marginTop: 12 }}
              >
                {isLiked
                  ? `❤️ 공감완료 ${item.likes || 0}`
                  : `❤️ 공감 ${item.likes || 0}`}
              </button>
            </div>
          );
        })}
      </section>
    </section>
  );
}