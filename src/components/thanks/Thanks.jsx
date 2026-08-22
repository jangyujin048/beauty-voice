import React, { useMemo, useState } from "react";
import supabase from "../../api/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function Thanks({
  thanksForm,
  setThanksForm,
  submitThanks,
  thanksList,
  likeThanks,
  likedThanksIds,
  dateLabel,
  refreshThanks,
}) {
  const { user } = useAuth();
  const currentUserId = user?.id || null;
  const [editingId, setEditingId] = useState(null);
  const [editReceiver, setEditReceiver] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [editError, setEditError] = useState("");
  const [expandedIds, setExpandedIds] = useState([]);

  const toggleExpanded = (id) => {
    setExpandedIds((previous) =>
      previous.includes(id)
        ? previous.filter((itemId) => itemId !== id)
        : [...previous, id]
    );
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditReceiver(item.receiver || "");
    setEditMessage(item.message || "");
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditReceiver("");
    setEditMessage("");
    setEditError("");
  };

  const saveEdit = async (item) => {
    if (!currentUserId || item.created_by !== currentUserId) {
      setEditError("본인이 작성한 Thanks만 수정할 수 있습니다.");
      return;
    }
    if (!editReceiver.trim() || !editMessage.trim()) {
      setEditError("대상과 감사 내용을 모두 입력해주세요.");
      return;
    }
    const { error } = await supabase.from("thanks").update({
      receiver: editReceiver.trim(),
      message: editMessage.trim(),
    }).eq("id", item.id).eq("created_by", currentUserId);
    if (error) {
      console.error(error);
      setEditError("수정 중 오류가 발생했습니다.");
      return;
    }
    cancelEdit();
    if (refreshThanks) await refreshThanks();
  };

  const removeThanks = async (item) => {
    if (!currentUserId || item.created_by !== currentUserId) return;
    if (!window.confirm("이 Thanks를 삭제하시겠습니까?\n삭제한 내용은 되돌릴 수 없습니다.")) return;
    const { error } = await supabase.from("thanks").delete()
      .eq("id", item.id).eq("created_by", currentUserId);
    if (error) {
      console.error(error);
      alert("삭제 중 오류가 발생했습니다.");
      return;
    }
    if (refreshThanks) await refreshThanks();
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [openYears, setOpenYears] = useState([
    currentYear,
  ]);

  const [openMonths, setOpenMonths] = useState([
    `${currentYear}-${currentMonth}`,
  ]);

  const toggleYear = (year) => {
    setOpenYears((previous) =>
      previous.includes(year)
        ? previous.filter((item) => item !== year)
        : [...previous, year]
    );
  };

  const toggleMonth = (year, month) => {
    const key = `${year}-${month}`;

    setOpenMonths((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    );
  };

  const groupedThanks = useMemo(() => {
    const groups = {};

    [...thanksList]
      .sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      )
      .forEach((item) => {
        const date = new Date(item.created_at);

        if (Number.isNaN(date.getTime())) {
          return;
        }

        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        if (!groups[year]) {
          groups[year] = {};
        }

        if (!groups[year][month]) {
          groups[year][month] = [];
        }

        groups[year][month].push(item);
      });

    return Object.entries(groups)
      .sort(
        ([yearA], [yearB]) =>
          Number(yearB) - Number(yearA)
      )
      .map(([year, months]) => ({
        year: Number(year),

        count: Object.values(months).reduce(
          (total, items) =>
            total + items.length,
          0
        ),

        months: Object.entries(months)
          .sort(
            ([monthA], [monthB]) =>
              Number(monthB) - Number(monthA)
          )
          .map(([month, items]) => ({
            month: Number(month),
            items,
          })),
      }));
  }, [thanksList]);

  return (
    <section>
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
      <div>
        {thanksList.length === 0 && (
          <div className="empty">
            아직 등록된 Thanks가 없습니다.
          </div>
        )}

        {groupedThanks.map((yearGroup) => {
          const isYearOpen =
            openYears.includes(yearGroup.year);

          return (
            <div
              key={yearGroup.year}
              style={{
                marginBottom: 18,
              }}
            >
              {/* 연도 아코디언 */}
              <button
                type="button"
                onClick={() =>
                  toggleYear(yearGroup.year)
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 18px",
                  border: "1px solid #DDE5F3",
                  borderRadius: 14,
                  background: "#F5F8FD",
                  color: "#163A73",
                  fontSize: 17,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <span>
                  {isYearOpen ? "▼" : "▶"}{" "}
                  {yearGroup.year}년
                </span>

                <span
                  style={{
                    fontSize: 13,
                    color: "#667085",
                    fontWeight: 700,
                  }}
                >
                  {yearGroup.count}개
                </span>
              </button>

              {isYearOpen && (
                <div
                  style={{
                    marginTop: 12,
                  }}
                >
                  {yearGroup.months.map(
                    (monthGroup) => {
                      const monthKey =
                        `${yearGroup.year}-${monthGroup.month}`;

                      const isMonthOpen =
                        openMonths.includes(monthKey);

                      return (
                        <div
                          key={monthKey}
                          style={{
                            marginBottom: 18,
                          }}
                        >
                          {/* 월 아코디언 */}
                          <button
                            type="button"
                            onClick={() =>
                              toggleMonth(
                                yearGroup.year,
                                monthGroup.month
                              )
                            }
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent:
                                "space-between",
                              padding:
                                "10px 4px 10px 2px",
                              border: 0,
                              borderBottom:
                                "1px solid #E5EAF2",
                              background:
                                "transparent",
                              color: "#1F2937",
                              cursor: "pointer",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 15,
                                  fontWeight: 800,
                                  color: "#163A73",
                                }}
                              >
                                {isMonthOpen
                                  ? "▼"
                                  : "▶"}{" "}
                                {
                                  monthGroup.month
                                }
                                월의 Thanks
                              </span>

                              {yearGroup.year ===
                                currentYear &&
                                monthGroup.month ===
                                  currentMonth && (
                                  <span
                                    style={{
                                      padding:
                                        "3px 8px",
                                      borderRadius: 999,
                                      background:
                                        "#EAF1FB",
                                      color:
                                        "#163A73",
                                      fontSize: 10,
                                      fontWeight: 800,
                                      letterSpacing: 0.4,
                                    }}
                                  >
                                    NOW
                                  </span>
                                )}
                            </div>

                            <span
                              style={{
                                fontSize: 12,
                                color: "#98A2B3",
                                fontWeight: 700,
                              }}
                            >
                              {
                                monthGroup.items
                                  .length
                              }
                              개
                            </span>
                          </button>

                          {isMonthOpen && (
                            <section
                              className="grid"
                              style={{
                                marginTop: 16,
                              }}
                            >
                              {monthGroup.items.map(
                                (item) => {
                                  const isLiked =
                                     likedThanksIds
                                       .map(String)
                                       .includes(String(item.id));

                                  const isExpanded =
                                    expandedIds.includes(
                                      item.id
                                    );

                                  const isLongMessage =
                                    item.message
                                      ?.length > 120;

                                  const isMine =
                                    Boolean(currentUserId) &&
                                    item.created_by === currentUserId;

                                  const isEditing =
                                    editingId === item.id;

                                  return (
                                    <div
                                      className="card"
                                      key={item.id}
                                      style={{
                                        padding: 20,
                                        display:
                                          "flex",
                                        flexDirection:
                                          "column",
                                        minHeight: 220,
                                      }}
                                    >
                                      {/* 대상 */}
                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
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
                                          {
                                            item.receiver
                                          }
                                        </h3>
                                      </div>

                                      {/* 내용 */}
                                      {isEditing ? (
                                        <div
                                          style={{
                                            display: "grid",
                                            gap: 10,
                                          }}
                                        >
                                          <input
                                            value={editReceiver}
                                            onChange={(e) =>
                                              setEditReceiver(
                                                e.target.value
                                              )
                                            }
                                            placeholder="감사를 전할 대상"
                                            style={{
                                              height: 42,
                                              padding: "0 12px",
                                              border:
                                                "1px solid #CBD5E1",
                                              borderRadius: 10,
                                              outline: "none",
                                            }}
                                          />

                                          <textarea
                                            value={editMessage}
                                            onChange={(e) =>
                                              setEditMessage(
                                                e.target.value
                                              )
                                            }
                                            rows={5}
                                            style={{
                                              padding: 12,
                                              border:
                                                "1px solid #CBD5E1",
                                              borderRadius: 10,
                                              lineHeight: 1.6,
                                              outline: "none",
                                              resize: "vertical",
                                            }}
                                          />

                                          {editError && (
                                            <small
                                              style={{
                                                color: "#B42318",
                                                fontWeight: 700,
                                              }}
                                            >
                                              {editError}
                                            </small>
                                          )}

                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent:
                                                "flex-end",
                                              gap: 8,
                                            }}
                                          >
                                            <button
                                              type="button"
                                              onClick={cancelEdit}
                                            >
                                              취소
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                saveEdit(item)
                                              }
                                              style={{
                                                background:
                                                  "#163A73",
                                                color: "#fff",
                                                border: 0,
                                                borderRadius: 8,
                                                padding:
                                                  "8px 12px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                              }}
                                            >
                                              저장
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <p
                                            style={{
                                              margin: 0,
                                              lineHeight: 1.7,
                                              whiteSpace:
                                                "pre-wrap",
                                              display:
                                                isLongMessage &&
                                                !isExpanded
                                                  ? "-webkit-box"
                                                  : "block",
                                              WebkitLineClamp:
                                                isLongMessage &&
                                                !isExpanded
                                                  ? 4
                                                  : "unset",
                                              WebkitBoxOrient:
                                                "vertical",
                                              overflow:
                                                isLongMessage &&
                                                !isExpanded
                                                  ? "hidden"
                                                  : "visible",
                                            }}
                                          >
                                            {item.message}
                                          </p>

                                          {isLongMessage && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                toggleExpanded(
                                                  item.id
                                                )
                                              }
                                              style={{
                                                marginTop: 8,
                                                padding: 0,
                                                border: 0,
                                                background:
                                                  "transparent",
                                                color:
                                                  "#163A73",
                                                fontSize: 13,
                                                fontWeight: 700,
                                                cursor:
                                                  "pointer",
                                                alignSelf:
                                                  "flex-start",
                                              }}
                                            >
                                              {isExpanded
                                                ? "접기"
                                                : "더보기"}
                                            </button>
                                          )}
                                        </>
                                      )}

                                      {isMine && !isEditing && (
                                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                                          <button type="button" onClick={() => startEdit(item)} style={{ border: 0, background: "transparent", color: "#667085", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                            수정
                                          </button>
                                          <button type="button" onClick={() => removeThanks(item)} style={{ border: 0, background: "transparent", color: "#B42318", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                            삭제
                                          </button>
                                        </div>
                                      )}

                                      {/* 하단 */}
                                      <div
                                        style={{
                                          marginTop:
                                            "auto",
                                          paddingTop: 18,
                                        }}
                                      >
                                        <small
                                          style={{
                                            display:
                                              "block",
                                            color:
                                              "#667085",
                                            marginBottom: 10,
                                          }}
                                        >
                                          {dateLabel(
                                            item.created_at
                                          )}
                                        </small>

                                        <button
                                          type="button"
                                          className="soft"
                                          onClick={() =>
                                            likeThanks(
                                              item
                                            )
                                          }
                                          style={{
                                            padding:
                                              "8px 12px",
                                            borderRadius: 10,
                                            fontSize: 13,
                                            fontWeight: 700,
                                          }}
                                        >
                                          {isLiked
                                            ? `❤️ 공감완료 ${
                                                item.likes ||
                                                0
                                              }`
                                            : `❤️ 공감 ${
                                                item.likes ||
                                                0
                                              }`}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </section>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}