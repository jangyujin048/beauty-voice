import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Sparkles, Trophy } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import ChallengeCard from "./ChallengeCard";
import ChallengeDetail from "./ChallengeDetail";
import { getWeeklyChallenges } from "../../services/challengeService";
import { getMyMissionMembership } from "../../services/memberService";

export default function WeeklyChallenge() {
  const { user, canReplyOfficial, isAuthLoading } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [membership, setMembership] = useState(null);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const loadChallenges = useCallback(async () => {
    const request = ++requestId.current;
    setError(""); setIsLoading(true);
    if (!user?.id) {
      setChallenges([]); setMembership(null); setSelectedChallenge(null); setIsLoading(false); return;
    }
    try {
      const [data, currentMembership] = await Promise.all([getWeeklyChallenges(), getMyMissionMembership()]);
      if (request !== requestId.current) return;
      setChallenges(data); setMembership(currentMembership);
      setSelectedChallenge(previous => previous ? data.find(item => item.id === previous.id) ?? null : null);
    } catch {
      if (request !== requestId.current) return;
      setChallenges([]); setMembership(null); setSelectedChallenge(null);
      setError("미션을 불러오지 못했습니다. 연결 상태를 확인하고 새로고침해주세요.");
    } finally { if (request === requestId.current) setIsLoading(false); }
  }, [user?.id]);
  useEffect(() => {
    if (!isAuthLoading) loadChallenges();
    return () => { requestId.current += 1; };
  }, [loadChallenges, isAuthLoading]);
  useEffect(() => {
    const refreshOnFocus = () => { if (user?.id) loadChallenges(); };
    window.addEventListener("focus", refreshOnFocus);
    return () => window.removeEventListener("focus", refreshOnFocus);
  }, [loadChallenges, user?.id]);
  const activeChallenges = useMemo(() => challenges.filter(item => item.status === "active"), [challenges]);
  const previousChallenges = useMemo(() => challenges.filter(item => item.status !== "active"), [challenges]);
  const handleUpdated = updated => {
    setChallenges(previous => previous.map(item => item.id === updated.id ? { ...item, ...updated } : item));
    setSelectedChallenge(previous => previous?.id === updated.id ? { ...previous, ...updated } : previous);
  };
  const accessMessage = !user?.id
    ? "로그인하면 소속 매장의 뷰티 미션을 확인할 수 있습니다."
    : !canReplyOfficial && !membership
      ? "아직 구성원으로 등록되지 않았습니다. 운영진에게 로그인 이메일과 소속 매장을 알려주세요."
      : !canReplyOfficial && !membership?.is_active
        ? "뷰티 미션 이용이 중지된 계정입니다. 운영진에게 문의해주세요."
        : "";
  if (selectedChallenge && !accessMessage && !error) return <ChallengeDetail
    key={`${user?.id}:${selectedChallenge.id}`} challenge={selectedChallenge}
    onBack={async () => { setSelectedChallenge(null); await loadChallenges(); }} onChallengeUpdated={handleUpdated}
  />;
  return <section className="panel">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 26 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><Trophy size={24} /><h2 style={{ margin: 0 }}>진행 중인 미션</h2></div>
        <p className="sub">함께 나누고 싶은 이야기에 함께 참여해보세요 💜</p>
        {membership?.is_active && !canReplyOfficial && <p className="sub">{membership.store_name} · 우리 매장과 전체 매장 미션</p>}
        {canReplyOfficial && <p className="sub">운영진은 전체 매장의 미션을 확인할 수 있습니다.</p>}
      </div>
      <button type="button" className="soft" onClick={loadChallenges} disabled={isLoading || isAuthLoading}><RefreshCw size={16} /> 새로고침</button>
    </div>
    {isLoading || isAuthLoading ? <div className="card">미션을 불러오는 중...</div>
      : error ? <div className="empty" role="alert">{error}</div>
      : accessMessage ? <div className="empty">{accessMessage}</div>
      : <>
        {activeChallenges.length ? <div style={{ marginBottom: 34 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><Sparkles size={17} /><strong>진행 중인 미션 {activeChallenges.length}개</strong></div>
          <div style={{ display: "grid", gap: 12 }}>{activeChallenges.map(challenge => <ChallengeCard key={challenge.id} challenge={challenge} onClick={setSelectedChallenge} />)}</div>
        </div> : <div className="empty" style={{ marginBottom: 34 }}>현재 공개된 진행 중인 미션이 없습니다.</div>}
        <h3 style={{ marginBottom: 14 }}>지난 미션</h3>
        {previousChallenges.length === 0 ? <div className="empty">지난 미션이 없습니다.</div>
          : <div style={{ display: "grid", gap: 12 }}>{previousChallenges.map(challenge => <ChallengeCard key={challenge.id} challenge={challenge} compact onClick={setSelectedChallenge} />)}</div>}
      </>}
  </section>;
}
