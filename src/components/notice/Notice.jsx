import React from "react";
import { ChevronRight, X } from "lucide-react";
import { dateLabel } from "../../utils/date";

export default function Notice({
  notices,
  selectedNotice,
  setSelectedNotice,
  renderLinkedText,
}) {

const featuredNotice =
  notices?.find(
    notice => notice.is_featured === true
  ) || null;

const previousNotices =
  notices?.filter(
    notice => notice.id !== featuredNotice?.id
  ) || [];

  return (
    <section className="panel">
      <h2>공지사항</h2>

      <p className="sub">
        사이트 이용 방법, 취합 안내 등 주요 공지를 확인하는 공간입니다.
      </p>

      {/* 대표 공지 */}
      {featuredNotice ? (
        <div
          style={{
            marginTop: 28,
            padding: "32px 34px",
            borderRadius: 22,
            border: "1px solid #DDE5F3",
            background:
              "linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              color: "#123B7A",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <span>📢</span>
            <span>대표 공지</span>
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 26,
            }}
          >
            {featuredNotice.title}
          </h2>

          <div
            className="sub"
            style={{
              marginTop: 8,
              fontSize: 13,
            }}
          >
            공지일 · {dateLabel(featuredNotice.created_at)}

            {featuredNotice.updated_at && (
              <span style={{ marginLeft: 10 }}>
                · 수정됨 {dateLabel(featuredNotice.updated_at)}
              </span>
            )}
          </div>

          <div
            style={{
              marginTop: 24,
              lineHeight: 1.8,
              whiteSpace: "pre-line",
            }}
          >
            {renderLinkedText(featuredNotice.body)}
          </div>

          {featuredNotice.image_url && (
            <a
              href={featuredNotice.image_url}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={featuredNotice.image_url}
                alt="공지 이미지"
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: 620,
                  maxHeight: 420,
                  objectFit: "cover",
                  borderRadius: 16,
                  border: "1px solid #DDE5F3",
                  marginTop: 24,
                }}
              />
            </a>
          )}
        </div>
      ) : (
        <div
          className="empty"
          style={{ marginTop: 28 }}
        >
          등록된 공지가 없습니다.
        </div>
      )}

      {/* 공지 사항 */}
      {previousNotices.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>
              공지 사항
            </h3>

            <span
              className="sub"
              style={{ fontSize: 13 }}
            >
              {previousNotices.length}건
            </span>
          </div>

          <div
            style={{
              borderTop: "1px solid #DDE5F3",
            }}
          >
            {previousNotices.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() =>
                  setSelectedNotice(n)
                }
                style={{
                  width: "100%",
                  padding: "18px 8px",
                  border: "none",
                  borderBottom:
                    "1px solid #E8EDF5",
                  borderRadius: 0,
                  background: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "space-between",
                  gap: 20,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#172033",
                    }}
                  >
                    {n.title}
                  </div>

                  <div
                    className="sub"
                    style={{
                      marginTop: 5,
                      fontSize: 13,
                    }}
                  >
                    {dateLabel(n.created_at)}
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  color="#8290A8"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 지난 공지 상세 */}
      {selectedNotice &&
        selectedNotice.id !== featuredNotice?.id && (
          <div
            className="card"
            style={{
              marginTop: 24,
              padding: 28,
            }}
          >
            <div
              className="row"
              style={{
                alignItems: "flex-start",
              }}
            >
              <div>
                <h2
                  style={{
                    marginTop: 0,
                    marginBottom: 8,
                  }}
                >
                  {selectedNotice.title}
                </h2>

                <div className="sub">
                  <div>
                    공지일 ·{" "}
                    {dateLabel(
                      selectedNotice.created_at
                    )}
                  </div>

                  {selectedNotice.updated_at && (
                    <div
                      style={{
                        marginTop: 4,
                      }}
                    >
                      ✏ 수정됨 ·{" "}
                      {dateLabel(
                        selectedNotice.updated_at
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="soft"
                onClick={() =>
                  setSelectedNotice(null)
                }
                aria-label="공지 닫기"
              >
                <X size={17} />
                닫기
              </button>
            </div>

            <div
              style={{
                whiteSpace: "pre-line",
                marginTop: 20,
                lineHeight: 1.8,
              }}
            >
              {renderLinkedText(
                selectedNotice.body
              )}
            </div>

            {selectedNotice.image_url && (
              <a
                href={selectedNotice.image_url}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={
                    selectedNotice.image_url
                  }
                  alt="공지 이미지"
                  style={{
                    width: "100%",
                    maxWidth: 620,
                    maxHeight: 420,
                    objectFit: "cover",
                    borderRadius: 18,
                    border:
                      "1px solid #DDE5F3",
                    marginTop: 20,
                  }}
                />
              </a>
            )}
          </div>
        )}
    </section>
  );
}