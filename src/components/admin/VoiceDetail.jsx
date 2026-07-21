import { dateLabel } from "../../utils/date";

export default function VoiceDetail({
  selected,
  reply,
  onReplyChange,
  onSubmitReply,
  onStatusChange
}) {
  return (
    <div className="detail">
      {!selected ? (
        <div className="empty">
          왼쪽 접수함에서 내용을 선택해주세요.
        </div>
      ) : (
        <>
          <div className="detailTop">
            <div>
              <h3>{selected.title}</h3>
              <p>
                {selected.anonId} · {selected.store} ·{" "}
                {selected.category} · {dateLabel(selected.createdAt)}
              </p>
            </div>

            <select
              value={selected.status}
              onChange={(event) =>
                onStatusChange(selected.id, event.target.value)
              }
            >
              <option>접수</option>
              <option>검토중</option>
              <option>처리중</option>
              <option>답변완료</option>
            </select>
          </div>

          <div className="chat">
            <div className="bubble user">
              <b>{selected.anonId}</b>
              <p>{selected.content}</p>

              {selected.imageUrl && (
                <a
                  href={selected.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={selected.imageUrl}
                    alt="첨부 이미지"
                    style={{
                      maxWidth: "100%",
                      borderRadius: 16,
                      marginTop: 12
                    }}
                  />
                </a>
              )}

              <small>{dateLabel(selected.createdAt)}</small>
            </div>

            {selected.adminReply && (
              <div className="bubble admin">
                <b>운영진</b>
                <p>{selected.adminReply}</p>
                <small>{dateLabel(selected.repliedAt)}</small>
              </div>
            )}
          </div>

          <form className="replyForm" onSubmit={onSubmitReply}>
            <textarea
              value={reply}
              onChange={(event) => onReplyChange(event.target.value)}
              placeholder={
                selected.adminReply
                  ? "답변을 수정할 수 있습니다."
                  : "운영진 답변을 입력하세요."
              }
            />

            <button type="submit">
              {selected.adminReply ? "답변 수정" : "답변 등록"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
