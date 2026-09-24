import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { createMember, getMembers, getStores, updateMember } from "../../services/memberService";
import "./member-management.css";

export default function MemberManager() {
  const { user, canReplyOfficial } = useAuth();
  const [members, setMembers] = useState([]);
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [storeId, setStoreId] = useState("");
  const [editing, setEditing] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const requestId = useRef(0);
  const actionInFlight = useRef(false);

  const load = useCallback(async () => {
    const request = ++requestId.current;
    if (!canReplyOfficial) { setMembers([]); setStores([]); setIsLoading(false); return; }
    setIsLoading(true); setError("");
    try {
      const [nextMembers, nextStores] = await Promise.all([getMembers(), getStores({ includeOperations: true })]);
      if (request !== requestId.current) return;
      setMembers(nextMembers); setStores(nextStores);
    } catch {
      if (request !== requestId.current) return;
      setMembers([]);
      setError("구성원 목록을 불러오지 못했습니다. 운영진 권한과 연결 상태를 확인하고 다시 시도해주세요.");
    } finally { if (request === requestId.current) setIsLoading(false); }
  }, [canReplyOfficial, user?.id]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  const filtered = useMemo(() => members.filter(member =>
    member.email.toLowerCase().includes(keyword.trim().toLowerCase()) &&
    (!storeFilter || member.store_id === storeFilter) &&
    (statusFilter === "all" || member.is_active === (statusFilter === "active"))
  ), [members, keyword, storeFilter, statusFilter]);

  const resetForm = () => { setEditing(null); setEmail(""); setStoreId(""); };
  const save = async event => {
    event.preventDefault();
    if (actionInFlight.current || !canReplyOfficial) return;
    actionInFlight.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const saved = editing
        ? await updateMember(editing, { storeId, isActive: editing.is_active })
        : await createMember({ email, storeId });
      setMembers(previous => editing
        ? previous.map(member => member.id === saved.id ? saved : member)
        : [saved, ...previous]);
      setMessage(editing ? "소속이 변경되었습니다." : "구성원이 등록되었습니다. 해당 Google 계정으로 로그인하면 사이트를 이용할 수 있습니다.");
      resetForm();
    } catch (cause) { setError(cause?.message || "저장하지 못했습니다. 다시 시도해주세요."); }
    finally { actionInFlight.current = false; setBusy(false); }
  };

  const toggleActive = async member => {
    if (actionInFlight.current || !canReplyOfficial) return;
    actionInFlight.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const saved = await updateMember(member, { storeId: member.store_id, isActive: !member.is_active });
      setMembers(previous => previous.map(item => item.id === saved.id ? saved : item));
      if (editing?.id === saved.id) resetForm();
      setMessage(saved.is_active ? "사이트 이용이 재개되었습니다." : "사이트 이용이 중지되었습니다. 기존 참여 기록은 보존됩니다.");
    } catch (cause) { setError(cause?.message || "이용 상태를 변경하지 못했습니다."); }
    finally { actionInFlight.current = false; setBusy(false); }
  };

  if (!canReplyOfficial) return <div className="empty">등록된 운영진 계정으로 로그인하면 구성원을 관리할 수 있습니다.</div>;

  return <section className="member-management" aria-label="구성원 관리">
    <div className="member-heading">
      <div><h3><Users size={20} /> 구성원 관리</h3><p className="sub">Google 로그인 이메일과 소속을 등록해 사이트 이용을 관리합니다.</p></div>
      <button type="button" className="soft" onClick={load} disabled={isLoading || busy}><RefreshCw size={16} /> 새로고침</button>
    </div>
    <p className="sub">운영진도 활성 구성원으로 등록되어야 사이트를 이용할 수 있습니다. 이용 중지 시 사이트 접근이 제한되며 기존 기록은 남습니다. ‘운영진’ 소속은 기존 운영진 계정에만 지정할 수 있고, 새 운영진 권한을 부여하지 않습니다.</p>
    {error && <p role="alert" className="member-error">{error}</p>}
    {message && <p role="status" className="member-success">{message}</p>}
    <form className="card member-form" onSubmit={save}>
      <label>Google 로그인 이메일<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="example@gmail.com" required maxLength={320} disabled={busy || Boolean(editing)} autoComplete="off" /></label>
      <label>소속<select value={storeId} onChange={event => setStoreId(event.target.value)} required disabled={busy || isLoading}>
        <option value="">소속을 선택해주세요</option>
        {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
      </select></label>
      <div className="member-actions">
        <button type="submit" className="soft" disabled={busy || isLoading || !storeId || !email.trim()}>{busy ? "저장 중..." : editing ? "소속 변경 저장" : "구성원 등록"}</button>
        {editing && <button type="button" className="soft" onClick={resetForm} disabled={busy}>취소</button>}
      </div>
    </form>
    <div className="member-filters">
      <label>이메일 검색<input type="search" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="이메일로 검색" /></label>
      <label>소속 필터<select value={storeFilter} onChange={event => setStoreFilter(event.target.value)}><option value="">전체 소속</option>{stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}</select></label>
      <label>이용 상태<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="active">이용 중</option><option value="paused">이용 중지</option><option value="all">전체</option></select></label>
    </div>
    <p className="sub">검색 결과 {filtered.length}명 · 전체 {members.length}명</p>
    {isLoading ? <div className="empty">구성원을 불러오는 중...</div> : filtered.length === 0 ? <div className="empty">조건에 맞는 구성원이 없습니다.</div> : <div className="member-list">
      {filtered.map(member => <article className="card member-row" key={member.id}>
        <div><strong className="member-email">{member.email}</strong><span>{stores.find(store => store.id === member.store_id)?.name || "소속 확인 필요"}</span><span className={`member-status${member.is_active ? "" : " paused"}`}>{member.is_active ? "이용 중" : "이용 중지"}</span></div>
        <div className="member-actions">
          <button type="button" className="soft" disabled={busy} onClick={() => { setEditing(member); setEmail(member.email); setStoreId(member.store_id); setMessage(""); setError(""); }}>소속 변경</button>
          <button type="button" className="soft" disabled={busy || member.email.toLowerCase() === user?.email?.toLowerCase()} title={member.email.toLowerCase() === user?.email?.toLowerCase() ? "본인 계정은 이용 중지할 수 없습니다." : undefined} onClick={() => toggleActive(member)}>{member.is_active ? "이용 중지" : "이용 재개"}</button>
        </div>
      </article>)}
    </div>}
  </section>;
}
