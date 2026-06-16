import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bell, MessageCircle, Heart, BookOpen, Send, Lock, CheckCircle2, Inbox, RefreshCw } from "lucide-react";
import "./style.css";

const API = "http://localhost:4000/api";
const categories = ["운영 건의", "교육 문의", "서비스 개선", "업무 고민", "칭찬", "기타"];

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
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ category: "운영 건의", content: "", wantsReply: true });

  async function loadData() {
    setLoading(true);
    try {
      const [voiceRes, noticeRes] = await Promise.all([
        fetch(`${API}/voices`),
        fetch(`${API}/notices`)
      ]);
      const voiceData = await voiceRes.json();
      const noticeData = await noticeRes.json();
      setVoices(voiceData);
      setNotices(noticeData);
      if (selected) {
        const updated = voiceData.find(v => v.id === selected.id);
        setSelected(updated || null);
      }
    } catch (e) {
      alert("서버 연결이 필요합니다. 터미널에서 npm run dev가 실행 중인지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => ({
    total: voices.length,
    waiting: voices.filter(v => v.status === "접수").length,
    checking: voices.filter(v => v.status === "검토중").length,
    done: voices.filter(v => v.status === "답변완료").length
  }), [voices]);

  async function submitVoice(e) {
    e.preventDefault();
    if (!form.content.trim()) return alert("내용을 입력해주세요.");

    const res = await fetch(`${API}/voices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!res.ok) return alert("접수 중 오류가 발생했습니다.");
    setForm({ category: "운영 건의", content: "", wantsReply: true });
    await loadData();
    setTab("done");
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;

    const res = await fetch(`${API}/voices/${selected.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reply, from: "admin" })
    });

    if (!res.ok) return alert("답변 저장 중 오류가 발생했습니다.");
    setReply("");
    await loadData();
  }

  async function changeStatus(id, status) {
    await fetch(`${API}/voices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await loadData();
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">BV</div>
          <div>
            <h1>BC Voice</h1>
            <p>전국 BC 소통 플랫폼</p>
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
              <span>Voice Lounge</span>
              <h2>현장의 목소리를 안전하게 전달하고, 운영진과 연결되는 공간</h2>
              <p>작성 내용은 운영진만 확인할 수 있으며, 필요 시 익명 상태로 1:1 답변을 받을 수 있습니다.</p>
              <button onClick={() => setTab("voice")}>익명 의견 남기기</button>
            </section>

            <section className="grid">
              {notices.map((n, i) => (
                <div className="card" key={n.id}>
                  <h3>{i === 0 ? "📢" : "💡"} {n.title}</h3>
                  <p>{n.body}</p>
                </div>
              ))}
              <div className="card"><h3>❤️ 칭찬 릴레이</h3><p>서로의 좋은 사례를 따뜻하게 공유해요.</p></div>
            </section>
          </>
        )}

        {tab === "voice" && (
          <section className="panel">
            <h2>익명 Voice 남기기</h2>
            <p className="sub">건의사항, 고민, 질문, 칭찬까지 편하게 남겨주세요. 내용은 운영진만 확인합니다.</p>
            <form onSubmit={submitVoice} className="form">
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
            <p>이제 운영진 페이지에서 실제로 접수 내용을 확인할 수 있습니다.</p>
            <button onClick={() => setTab("admin")}>운영진 페이지 확인</button>
          </section>
        )}

        {tab === "thanks" && (
          <section className="panel">
            <h2>Thanks Lounge</h2>
            <p className="sub">동료에게 전하고 싶은 고마운 마음을 남기는 공간입니다.</p>
            <div className="empty">다음 버전에서 칭찬 카드 작성/공유 기능을 연결할 수 있어요.</div>
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
                <p className="sub">익명 Voice 접수 내용과 답변 상태를 관리합니다.</p>
              </div>
              <button className="soft" onClick={loadData}><RefreshCw size={16}/> 새로고침</button>
            </div>

            <div className="stats">
              <div><b>{stats.total}</b><span>전체 접수</span></div>
              <div><b>{stats.waiting}</b><span>접수</span></div>
              <div><b>{stats.checking}</b><span>검토중</span></div>
              <div><b>{stats.done}</b><span>답변완료</span></div>
            </div>

            <div className="adminLayout">
              <div className="inbox">
                <h3><Inbox size={18}/> 접수함</h3>
                {voices.map(v => (
                  <button className={`ticket ${selected?.id === v.id ? "picked" : ""}`} key={v.id} onClick={() => setSelected(v)}>
                    <div className="ticketTop">
                      <b>{v.anonId}</b>
                      <span>{v.category}</span>
                      <em>{v.status}</em>
                    </div>
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
                        <p>{selected.category} · {dateLabel(selected.createdAt)}</p>
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
