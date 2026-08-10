import React from "react";
import { ArrowRight, MessageCircle } from "lucide-react";

function formatPeriod(startDate, endDate) {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
}

function getDDay(endDate) {
  if (!endDate) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-DAY";
  return "종료";
}

export default function ChallengeCard({ challenge, onClick, compact = false }) {
  const period = formatPeriod(challenge?.start_date, challenge?.end_date);
  const dDay = getDDay(challenge?.end_date);

  return (
    <article
      className="card"
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(challenge)}
      onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(challenge);
        }
      }}
      style={{ cursor: "pointer", padding: compact ? 18 : 24 }}
    >
      {!compact && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.08em" }}>
            ♥ BEAUTY MISSION
          </span>
          <span style={{ padding: "6px 10px", borderRadius: 999, background: "#f1edff", color: "#6147a8", fontSize: 12, fontWeight: 800 }}>
            {dDay}
          </span>
        </div>
      )}

      <h3 style={{ marginBottom: 10, fontSize: compact ? 17 : 22 }}>
        {challenge?.title || "주간 챌린지"}
      </h3>

      <p className="sub" style={{ marginBottom: compact ? 14 : 20, lineHeight: 1.65, whiteSpace: "pre-line" }}>
        {challenge?.description || "이번 주 챌린지에 참여해보세요."}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <span>{period}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <MessageCircle size={15} />
            {challenge?.participant_count ?? 0}명 참여
          </span>
        </div>

        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800 }}>
          {compact ? "결과 보기" : "참여하기"}
          <ArrowRight size={16} />
        </span>
      </div>
    </article>
  );
}