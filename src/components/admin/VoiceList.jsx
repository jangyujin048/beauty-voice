import { Inbox } from "lucide-react";
import { dateLabel } from "../../utils/date";

export default function VoiceList({
  voices,
  selected,
  onSelect
}) {
  return (
    <div className="inbox">
      <h3>
        <Inbox size={18} /> 접수함
      </h3>

      {voices.length === 0 && (
        <div className="empty">
          해당 조건의 접수 건이 없습니다.
        </div>
      )}

      {voices.map((voice) => (
        <button
          type="button"
          key={voice.id}
          className={`ticket ${
            selected?.id === voice.id ? "picked" : ""
          }`}
          onClick={() => onSelect(voice)}
        >
          <div className="ticketTop">
            <b>{voice.anonId}</b>
            <span>{voice.store}</span>
            <em>{voice.status}</em>
          </div>

          <div className="ticketMeta">{voice.category}</div>

          <p>
            <b>{voice.title}</b>
          </p>

          <p>{voice.content}</p>

          {voice.imageUrl && (
            <small>📎 첨부 이미지 있음</small>
          )}

          <small>{dateLabel(voice.createdAt)}</small>
        </button>
      ))}
    </div>
  );
}
