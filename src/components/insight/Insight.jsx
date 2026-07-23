import { dateLabel } from "../../utils/date";

export default function Insight({
  insights,
  selectedInsight,
  setSelectedInsight,
}) {
  return (
    <section className="panel">
      <h2>BC 인사이트</h2>
      <p className="sub">
        월간 만족도, VOC, 트렌드, 교육 이슈를 한눈에 확인하는 공간입니다.
      </p>

      {insights.length === 0 && (
        <div className="empty">등록된 BC 인사이트가 없습니다.</div>
      )}

      <section className="grid">
        {insights.map((item) => (
          <button
            className="card"
            key={item.id}
            onClick={() => setSelectedInsight(item)}
            style={{ textAlign: "left" }}
          >
            {item.image_url && (
              <img
                src={item.image_url}
                alt="BC 인사이트 카드뉴스"
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 16,
                  border: "1px solid #DDE5F3",
                  marginBottom: 12,
                }}
              />
            )}

            <h3>{item.title}</h3>
            <p>{item.month}</p>
            <small>{dateLabel(item.created_at)}</small>
          </button>
        ))}
      </section>

      {selectedInsight && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="row">
            <div>
              <h3>{selectedInsight.title}</h3>
              <p className="sub">
                {selectedInsight.month} ·{" "}
                {dateLabel(selectedInsight.created_at)}
              </p>
            </div>

            <button
              className="soft"
              onClick={() => setSelectedInsight(null)}
            >
              닫기
            </button>
          </div>

          {selectedInsight.image_url && (
            <a
              href={selectedInsight.image_url}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={selectedInsight.image_url}
                alt="BC 인사이트 카드뉴스"
                style={{
                  width: "100%",
                  maxWidth: 720,
                  borderRadius: 20,
                  border: "1px solid #DDE5F3",
                  marginTop: 16,
                }}
              />
            </a>
          )}

          <p style={{ whiteSpace: "pre-line", marginTop: 16 }}>
            {selectedInsight.content}
          </p>
        </div>
      )}
    </section>
  );
}