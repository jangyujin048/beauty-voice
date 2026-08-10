import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";

import ChallengeCard from "./ChallengeCard";
import ChallengeDetail from "./ChallengeDetail";

import {
  getWeeklyChallenges,
} from "../../services/challengeService";

export default function WeeklyChallenge() {
  const [challenges, setChallenges] =
    useState([]);

  const [selectedChallenge, setSelectedChallenge] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

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

        setSelectedChallenge(
          previous => {
            if (!previous) {
              return null;
            }

            return (
              data?.find(
                challenge =>
                  challenge.id ===
                  previous.id
              ) ?? null
            );
          }
        );
      } catch (error) {
        console.error(
          "진행 중인 미션 조회 오류:",
          error
        );

        alert(
          "진행 중인 미션을 불러오지 못했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const activeChallenge =
    useMemo(
      () =>
        challenges.find(
          challenge =>
            challenge.status ===
            "active"
        ) ?? null,
      [challenges]
    );

  const previousChallenges =
    useMemo(
      () =>
        challenges.filter(
          challenge =>
            challenge.status !==
            "active"
        ),
      [challenges]
    );

  const handleOpenChallenge =
    challenge => {
      setSelectedChallenge(
        challenge
      );
    };

  const handleCloseDetail =
    async () => {
      setSelectedChallenge(null);

      await loadChallenges();
    };

  const handleChallengeUpdated =
    updatedChallenge => {
      if (!updatedChallenge?.id) {
        return;
      }

      setChallenges(previous =>
        previous.map(
          challenge =>
            challenge.id ===
            updatedChallenge.id
              ? {
                  ...challenge,
                  ...updatedChallenge,
                }
              : challenge
        )
      );

      setSelectedChallenge(
        previous =>
          previous?.id ===
          updatedChallenge.id
            ? {
                ...previous,
                ...updatedChallenge,
              }
            : previous
      );
    };

  if (selectedChallenge) {
    return (
      <ChallengeDetail
        challenge={
          selectedChallenge
        }
        onBack={
          handleCloseDetail
        }
        onChallengeUpdated={
          handleChallengeUpdated
        }
      />
    );
  }

  return (
    <section className="panel">
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",
          gap: 16,
          marginBottom: 26,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Trophy size={24} />

            <h2
              style={{
                margin: 0,
              }}
            >
              진행 중인 미션
            </h2>
          </div>

          <p className="sub">
            함께 나누고 싶은 이야기에 함께 참여해보세요 💜
          </p>
        </div>

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
      </div>

      {isLoading ? (
        <div className="card">
          미션을 불러오는 중...
        </div>
      ) : (
        <>
          {activeChallenge ? (
            <div
              style={{
                marginBottom: 34,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 7,
                  marginBottom: 12,
                }}
              >
                <Sparkles
                  size={17}
                />

                <strong>
                  진행 중인 미션
                </strong>
              </div>

              <ChallengeCard
                challenge={
                  activeChallenge
                }
                onClick={
                  handleOpenChallenge
                }
              />
            </div>
          ) : (
            <div
              className="empty"
              style={{
                marginBottom: 34,
              }}
            >
              현재 진행 중인
              미션이 없습니다.
            </div>
          )}

          <div>
            <h3
              style={{
                marginBottom: 14,
              }}
            >
              지난 미션
            </h3>

            {previousChallenges.length ===
            0 ? (
              <div className="empty">
                지난 미션이
                없습니다.
              </div>
            ) : (
              <div
                style={{
                  display:
                    "grid",
                  gap: 12,
                }}
              >
                {previousChallenges.map(
                  challenge => (
                    <ChallengeCard
                      key={
                        challenge.id
                      }
                      challenge={
                        challenge
                      }
                      compact
                      onClick={
                        handleOpenChallenge
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}