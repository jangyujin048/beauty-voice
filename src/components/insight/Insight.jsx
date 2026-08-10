import { dateLabel } from "../../utils/date";

export default function Insight({
  insights,
  selectedInsight,
  setSelectedInsight,
}) {
  const sortedInsights = [...insights].sort(
    (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
  );

  const featuredInsight =
    sortedInsights[0] || null;

  const otherInsights =
    sortedInsights.slice(1);

  return (
    <section className="panel">
      <h2>BC 인사이트</h2>

      <p className="sub">
        월간 만족도, VOC, 트렌드, 교육 이슈를 한눈에 확인하는 공간입니다.
      </p>

      {insights.length === 0 && (
        <div className="empty">
          등록된 BC 인사이트가 없습니다.
        </div>
      )}

      {/* 최신 대표 인사이트 */}
      {featuredInsight && (
        <div
          className="card"
          style={{
            marginTop: 24,
            marginBottom: 28,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#163A73",
                  marginBottom: 8,
                }}
              >
                LATEST INSIGHT
              </div>

              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 22,
                }}
              >
                {featuredInsight.title}
              </h3>

              <p
                className="sub"
                style={{
                  margin: "0 0 16px",
                }}
              >
                {featuredInsight.month} ·{" "}
                {dateLabel(
                  featuredInsight.created_at
                )}
              </p>

              <p
                style={{
                  margin: 0,
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {featuredInsight.content}
              </p>

              <button
                type="button"
                className="soft"
                onClick={() =>
                  setSelectedInsight(
                    featuredInsight
                  )
                }
                style={{
                  marginTop: 18,
                }}
              >
                자세히 보기
              </button>
            </div>

            {featuredInsight.image_url && (
              <img
                src={
                  featuredInsight.image_url
                }
                alt="BC 인사이트 카드뉴스"
                style={{
                  width: 260,
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 16,
                  border:
                    "1px solid #DDE5F3",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* 이전 인사이트 */}
      {otherInsights.length > 0 && (
        <>
          <h3
            style={{
              marginBottom: 14,
              fontSize: 18,
            }}
          >
            이전 인사이트
          </h3>

          <section className="grid">
            {otherInsights.map(
              (item) => (
                <button
                  className="card"
                  key={item.id}
                  onClick={() =>
                    setSelectedInsight(
                      item
                    )
                  }
                  style={{
                    textAlign: "left",
                  }}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="BC 인사이트 카드뉴스"
                      style={{
                        width: "100%",
                        height: 150,
                        objectFit:
                          "cover",
                        borderRadius:
                          14,
                        border:
                          "1px solid #DDE5F3",
                        marginBottom:
                          12,
                      }}
                    />
                  )}

                  <h3>
                    {item.title}
                  </h3>

                  <p>{item.month}</p>

                  <small>
                    {dateLabel(
                      item.created_at
                    )}
                  </small>
                </button>
              )
            )}
          </section>
        </>
      )}

      {/* 상세 */}
      {selectedInsight && (
        <div
          className="card"
          style={{
            marginTop: 24,
          }}
        >
          <div className="row">
            <div>
              <h3>
                {selectedInsight.title}
              </h3>

              <p className="sub">
                {selectedInsight.month} ·{" "}
                {dateLabel(
                  selectedInsight.created_at
                )}
              </p>
            </div>

            <button
              className="soft"
              onClick={() =>
                setSelectedInsight(
                  null
                )
              }
            >
              닫기
            </button>
          </div>

          {selectedInsight.image_url && (
            <a
              href={
                selectedInsight.image_url
              }
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={
                  selectedInsight.image_url
                }
                alt="BC 인사이트 카드뉴스"
                style={{
                  width: "100%",
                  maxWidth: 720,
                  borderRadius: 20,
                  border:
                    "1px solid #DDE5F3",
                  marginTop: 16,
                }}
              />
            </a>
          )}

          <p
            style={{
              whiteSpace: "pre-line",
              marginTop: 16,
            }}
          >
            {selectedInsight.content}
          </p>
        </div>
      )}
    </section>
  );
}