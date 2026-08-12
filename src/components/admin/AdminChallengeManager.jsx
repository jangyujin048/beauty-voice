import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CheckCircle2,
  CirclePlay,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import {
  checkIsAdmin,
  closeWeeklyChallenge,
  createWeeklyChallenge,
  deleteWeeklyChallenge,
  getWeeklyChallenges,
  reopenWeeklyChallenge,
  updateWeeklyChallenge,
} from "../../services/challengeService";

const EMPTY_FORM = {
  title: "",
  description: "",
  prompt: "",
  startDate: "",
  endDate: "",
  status: "active",
};

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ko-KR");
}

export default function AdminChallengeManager() {
  const [challenges, setChallenges] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [
    isCheckingAdmin,
    setIsCheckingAdmin,
  ] = useState(true);

  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false);

  const [
    editingChallengeId,
    setEditingChallengeId,
  ] = useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    processingChallengeId,
    setProcessingChallengeId,
  ] = useState(null);

  const checkAdminPermission =
    useCallback(async () => {
      try {
        setIsCheckingAdmin(true);

        const result =
          await checkIsAdmin();

        setIsAdmin(result);
      } catch (error) {
        console.error(
          "운영진 권한 확인 오류:",
          error
        );

        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    }, []);

  const loadChallenges =
    useCallback(async () => {
      try {
        setIsLoading(true);

        const data =
          await getWeeklyChallenges();

        setChallenges(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (error) {
        console.error(
          "챌린지 목록 조회 오류:",
          error
        );

        alert(
          "챌린지 목록을 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    checkAdminPermission();
    loadChallenges();
  }, [
    checkAdminPermission,
    loadChallenges,
  ]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingChallengeId(null);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setEditingChallengeId(null);

    setForm({
      ...EMPTY_FORM,
      status: "active",
    });

    setIsFormOpen(true);
  };

  const openEditForm = (challenge) => {
    setEditingChallengeId(
      challenge.id
    );

    setForm({
      title:
        challenge.title || "",

      description:
        challenge.description || "",

      prompt:
        challenge.prompt || "",

      startDate:
        challenge.start_date || "",

      endDate:
        challenge.end_date || "",

      status:
        challenge.status ||
        "active",
    });

    setIsFormOpen(true);
  };

  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setForm((previous) => ({
        ...previous,
        [name]: value,
      }));
    };

  const validateForm = () => {
    if (!form.title.trim()) {
      alert(
        "챌린지 제목을 입력해주세요."
      );
      return false;
    }

    if (!form.description.trim()) {
      alert(
        "챌린지 설명을 입력해주세요."
      );
      return false;
    }

    if (
      !form.startDate ||
      !form.endDate
    ) {
      alert(
        "챌린지 기간을 설정해주세요."
      );
      return false;
    }

    if (
      new Date(form.startDate) >
      new Date(form.endDate)
    ) {
      alert(
        "종료일은 시작일보다 빠를 수 없습니다."
      );
      return false;
    }

    return true;
  };

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      if (!isAdmin) {
        alert(
          "등록된 운영진 계정만 챌린지를 관리할 수 있습니다."
        );
        return;
      }

      if (isSubmitting) {
        return;
      }

      try {
        setIsSubmitting(true);

        if (editingChallengeId) {
          await updateWeeklyChallenge(
            editingChallengeId,
            {
              title:
                form.title,

              description:
                form.description,

              prompt:
                form.prompt,

              startDate:
                form.startDate,

              endDate:
                form.endDate,

              status:
                form.status,
            }
          );

          alert(
            "챌린지가 수정되었습니다."
          );
        } else {
          await createWeeklyChallenge({
            title:
              form.title,

            description:
              form.description,

            prompt:
              form.prompt,

            startDate:
              form.startDate,

            endDate:
              form.endDate,

            status:
              form.status,
          });

          alert(
            "챌린지가 등록되었습니다."
          );
        }

        resetForm();

        await loadChallenges();
      } catch (error) {
        console.error(
          "챌린지 저장 오류:",
          error
        );

        alert(
          error?.message ||
            "챌린지를 저장하지 못했습니다."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  const handleCloseChallenge =
    async (challenge) => {
      if (!isAdmin) {
        alert(
          "운영진 계정만 사용할 수 있습니다."
        );
        return;
      }

      const shouldClose =
        window.confirm(
          `"${challenge.title}" 챌린지를 종료할까요?\n종료하면 지난 챌린지로 이동합니다.`
        );

      if (!shouldClose) {
        return;
      }

      try {
        setProcessingChallengeId(
          challenge.id
        );

        await closeWeeklyChallenge(
          challenge.id
        );

        await loadChallenges();
      } catch (error) {
        console.error(
          "챌린지 종료 오류:",
          error
        );

        alert(
          "챌린지를 종료하지 못했습니다."
        );
      } finally {
        setProcessingChallengeId(
          null
        );
      }
    };

  const handleReopenChallenge =
    async (challenge) => {
      if (!isAdmin) {
        alert(
          "운영진 계정만 사용할 수 있습니다."
        );
        return;
      }

      const shouldReopen =
        window.confirm(
          `"${challenge.title}" 챌린지를 다시 진행 상태로 변경할까요?`
        );

      if (!shouldReopen) {
        return;
      }

      try {
        setProcessingChallengeId(
          challenge.id
        );

        await reopenWeeklyChallenge(
          challenge.id
        );

        await loadChallenges();
      } catch (error) {
        console.error(
          "챌린지 재오픈 오류:",
          error
        );

        alert(
          "챌린지 상태를 변경하지 못했습니다."
        );
      } finally {
        setProcessingChallengeId(
          null
        );
      }
    };

  const handleDeleteChallenge =
    async (challenge) => {
      if (!isAdmin) {
        alert(
          "운영진 계정만 사용할 수 있습니다."
        );
        return;
      }

      const shouldDelete =
        window.confirm(
          `"${challenge.title}" 챌린지를 삭제할까요?\n\n참여 댓글도 함께 삭제되며 복구할 수 없습니다.`
        );

      if (!shouldDelete) {
        return;
      }

      try {
        setProcessingChallengeId(
          challenge.id
        );

        await deleteWeeklyChallenge(
          challenge.id
        );

        await loadChallenges();
      } catch (error) {
        console.error(
          "챌린지 삭제 오류:",
          error
        );

        alert(
          "챌린지를 삭제하지 못했습니다."
        );
      } finally {
        setProcessingChallengeId(
          null
        );
      }
    };

  if (isCheckingAdmin) {
    return (
      <div className="card">
        운영진 계정 권한을 확인하는 중...
      </div>
    );
  }

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #DDE5F3",
    borderRadius: 12,
    background: "#F9FBFF",
    color: "#1F2937",
    outline: "none",
    fontSize: 14,
  };

  const labelStyle = {
    display: "block",
    marginBottom: 8,
    color: "#1F2937",
    fontSize: 14,
    fontWeight: 800,
  };

  return (
    <div>
      {/* 페이지 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              color: "#43679B",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.2,
              marginBottom: 8,
            }}
          >
            CONTENT MANAGEMENT
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: "#1F2937",
            }}
          >
            주간 챌린지 관리
          </h2>

          <p
            className="sub"
            style={{
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            구성원이 가볍게 참여할 수 있는
            미션을 등록하고 운영 상태를
            관리합니다.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="soft"
            onClick={
              loadChallenges
            }
            disabled={isLoading}
          >
            <RefreshCw
              size={16}
            />
            새로고침
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={openCreateForm}
            disabled={!isAdmin}
          >
            <Plus size={17} />
            새 챌린지
          </button>
        </div>
      </div>

      {/* 권한 안내 */}
      {!isAdmin && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            padding: 20,
            borderColor: "#F1D8A8",
            background: "#FFFDF7",
          }}
        >
          <strong
            style={{
              color: "#7A5412",
            }}
          >
            운영진 계정 확인 필요
          </strong>

          <p
            className="sub"
            style={{
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            현재 로그인한 Google 계정은
            admin_users에 등록되어 있지
            않습니다. 기존 운영진
            비밀번호로 페이지에
            들어왔더라도 챌린지
            등록·수정은 할 수 없습니다.
          </p>
        </div>
      )}

      {/* 등록 / 수정 폼 */}
      {isFormOpen && (
        <form
          onSubmit={
            handleSubmit
          }
          style={{
            marginBottom: 28,
            border:
              "1px solid #DDE5F3",
            borderRadius: 20,
            background: "#FFFFFF",
            overflow: "hidden",
            boxShadow:
              "0 10px 30px rgba(22, 58, 115, 0.05)",
          }}
        >
          {/* 폼 헤더 */}
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              gap: 16,
              padding: "24px 26px",
              borderBottom:
                "1px solid #EDF1F7",
              background:
                "linear-gradient(135deg, #F8FBFF 0%, #F2F6FC 100%)",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 9px",
                  marginBottom: 10,
                  borderRadius: 999,
                  background: "#EAF1FB",
                  color: "#163A73",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                }}
              >
                {editingChallengeId
                  ? "CHALLENGE EDIT"
                  : "NEW CHALLENGE"}
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize: 21,
                  fontWeight: 800,
                  color: "#1F2937",
                }}
              >
                {editingChallengeId
                  ? "챌린지 수정"
                  : "새 챌린지 등록"}
              </h3>

              <p
                className="sub"
                style={{
                  margin:
                    "7px 0 0",
                  fontSize: 13,
                }}
              >
                구성원이 부담 없이 참여할 수
                있도록 짧고 명확한 미션을
                만들어주세요.
              </p>
            </div>

            <button
              type="button"
              className="soft"
              onClick={
                resetForm
              }
              disabled={
                isSubmitting
              }
              style={{
                minWidth: 40,
                padding:
                  "9px 11px",
              }}
            >
              <X size={16} />
              닫기
            </button>
          </div>

          <div
            style={{
              padding: 26,
            }}
          >
            {/* 기본 정보 */}
            <div
              style={{
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: "#EAF1FB",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 15,
                  }}
                >
                  ✨
                </div>

                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 15,
                    }}
                  >
                    기본 정보
                  </strong>

                  <span
                    className="sub"
                    style={{
                      fontSize: 12,
                    }}
                  >
                    챌린지 카드에 보여질
                    내용을 입력해주세요.
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginBottom: 18,
                }}
              >
                <label
                  htmlFor="challenge-title"
                  style={labelStyle}
                >
                  챌린지 제목
                </label>

                <input
                  id="challenge-title"
                  name="title"
                  value={form.title}
                  onChange={
                    handleFormChange
                  }
                  placeholder="예: 칭찬은 가까이"
                  maxLength={80}
                  disabled={
                    isSubmitting
                  }
                  style={{
                    ...fieldStyle,
                    height: 48,
                    padding:
                      "0 14px",
                  }}
                />

                <div
                  style={{
                    marginTop: 6,
                    textAlign: "right",
                    color: "#98A2B3",
                    fontSize: 11,
                  }}
                >
                  {form.title.length} / 80
                </div>
              </div>

              <div>
                <label
                  htmlFor="challenge-description"
                  style={labelStyle}
                >
                  카드 설명
                </label>

                <textarea
                  id="challenge-description"
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleFormChange
                  }
                  rows={3}
                  placeholder="챌린지 카드에 표시할 설명을 입력해주세요."
                  disabled={
                    isSubmitting
                  }
                  style={{
                    ...fieldStyle,
                    minHeight: 100,
                    padding: 14,
                    resize: "vertical",
                    lineHeight: 1.6,
                  }}
                />

                <p
                  className="sub"
                  style={{
                    margin:
                      "6px 0 0",
                    fontSize: 11,
                  }}
                >
                  홈과 챌린지 목록 카드에서
                  제목 아래에 노출됩니다.
                </p>
              </div>
            </div>

            {/* 참여 질문 */}
            <div
              style={{
                padding: 20,
                marginBottom: 28,
                border:
                  "1px solid #D9E6F5",
                borderRadius: 16,
                background: "#F7FAFE",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "#163A73",
                    color: "#FFFFFF",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 16,
                  }}
                >
                  💬
                </div>

                <div>
                  <strong
                    style={{
                      display: "block",
                      color: "#163A73",
                      fontSize: 15,
                    }}
                  >
                    참여 질문
                  </strong>

                  <span
                    style={{
                      display: "block",
                      marginTop: 2,
                      color: "#667085",
                      fontSize: 12,
                    }}
                  >
                    구성원이 댓글로 답하게 될
                    핵심 질문입니다.
                  </span>
                </div>
              </div>

              <textarea
                id="challenge-prompt"
                name="prompt"
                value={form.prompt}
                onChange={
                  handleFormChange
                }
                rows={3}
                placeholder="예: 이번 주 나에게 힘이 되어준 동료는 누구였나요?"
                disabled={
                  isSubmitting
                }
                style={{
                  ...fieldStyle,
                  minHeight: 96,
                  padding: 14,
                  background: "#FFFFFF",
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
              />
            </div>

            {/* 운영 설정 */}
            <div
              style={{
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    background: "#EEF3F8",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 14,
                  }}
                >
                  📅
                </div>

                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 15,
                    }}
                  >
                    운영 설정
                  </strong>

                  <span
                    className="sub"
                    style={{
                      fontSize: 12,
                    }}
                  >
                    챌린지 기간과 상태를
                    설정해주세요.
                  </span>
                </div>
              </div>

              {/* 날짜 */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label
                    htmlFor="challenge-start-date"
                    style={labelStyle}
                  >
                    시작일
                  </label>

                  <input
                    id="challenge-start-date"
                    type="date"
                    name="startDate"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      isSubmitting
                    }
                    style={{
                      ...fieldStyle,
                      height: 48,
                      padding:
                        "0 14px",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="challenge-end-date"
                    style={labelStyle}
                  >
                    종료일
                  </label>

                  <input
                    id="challenge-end-date"
                    type="date"
                    name="endDate"
                    value={
                      form.endDate
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      isSubmitting
                    }
                    style={{
                      ...fieldStyle,
                      height: 48,
                      padding:
                        "0 14px",
                    }}
                  />
                </div>
              </div>

              {/* 상태 */}
              <label
                style={labelStyle}
              >
                공개 상태
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        status: "active",
                      })
                    )
                  }
                  disabled={
                    isSubmitting
                  }
                  style={{
                    padding:
                      "15px 16px",
                    border:
                      form.status ===
                      "active"
                        ? "1.5px solid #163A73"
                        : "1px solid #DDE5F3",
                    borderRadius: 12,
                    background:
                      form.status ===
                      "active"
                        ? "#F0F5FC"
                        : "#FFFFFF",
                    color:
                      form.status ===
                      "active"
                        ? "#163A73"
                        : "#667085",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    ● 진행 중
                  </strong>

                  <span
                    style={{
                      fontSize: 11,
                    }}
                  >
                    구성원에게 현재 챌린지로
                    노출됩니다.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm(
                      (previous) => ({
                        ...previous,
                        status: "closed",
                      })
                    )
                  }
                  disabled={
                    isSubmitting
                  }
                  style={{
                    padding:
                      "15px 16px",
                    border:
                      form.status ===
                      "closed"
                        ? "1.5px solid #667085"
                        : "1px solid #DDE5F3",
                    borderRadius: 12,
                    background:
                      form.status ===
                      "closed"
                        ? "#F5F6F7"
                        : "#FFFFFF",
                    color:
                      form.status ===
                      "closed"
                        ? "#344054"
                        : "#667085",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    ○ 종료
                  </strong>

                  <span
                    style={{
                      fontSize: 11,
                    }}
                  >
                    지난 챌린지 영역으로
                    이동합니다.
                  </span>
                </button>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: 10,
                paddingTop: 20,
                borderTop:
                  "1px solid #EDF1F7",
              }}
            >
              <button
                type="button"
                className="soft"
                onClick={
                  resetForm
                }
                disabled={
                  isSubmitting
                }
                style={{
                  padding:
                    "10px 18px",
                }}
              >
                취소
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={
                  isSubmitting ||
                  !isAdmin
                }
                style={{
                  padding:
                    "10px 20px",
                }}
              >
                <CheckCircle2
                  size={17}
                />

                {isSubmitting
                  ? "저장 중..."
                  : editingChallengeId
                    ? "수정 저장"
                    : "챌린지 등록"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 목록 타이틀 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          marginBottom: 14,
          marginTop: 8,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
            }}
          >
            등록된 챌린지
          </h3>

          <p
            className="sub"
            style={{
              margin:
                "5px 0 0",
              fontSize: 12,
            }}
          >
            진행 중인 챌린지와 지난
            챌린지를 확인할 수 있습니다.
          </p>
        </div>

        <span
          className="sub"
          style={{
            fontSize: 12,
          }}
        >
          총 {challenges.length}개
        </span>
      </div>

      {/* 챌린지 목록 */}
      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {isLoading ? (
          <div className="card">
            챌린지를 불러오는 중...
          </div>
        ) : challenges.length === 0 ? (
          <div className="empty">
            등록된 챌린지가 없습니다.
          </div>
        ) : (
          challenges.map(
            (challenge) => {
              const isProcessing =
                processingChallengeId ===
                challenge.id;

              const isActive =
                challenge.status ===
                "active";

              return (
                <article
                  key={
                    challenge.id
                  }
                  style={{
                    padding: 22,
                    border:
                      isActive
                        ? "1px solid #C9D9EE"
                        : "1px solid #E4E7EC",
                    borderRadius: 16,
                    background:
                      isActive
                        ? "#FFFFFF"
                        : "#FCFCFD",
                    boxShadow:
                      isActive
                        ? "0 6px 20px rgba(22, 58, 115, 0.04)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap: 18,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {/* 상태 */}
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 8,
                          flexWrap:
                            "wrap",
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            padding:
                              "5px 10px",
                            borderRadius:
                              999,
                            background:
                              isActive
                                ? "#EAF7EF"
                                : "#F2F4F7",
                            color:
                              isActive
                                ? "#247044"
                                : "#667085",
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          {isActive
                            ? "● 진행 중"
                            : "○ 종료"}
                        </span>

                        <span
                          style={{
                            padding:
                              "5px 10px",
                            borderRadius:
                              999,
                            background:
                              "#F5F8FD",
                            color:
                              "#43679B",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          💬 참여{" "}
                          {challenge.participant_count ??
                            0}
                          명
                        </span>
                      </div>

                      {/* 제목 */}
                      <h3
                        style={{
                          margin:
                            "0 0 8px",
                          color:
                            "#1F2937",
                          fontSize: 18,
                          fontWeight: 800,
                        }}
                      >
                        {
                          challenge.title
                        }
                      </h3>

                      {/* 설명 */}
                      <p
                        className="sub"
                        style={{
                          whiteSpace:
                            "pre-line",
                          margin:
                            "0 0 14px",
                          lineHeight: 1.6,
                          fontSize: 13,
                        }}
                      >
                        {
                          challenge.description
                        }
                      </p>

                      {/* 참여 질문 */}
                      {challenge.prompt && (
                        <div
                          style={{
                            padding:
                              "10px 12px",
                            marginBottom: 14,
                            borderRadius: 10,
                            background:
                              "#F7FAFE",
                            color:
                              "#43679B",
                            fontSize: 12,
                          }}
                        >
                          💬{" "}
                          {
                            challenge.prompt
                          }
                        </div>
                      )}

                      {/* 기간 */}
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 6,
                          color:
                            "#667085",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          📅
                        </span>

                        <span>
                          {formatDate(
                            challenge.start_date
                          )}{" "}
                          ~{" "}
                          {formatDate(
                            challenge.end_date
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 관리 버튼 */}
                  <div
                    style={{
                      display:
                        "flex",
                      gap: 8,
                      flexWrap:
                        "wrap",
                      marginTop: 18,
                      paddingTop: 16,
                      borderTop:
                        "1px solid #EDF1F7",
                    }}
                  >
                    <button
                      type="button"
                      className="soft"
                      onClick={() =>
                        openEditForm(
                          challenge
                        )
                      }
                      disabled={
                        !isAdmin ||
                        isProcessing
                      }
                    >
                      <Pencil
                        size={16}
                      />
                      수정
                    </button>

                    {isActive ? (
                      <button
                        type="button"
                        className="soft"
                        onClick={() =>
                          handleCloseChallenge(
                            challenge
                          )
                        }
                        disabled={
                          !isAdmin ||
                          isProcessing
                        }
                      >
                        <CheckCircle2
                          size={16}
                        />
                        종료
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="soft"
                        onClick={() =>
                          handleReopenChallenge(
                            challenge
                          )
                        }
                        disabled={
                          !isAdmin ||
                          isProcessing
                        }
                      >
                        <CirclePlay
                          size={16}
                        />
                        다시 진행
                      </button>
                    )}

                    <button
                      type="button"
                      className="soft"
                      onClick={() =>
                        handleDeleteChallenge(
                          challenge
                        )
                      }
                      disabled={
                        !isAdmin ||
                        isProcessing
                      }
                      style={{
                        color:
                          "#B42318",
                      }}
                    >
                      <Trash2
                        size={16}
                      />
                      삭제
                    </button>
                  </div>
                </article>
              );
            }
          )
        )}
      </div>
    </div>
  );
}