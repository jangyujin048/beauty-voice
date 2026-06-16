import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, MessageCircle, Heart, BookOpen, Send, Lock, CheckCircle2, Inbox, RefreshCw } from "lucide-react";
import "./style.css";

const stores = ["전체", "올리브영N 성수", "뷰티맨션 성수", "센트럴강남타운"];
const writeStores = ["올리브영N 성수", "뷰티맨션 성수", "센트럴강남타운"];
const categories = ["운영 건의", "교육 문의", "서비스 개선", "업무 고민", "칭찬", "기타"];
const STORAGE_KEY = "beauty_voice_data_v1";

const defaultData = {
  voices: [],
  notices: [
    { id: "notice-1", title: "신규 서비스 교육 신청 오픈", body: "6월 신규 서비스 교육 신청이 오픈되었습니다.", createdAt: new Date().toISOString() },
    { id: "notice-2", title: "이번 주 서비스 TIP", body: "결과 설명 전 고객 니즈를 먼저 확인해 주세요.", createdAt: new Date().toISOString() }
  ]
};

function loadStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultData;
    const parsed = JSON.parse(saved);
    return { ...defaultData, ...parsed };
  } catch {
    return defaultData;
  }
}

function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function makeId() {
  return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function makeAnonId() {
  return "BV-" + Math.floor(100 + Math.random() * 900);
}

function dateLabel(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [voices, setVoices] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [storeFilter, setStoreFilter] = useState("전체");
  const [form, setForm] = useState({
    store: "올리브영N 성수",
    category: "운영 건의",
    content: "",
    wantsReply: true
  });

  function loadData() {
    const data = loadStore();
    const normalized = (data.voices || []).map(v => ({ ...v, store: v.store || "올리브영N 성수" }));
    setVoices(normalized);
    setNotices(data.notices || defaultData.notices);
    if (selected) setSelected(normalized.find(v => v.id === selected.id) || null);
  }

  useEffect(() => { loadData(); }, []);

  const filteredVoices = useMemo(() => {
    if (storeFilter === "전체") return voices;
    return voices.filter(v => v.store === storeFilter);
  }, [voices, storeFilter]);

  const stats = useMemo(() => ({
    total: filteredVoices.length,
    waiting: filteredVoices.filter(v => v.status === "접수").length,
    checking: filteredVoices.filter(v => v.status === "검토중").length,
    done: filteredVoices.filter(v => v.status === "답변완료").length
  }), [filteredVoices]);

  const storeStats = useMemo(() => writeStores.map(store => ({
    store,
    count: voices.filter(v => v.store === store).length
  })), [voices]);

  function submitVoice(e) {
    e.preventDefault();
    if (!form.content.trim()) return alert("내용을 입력해주세요.");

    const now = new Date().toISOString();
    const voice = {
      id: makeId(),
      anonId: makeAnonId(),
      store: form.store,
      category: form.category,
      content: form.content.trim(),
      wantsReply: form.wantsReply,
      status: "접수",
      createdAt: now,
      messages: [{ from: "user", text: form.content.trim(), createdAt: now }]
    };

    const data = loadStore();
    const updated = { ...data, voices: [voice, ...(data.voices || [])] };
    saveStore(updated);

    setForm({ store: "올리브영N 성수", category: "운영 건의", content: "", wantsReply: true });
    loadData();
    setTab("done");
  }

  function sendReply(e) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;

    const data = loadStore();
    const updatedVoices = (data.voices || []).map(v => {
      if (v.id !== selected.id) return v;
      return {
        ...v,
        status: "답변완료",
        messages: [
          ...(v.messages || []),
          { from: "admin", text: reply.trim(), createdAt: new Date().toISOString() }
        ]
      };
    });

    saveStore({ ...data, voices: updatedVoices });
    setReply("");
    loadData();
  }

  function changeStatus(id, status) {
    const data = loadStore();
    const updatedVoices = (data.voices || []).map(v => v.id === id ? { ...v, status } : v);
    saveStore({ ...data, voices: updatedVoices });
    loadData();
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">BV</div>
          <div>
            <h1>Beauty Voice</h1>
            <p>메이크업 BC 전용 소통 공간</p>
          </div>
        </div>

        <button onClick={() => setTab("home")} className={tab === "home" ? "active" : ""}><Bell size={18}/> 홈</button>
        <button onClick={() => setTab("voice")} className={tab === "voice" ? "active" : ""}><MessageCircle size={18}/> 익명 Voice</button>
        <button onClick={() => setTab("thanks")} className={tab === "thanks" ? "active" : ""}><Heart size={18}/> Thanks</button>
        <button onClick={() => setTab("guide")} className={tab === "guide" ? "active" : ""}><BookOpen size={18}/> 운영 가이드</button>
        <button onClick={() => setTab("admin")} className={tab === "admin" ? "active" : ""}><Lock size={18}/> 운영진</button>
      </aside>

      <main className="main">
        {tab === "home" && (
          <>
            <section className="hero">
              <span>Beauty Voice</span>
              <h2>3개 매장 메이크업 BC의 목소리를 안전하게 전달하는 공간</h2>
              <p>올리브영N 성수, 뷰티맨션 성수, 센트럴강남타운 메이크업 BC 전용 익명 소통 채널입니다.</p>
              <button onClick={() => setTab("voice")}>익명 의견 남기기</button>
            </section>

            <section className="grid">
              {notices.map((n, i) => (
                <div className="card" key={n.id}>
                  <h3>{i === 0 ? "📢" : "💡"} {n.title}</h3>
                  <p>{n.body}</p>
                </div>
              ))}
              <div className="card"><h3>❤️ 칭찬 릴레이</h3><p>같은 매장에서 함께 일하는 동료의 좋은 사례를 따뜻하게 남겨주세요.</p></div>
            </section>

            <section className="storeGrid">
              {storeStats.map(item => (
                <div className="storeCard" key={item.store}>
                  <b>{item.count}</b>
                  <span>{item.store}</span>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === "voice" && (
          <section className="panel">
            <h2>익명 Voice 남기기</h2>
            <p className="sub">건의사항, 고민, 질문, 칭찬까지 편하게 남겨주세요. 내용은 운영진만 확인합니다.</p>
            <form onSubmit={submitVoice} className="form">
              <label>소속 매장</label>
              <select value={form.store} onChange={e => setForm({...form, store: e.target.value})}>
                {writeStores.map(s => <option key={s}>{s}</option>)}
              </select>

              <label>카테고리</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>

              <label>내용</label>
              <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="작성자는 노출되지 않습니다." />

              <label className="check">
                <input type="checkbox" checked={form.wantsReply} onChange={e => setForm({...form, wantsReply: e.target.checked})} />
                운영진의 1:1 답변을 희망합니다.
              </label>

              <button type="submit"><Send size={18}/> 제출하기</button>
            </form>
          </section>
        )}

        {tab === "done" && (
          <section className="panel center">
            <CheckCircle2 size={56}/>
            <h2>의견이 안전하게 접수되었습니다.</h2>
            <p>현재 테스트 버전은 같은 브라우저에 저장됩니다.</p>
            <button onClick={() => setTab("admin")}>운영진 페이지 확인</button>
          </section>
        )}

        {tab === "thanks" && (
          <section className="panel">
            <h2>Thanks Lounge</h2>
            <p className="sub">동료에게 전하고 싶은 고마운 마음을 남기는 공간입니다.</p>
            <div className="empty">다음 버전에서 매장별 칭찬 카드 작성/공유 기능을 연결할 수 있어요.</div>
          </section>
        )}

        {tab === "guide" && (
          <section className="panel">
            <h2>운영 가이드</h2>
            <div className="list">
              <div><b>중례 관리</b><span>서비스 기준 및 운영 원칙</span></div>
              <div><b>FAQ</b><span>반복 문의 정리</span></div>
              <div><b>교육 자료</b><span>신규 서비스 및 BC 교육 자료</span></div>
            </div>
          </section>
        )}

        {tab === "admin" && (
          <section className="panel">
            <div className="row">
              <div>
                <h2>운영진 대시보드</h2>
                <p className="sub">매장별 익명 Voice 접수 내용과 답변 상태를 관리합니다.</p>
              </div>
              <button className="soft" onClick={loadData}><RefreshCw size={16}/> 새로고침</button>
            </div>

            <div className="filterTabs">
              {stores.map(store => (
                <button
                  key={store}
                  onClick={() => { setStoreFilter(store); setSelected(null); }}
                  className={storeFilter === store ? "active" : ""}
                >
                  {store}
                </button>
              ))}
            </div>

            <div className="stats">
              <div><b>{stats.total}</b><span>{storeFilter} 접수</span></div>
              <div><b>{stats.waiting}</b><span>접수</span></div>
              <div><b>{stats.checking}</b><span>검토중</span></div>
              <div><b>{stats.done}</b><span>답변완료</span></div>
            </div>

            <div className="adminLayout">
              <div className="inbox">
                <h3><Inbox size={18}/> 접수함</h3>
                {filteredVoices.length === 0 && <div className="empty">해당 매장의 접수 건이 없습니다.</div>}
                {filteredVoices.map(v => (
                  <button className={`ticket ${selected?.id === v.id ? "picked" : ""}`} key={v.id} onClick={() => setSelected(v)}>
                    <div className="ticketTop">
                      <b>{v.anonId}</b>
                      <span>{v.store}</span>
                      <em>{v.status}</em>
                    </div>
                    <div className="ticketMeta">{v.category}</div>
                    <p>{v.content}</p>
                    <small>{dateLabel(v.createdAt)}</small>
                  </button>
                ))}
              </div>

              <div className="detail">
                {!selected ? (
                  <div className="empty">왼쪽 접수함에서 내용을 선택해주세요.</div>
                ) : (
                  <>
                    <div className="detailTop">
                      <div>
                        <h3>{selected.anonId}</h3>
                        <p>{selected.store} · {selected.category} · {dateLabel(selected.createdAt)}</p>
                      </div>
                      <select value={selected.status} onChange={e => changeStatus(selected.id, e.target.value)}>
                        <option>접수</option>
                        <option>검토중</option>
                        <option>답변완료</option>
                      </select>
                    </div>

                    <div className="chat">
                      {selected.messages.map((m, idx) => (
                        <div className={`bubble ${m.from}`} key={idx}>
                          <b>{m.from === "admin" ? "운영진" : selected.anonId}</b>
                          <p>{m.text}</p>
                          <small>{dateLabel(m.createdAt)}</small>
                        </div>
                      ))}
                    </div>

                    <form className="replyForm" onSubmit={sendReply}>
                      <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder="운영진 답변을 입력하세요."/>
                      <button type="submit">답변 저장</button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
