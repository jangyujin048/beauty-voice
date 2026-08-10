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

  return date.toLocaleDateString(
    "ko-KR"
  );
}

export default function AdminChallengeManager() {
  const [challenges, setChallenges] =
    useState([]);

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

  const openEditForm =
    challenge => {
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
    event => {
      const {
        name,
        value,
      } = event.target;

      setForm(previous => ({
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
    async event => {
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
    async challenge => {
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
    async challenge => {
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
    async challenge => {
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
        운영진 계정 권한을
        확인하는 중...
      </div>
    );
  }

  return (
    <div>
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
          <h3
            style={{
              marginBottom: 6,
            }}
          >
            주간 챌린지 관리
          </h3>

          <p className="sub">
            챌린지를 등록하고 진행
            상태 및 기간을 관리합니다.
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
  새 미션
</button>
        </div>
      </div>

      {!isAdmin && (
        <div
          className="card"
          style={{
            marginBottom: 20,
          }}
        >
          <strong>
            운영진 계정 확인 필요
          </strong>

          <p
            className="sub"
            style={{
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            현재 로그인한 Google
            계정은 admin_users에
            등록되어 있지 않습니다.
            기존 운영진 비밀번호로
            페이지에 들어왔더라도
            챌린지 등록·수정은 할 수
            없습니다.
          </p>
        </div>
      )}

      {isFormOpen && (
        <form
          className="card form"
          onSubmit={
            handleSubmit
          }
          style={{
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <h3>
              {editingChallengeId
                ? "챌린지 수정"
                : "새 챌린지 등록"}
            </h3>

            <button
              type="button"
              className="soft"
              onClick={
                resetForm
              }
              disabled={
                isSubmitting
              }
            >
              <X size={16} />
              닫기
            </button>
          </div>

          <label htmlFor="challenge-title">
            제목
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
          />

          <label htmlFor="challenge-description">
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
            rows={4}
            placeholder="챌린지 카드에 표시할 설명을 입력해주세요."
            disabled={
              isSubmitting
            }
          />

          <label htmlFor="challenge-prompt">
            참여 질문 / 안내
          </label>

          <textarea
            id="challenge-prompt"
            name="prompt"
            value={form.prompt}
            onChange={
              handleFormChange
            }
            rows={4}
            placeholder="예: 이번 주 나에게 힘이 되어준 동료는 누구였나요?"
            disabled={
              isSubmitting
            }
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <div>
              <label htmlFor="challenge-start-date">
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
              />
            </div>

            <div>
              <label htmlFor="challenge-end-date">
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
              />
            </div>
          </div>

          <label htmlFor="challenge-status">
            상태
          </label>

          <select
            id="challenge-status"
            name="status"
            value={form.status}
            onChange={
              handleFormChange
            }
            disabled={
              isSubmitting
            }
          >
            <option value="active">
              진행 중
            </option>

            <option value="closed">
              종료
            </option>
          </select>

          <button
  type="submit"
  className="btn-primary"
  disabled={
    isSubmitting ||
    !isAdmin
  }
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
        </form>
      )}

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {isLoading ? (
          <div className="card">
            챌린지를 불러오는
            중...
          </div>
        ) : challenges.length ===
          0 ? (
          <div className="empty">
            등록된 챌린지가
            없습니다.
          </div>
        ) : (
          challenges.map(
            challenge => {
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
                  className="card"
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "flex-start",
                      gap: 16,
                      marginBottom:
                        12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 8,
                          flexWrap:
                            "wrap",
                          marginBottom:
                            8,
                        }}
                      >
                        <span
                          style={{
                            padding:
                              "5px 9px",
                            borderRadius:
                              999,
                            background:
                              isActive
                                ? "#eaf7ef"
                                : "#f1f1f1",
                            color:
                              isActive
                                ? "#247044"
                                : "#666",
                            fontSize:
                              12,
                            fontWeight:
                              800,
                          }}
                        >
                          {isActive
                            ? "진행 중"
                            : "종료"}
                        </span>

                        <span
                          className="sub"
                          style={{
                            fontSize:
                              12,
                          }}
                        >
                          참여{" "}
                          {challenge.participant_count ??
                            0}
                          명
                        </span>
                      </div>

                      <h3
                        style={{
                          marginBottom:
                            8,
                        }}
                      >
                        {
                          challenge.title
                        }
                      </h3>

                      <p
                        className="sub"
                        style={{
                          whiteSpace:
                            "pre-line",
                          marginBottom:
                            8,
                        }}
                      >
                        {
                          challenge.description
                        }
                      </p>

                      <span
                        style={{
                          fontSize:
                            13,
                        }}
                      >
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

                  <div
                    style={{
                      display:
                        "flex",
                      gap: 8,
                      flexWrap:
                        "wrap",
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