import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { Bell, MessageCircle, Heart, BookOpen, Send, Lock, CheckCircle2, Inbox, RefreshCw } from "lucide-react";
import "./style.css";

const SUPABASE_URL = "https://xhqitwkpkxvgvpukimzf.supabase.co";
const SUPABASE_KEY = "sb_publishable_4_cJaGZY-ayPEtIgSDg7xw_W8OL_agP";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PASSWORD = "bcadmin2026!";

const stores = ["전체", "올리브영N 성수", "뷰티맨션 성수", "센트럴강남타운", "미공개"];
const writeStores = ["올리브영N 성수", "뷰티맨션 성수", "센트럴강남타운", "미공개"];
const categories = ["운영 건의", "교육 및 성장 제안/건의", "서비스 개선", "업무 고민", "불만", "기타"];

function makeAnonId() {
  return "BV-" + Math.floor(100 + Math.random() * 900);
}

function dateLabel(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function renderLinkedText(text) {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a key={index} href={part} target="_blank" rel="noreferrer">
          {part}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function normalizeVoice(row) {
  return {
    id: row.id,
    anonId: row.anon_id,
    title: row.title || "제목 없음",
    store: row.store || "올리브영N 성수",
    category: row.category || "기타",
    content: row.content || "",
    imageUrl: row.image_url || "",
    userPassword: row.user_password || "",
    wantsReply: Boolean(row.wants_reply),
    status: row.status || "접수",
    createdAt: row.created_at,
adminReply: row.admin_reply || "",
repliedAt: row.replied_at || null,
replySeen: Boolean(row.reply_seen)
  };
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [voices, setVoices] = useState([]);
  const [notices, setNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({ title: "", body: "", imageFile: null });
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedHomeNotice, setSelectedHomeNotice] = useState(null);
  const [thanksList, setThanksList] = useState([]);
  const [thanksForm, setThanksForm] = useState({ receiver: "", message: "" });
  const [likedThanksIds, setLikedThanksIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("beauty_voice_liked_thanks") || "[]");
    } catch {
      return [];
    }
  });
  const [faqs, setFaqs] = useState([]);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "" });
  const [faqKeyword, setFaqKeyword] = useState("");
  const [openFaqId, setOpenFaqId] = useState(null);
  const [insights, setInsights] = useState([]);
  const [insightForm, setInsightForm] = useState({ month: "", title: "", content: "", imageFile: null });
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [lookupAnonId, setLookupAnonId] = useState("");
  const [lookupPassword, setLookupPassword] = useState("");
  const [lookupDone, setLookupDone] = useState(false);
  const [submittedAnonId, setSubmittedAnonId] = useState("");
  const [storeFilter, setStoreFilter] = useState("전체");
  const [form, setForm] = useState({
    title: "",
    store: "올리브영N 성수",
    category: "운영 건의",
    content: "",
    wantsReply: true,
    userPassword: "",
    passwordConfirm: "",
    imageFile: null
  });

  async function loadData() {
    const { data, error } = await supabase
      .from("voices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Supabase 연결 오류가 발생했습니다. 키와 테이블 컬럼을 확인해주세요.");
      console.error(error);
      return;
    }

    const normalized = (data || []).map(normalizeVoice);
    setVoices(normalized);

    if (selected) {
      setSelected(normalized.find(v => v.id === selected.id) || null);
    }
  }

  async function loadNotices() {
    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("공지사항을 불러오는 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setNotices(data || []);
  }

  async function loadThanks() {
    const { data, error } = await supabase
      .from("thanks")
      .select("*")
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      alert("Thanks Lounge를 불러오는 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setThanksList(data || []);
  }

  async function loadFaqs() {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("FAQ를 불러오는 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setFaqs(data || []);
  }

  async function loadInsights() {
    const { data, error } = await supabase
      .from("bc_insights")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("BC 인사이트를 불러오는 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setInsights(data || []);
  }

  useEffect(() => {
    loadData();
    loadNotices();
    loadThanks();
    loadFaqs();
    loadInsights();
  }, []);

  const filteredVoices = useMemo(() => {
    if (storeFilter === "전체") return voices;
    return voices.filter(v => v.store === storeFilter);
  }, [voices, storeFilter]);

  const myVoices = useMemo(() => {
    if (!lookupDone || !lookupAnonId.trim() || !lookupPassword.trim()) return [];
    return voices.filter(
      v =>
        v.anonId === lookupAnonId.trim() &&
        v.userPassword === lookupPassword.trim()
    );
  }, [voices, lookupAnonId, lookupPassword, lookupDone]);

  const stats = useMemo(() => ({
    total: filteredVoices.length,
    waiting: filteredVoices.filter(v => v.status === "접수").length,
    checking: filteredVoices.filter(v => v.status === "검토중").length,
    processing: filteredVoices.filter(v => v.status === "처리중").length,
    done: filteredVoices.filter(v => v.status === "답변완료").length
  }), [filteredVoices]);

  const storeStats = useMemo(() => writeStores.map(store => ({
    store,
    count: voices.filter(v => v.store === store).length
  })), [voices]);

  const answeredCount = useMemo(() => (
  voices.filter(v => (v.adminReply || v.status === "답변완료") && !v.replySeen).length
), [voices]);

  const filteredFaqs = useMemo(() => {
    const keyword = faqKeyword.trim().toLowerCase();
    if (!keyword) return faqs;

    return faqs.filter(item =>
      (item.question || "").toLowerCase().includes(keyword) ||
      (item.answer || "").toLowerCase().includes(keyword)
    );
  }, [faqs, faqKeyword]);

  const latestNotices = useMemo(() => notices.slice(0, 3), [notices]);
  const latestInsight = useMemo(() => insights[0] || null, [insights]);
  const topThanks = useMemo(() => thanksList.slice(0, 3), [thanksList]);

  async function submitVoice(e) {
    e.preventDefault();

    if (!form.title.trim()) return alert("제목을 입력해주세요.");
    if (!form.content.trim()) return alert("내용을 입력해주세요.");
    if (!form.userPassword.trim()) return alert("답변 확인용 비밀번호를 입력해주세요.");
    if (form.userPassword.trim().length < 4) return alert("비밀번호는 최소 4자리 이상 입력해주세요.");
    if (form.userPassword !== form.passwordConfirm) return alert("비밀번호 확인이 일치하지 않습니다.");

    const newAnonId = makeAnonId();
    let imageUrl = "";

    if (form.imageFile) {
      const fileExt = form.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${newAnonId}.${fileExt}`;
      const filePath = `voices/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("voice-images")
        .upload(filePath, form.imageFile);

      if (uploadError) {
        alert("이미지 업로드 중 오류가 발생했습니다.");
        console.error(uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("voice-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("voices").insert({
      anon_id: newAnonId,
      title: form.title.trim(),
      store: form.store,
      category: form.category,
      content: form.content.trim(),
      image_url: imageUrl,
      user_password: form.userPassword.trim(),
      wants_reply: form.wantsReply,
      status: "접수"
    });

    if (error) {
      alert("접수 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setForm({
      title: "",
      store: "올리브영N 성수",
      category: "운영 건의",
      content: "",
      wantsReply: true,
      userPassword: "",
      passwordConfirm: "",
      imageFile: null
    });

    setSubmittedAnonId(newAnonId);
    await loadData();
    setTab("done");
  }

  async function sendReply(e) {
    e.preventDefault();
    if (!selected || !reply.trim()) return;

    const { error } = await supabase
      .from("voices")
      .update({
  admin_reply: reply.trim(),
  replied_at: new Date().toISOString(),
  status: "답변완료",
  reply_seen: false
})
      .eq("id", selected.id);

    if (error) {
      alert("답변 저장 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setReply("");
    await loadData();
  }

  async function likeThanks(item) {
    if (likedThanksIds.includes(item.id)) {
      alert("이미 공감한 Thanks입니다.");
      return;
    }

    const { error } = await supabase
      .from("thanks")
      .update({ likes: (item.likes || 0) + 1 })
      .eq("id", item.id);

    if (error) {
      alert("좋아요 반영 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    const nextLikedIds = [...likedThanksIds, item.id];
    setLikedThanksIds(nextLikedIds);
    localStorage.setItem("beauty_voice_liked_thanks", JSON.stringify(nextLikedIds));

    await loadThanks();
  }

  async function submitThanks(e) {
    e.preventDefault();

    if (!thanksForm.receiver.trim()) return alert("감사를 전할 대상을 입력해주세요.");
    if (!thanksForm.message.trim()) return alert("감사 내용을 입력해주세요.");

    const { error } = await supabase.from("thanks").insert({
      receiver: thanksForm.receiver.trim(),
      message: thanksForm.message.trim()
    });

    if (error) {
      alert("Thanks 등록 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setThanksForm({ receiver: "", message: "" });
    await loadThanks();
  }

  async function submitInsight(e) {
    e.preventDefault();

    if (!insightForm.month.trim()) return alert("월 정보를 입력해주세요.");
    if (!insightForm.title.trim()) return alert("인사이트 제목을 입력해주세요.");
    if (!insightForm.content.trim()) return alert("인사이트 내용을 입력해주세요.");

    let insightImageUrl = "";

    if (insightForm.imageFile) {
      const fileExt = insightForm.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-insight.${fileExt}`;
      const filePath = `insights/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("voice-images")
        .upload(filePath, insightForm.imageFile);

      if (uploadError) {
        alert("카드뉴스 이미지 업로드 중 오류가 발생했습니다.");
        console.error(uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("voice-images")
        .getPublicUrl(filePath);

      insightImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("bc_insights").insert({
      month: insightForm.month.trim(),
      title: insightForm.title.trim(),
      content: insightForm.content.trim(),
      image_url: insightImageUrl
    });

    if (error) {
      alert("BC 인사이트 등록 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setInsightForm({ month: "", title: "", content: "", imageFile: null });
    await loadInsights();
  }

  async function deleteInsight(id) {
    const ok = window.confirm("이 BC 인사이트를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("bc_insights")
      .delete()
      .eq("id", id);

    if (error) {
      alert("BC 인사이트 삭제 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    if (selectedInsight?.id === id) setSelectedInsight(null);
    await loadInsights();
  }

  async function submitFaq(e) {
    e.preventDefault();

    if (!faqForm.question.trim()) return alert("FAQ 질문을 입력해주세요.");
    if (!faqForm.answer.trim()) return alert("FAQ 답변을 입력해주세요.");

    const { error } = await supabase.from("faqs").insert({
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim()
    });

    if (error) {
      alert("FAQ 등록 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setFaqForm({ question: "", answer: "" });
    await loadFaqs();
  }

  async function deleteFaq(id) {
    const ok = window.confirm("이 FAQ를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("faqs")
      .delete()
      .eq("id", id);

    if (error) {
      alert("FAQ 삭제 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    await loadFaqs();
  }

  async function submitNotice(e) {
    e.preventDefault();

    if (!noticeForm.title.trim()) return alert("공지 제목을 입력해주세요.");
    if (!noticeForm.body.trim()) return alert("공지 내용을 입력해주세요.");

    let noticeImageUrl = "";

    if (noticeForm.imageFile) {
      const fileExt = noticeForm.imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-notice.${fileExt}`;
      const filePath = `notices/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("voice-images")
        .upload(filePath, noticeForm.imageFile);

      if (uploadError) {
        alert("공지 이미지 업로드 중 오류가 발생했습니다.");
        console.error(uploadError);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("voice-images")
        .getPublicUrl(filePath);

      noticeImageUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from("notices").insert({
      title: noticeForm.title.trim(),
      body: noticeForm.body.trim(),
      image_url: noticeImageUrl
    });

    if (error) {
      alert("공지 등록 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setNoticeForm({ title: "", body: "", imageFile: null });
    await loadNotices();
  }

  async function deleteNotice(id) {
    const ok = window.confirm("이 공지를 삭제할까요?");
    if (!ok) return;

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", id);

    if (error) {
      alert("공지 삭제 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    await loadNotices();
  }

  function loginAdmin(e) {
    e.preventDefault();

    if (adminPassword === ADMIN_PASSWORD) {
      setAdminLoggedIn(true);
      setAdminPassword("");
      return;
    }

    alert("비밀번호가 일치하지 않습니다.");
  }

  async function checkMyReplies(e) {
  e.preventDefault();

  if (!lookupAnonId.trim()) {
    alert("접수번호를 입력해주세요.");
    return;
  }

  if (!lookupPassword.trim()) {
    alert("답변 확인용 비밀번호를 입력해주세요.");
    return;
  }

  const matchedVoice = voices.find(
    v =>
      v.anonId === lookupAnonId.trim() &&
      v.userPassword === lookupPassword.trim()
  );

  if (
    matchedVoice &&
    (matchedVoice.adminReply || matchedVoice.status === "답변완료") &&
    !matchedVoice.replySeen
  ) {
    const { error } = await supabase
      .from("voices")
      .update({ reply_seen: true })
      .eq("id", matchedVoice.id);

    if (!error) {
      await loadData();
    }
  }

  setLookupDone(true);
}
  async function changeStatus(id, status) {
    const { error } = await supabase
      .from("voices")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert("상태 변경 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    await loadData();
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
        <button onClick={() => setTab("notice")} className={tab === "notice" ? "active" : ""}><Bell size={18}/> 공지사항</button>
        <button onClick={() => setTab("voice")} className={tab === "voice" ? "active" : ""}><MessageCircle size={18}/> 익명 Voice</button>
        <button onClick={() => { setTab("check"); setLookupDone(false); }} className={tab === "check" ? "active" : ""}>
          <CheckCircle2 size={18}/> 답변 확인 {answeredCount > 0 ? "🔴" : ""}
        </button>
        <button onClick={() => setTab("thanks")} className={tab === "thanks" ? "active" : ""}><Heart size={18}/> Thanks</button>
        <button onClick={() => setTab("faq")} className={tab === "faq" ? "active" : ""}><BookOpen size={18}/> FAQ</button>
        <button onClick={() => setTab("insight")} className={tab === "insight" ? "active" : ""}><BookOpen size={18}/> BC 인사이트</button>
        <button onClick={() => setTab("admin")} className={tab === "admin" ? "active" : ""}><Lock size={18}/> 운영진</button>
      </aside>

      <main className="main">
        {tab === "home" && (
          <>
            <section className="hero">
              <span>Beauty Voice</span>
              <h2>메이크업 BC의 목소리가 모이는 공간</h2>
              <p>올리브영N 성수, 뷰티맨션 성수, 센트럴강남타운 메이크업 BC 전용 익명 소통 채널입니다.</p>
              <button onClick={() => setTab("voice")}>익명 의견 남기기</button>
            </section>

<div style={{ marginTop: "24px" }}>
  <video
    src="/bc-promise.mp4"
    autoPlay
    muted
    loop
    playsInline
    style={{
      width: "100%",
      borderRadius: "24px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
    }}
  />
</div>

            <section className="grid">
              <div className="card">
                <h3>📢 최신 공지</h3>
                {latestNotices.length === 0 && <p>등록된 공지가 없습니다.</p>}
                {latestNotices.map(n => (
                  <button
                    key={n.id}
                    className="soft"
                    onClick={() => {
                      setSelectedNotice(n);
                      setTab("notice");
                    }}
                    style={{ width: "100%", justifyContent: "space-between", marginTop: 10, textAlign: "left" }}
                  >
                    <span>{n.title}</span>
                    <small>{dateLabel(n.created_at)}</small>
                  </button>
                ))}
              </div>

              <div className="card">
                <h3>📊 최신 BC 인사이트</h3>
                {!latestInsight ? (
                  <p>등록된 BC 인사이트가 없습니다.</p>
                ) : (
                  <button
                    className="soft"
                    onClick={() => {
                      setSelectedInsight(latestInsight);
                      setTab("insight");
                    }}
                    style={{ width: "100%", justifyContent: "space-between", marginTop: 10, textAlign: "left" }}
                  >
                    <span>{latestInsight.title}</span>
                    <small>{latestInsight.month}</small>
                  </button>
                )}
              </div>

              <div className="card">
                <h3>❤️ Thanks TOP3</h3>
                {topThanks.length === 0 && <p>아직 등록된 Thanks가 없습니다.</p>}
                {topThanks.map(item => (
                  <div key={item.id} style={{ marginTop: 10 }}>
                    <b>{item.receiver}</b>
                    <p className="sub" style={{ margin: "4px 0" }}>{item.message}</p>
                    <small>❤️ {item.likes || 0}</small>
                  </div>
                ))}
              </div>
            </section>

            <section className="storeGrid">
              <div className="storeCard">
                <b>{voices.length}</b>
                <span>전체 Voice</span>
              </div>
              <div className="storeCard">
                <b>{voices.filter(v => v.status === "답변완료").length}</b>
                <span>답변완료</span>
              </div>
              <div className="storeCard">
                <b>{voices.filter(v => v.status !== "답변완료").length}</b>
                <span>미답변</span>
              </div>
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

        {tab === "notice" && (
          <section className="panel">
            <h2>공지사항</h2>
            <p className="sub">교육 일정, 취합 안내, 주간 동향 등 주요 공지를 확인하는 공간입니다.</p>

            <section className="grid">
              {notices.length === 0 && (
                <div className="empty">등록된 공지가 없습니다.</div>
              )}

              {notices.map((n, i) => (
                <button
                  className="card"
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  style={{ textAlign: "left" }}
                >
                  <h3>{i === 0 ? "📢" : "💡"} {n.title}</h3>
                  <p className="sub">{dateLabel(n.created_at)}</p>
                </button>
              ))}
            </section>

            {selectedNotice && (
              <div className="card" style={{ marginTop: 24 }}>
                <div className="row">
                  <div>
                    <h2>{selectedNotice.title}</h2>
                    <p className="sub">공지일 · {dateLabel(selectedNotice.created_at)}</p>
                  </div>
                  <button className="soft" onClick={() => setSelectedNotice(null)}>닫기</button>
                </div>
                <p style={{ whiteSpace: "pre-line", marginTop: 16 }}>
                  {renderLinkedText(selectedNotice.body)}
                </p>
                {selectedNotice.image_url && (
                  <a href={selectedNotice.image_url} target="_blank" rel="noreferrer">
                    <img
                      src={selectedNotice.image_url}
                      alt="공지 이미지"
                      style={{
                        width: "100%",
                        maxWidth: 520,
                        maxHeight: 360,
                        objectFit: "cover",
                        borderRadius: 18,
                        border: "1px solid #DDE5F3",
                        marginTop: 16
                      }}
                    />
                  </a>
                )}
              </div>
            )}
          </section>
        )}

        {tab === "voice" && (
          <section className="panel">
            <h2>익명 Voice 남기기</h2>
            <p className="sub">건의사항, 고민, 질문, 칭찬까지 편하게 남겨주세요. 작성자는 노출되지 않습니다.</p>
            <form onSubmit={submitVoice} className="form">
              <label>제목</label>
              <input
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                placeholder="예: 신규 서비스 운영 문의"
              />

              <label>소속 매장</label>
              <select value={form.store} onChange={e => setForm({...form, store: e.target.value})}>
                {writeStores.map(s => <option key={s}>{s}</option>)}
              </select>

              <label>카테고리</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>

              <label>내용</label>
              <textarea
                value={form.content}
                onChange={e => setForm({...form, content: e.target.value})}
                placeholder="작성자는 노출되지 않습니다."
              />

              <label>사진 첨부</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setForm({...form, imageFile: e.target.files?.[0] || null})}
              />
              {form.imageFile && (
                <p className="sub">첨부 이미지: {form.imageFile.name}</p>
              )}

              <label>답변 확인용 비밀번호</label>
              <input
                type="password"
                value={form.userPassword}
                onChange={e => setForm({...form, userPassword: e.target.value})}
                placeholder="본인만 아는 비밀번호를 입력하세요"
              />

              <label>비밀번호 확인</label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={e => setForm({...form, passwordConfirm: e.target.value})}
                placeholder="비밀번호를 한 번 더 입력하세요"
              />

              <label className="check">
                <input
                  type="checkbox"
                  checked={form.wantsReply}
                  onChange={e => setForm({...form, wantsReply: e.target.checked})}
                />
                운영진의 답변을 희망합니다.
              </label>

              <button type="submit"><Send size={18}/> 제출하기</button>
            </form>
          </section>
        )}

        {tab === "done" && (
          <section className="panel center">
            <CheckCircle2 size={56}/>
            <h2>의견이 안전하게 접수되었습니다.</h2>
            <p>답변 확인 시 접수번호와 작성 시 입력한 비밀번호가 필요합니다.</p>
            {submittedAnonId && (
              <div className="card" style={{ maxWidth: 360, margin: "20px auto" }}>
                <p>접수번호</p>
                <h2>{submittedAnonId}</h2>
              </div>
            )}
            <button onClick={() => setTab("check")}>답변 확인으로 이동</button>
          </section>
        )}

        {tab === "check" && (
          <section className="panel">
            <h2>답변 확인 {answeredCount > 0 ? "🔴" : ""}</h2>
            <p className="sub">접수번호와 작성 시 입력한 비밀번호가 모두 일치해야 본인 문의와 운영진 답변을 확인할 수 있습니다.</p>
            {answeredCount > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <h3>🔔 답변이 등록된 문의가 있습니다.</h3>
                <p>접수번호와 비밀번호를 입력해 내 문의의 답변 여부를 확인해 주세요.</p>
              </div>
            )}

            <form onSubmit={checkMyReplies} className="form" style={{ maxWidth: 420 }}>
              <label>접수번호</label>
              <input
                value={lookupAnonId}
                onChange={e => {
                  setLookupAnonId(e.target.value);
                  setLookupDone(false);
                }}
                placeholder="예: BV-851"
              />

              <label>답변 확인용 비밀번호</label>
              <input
                type="password"
                value={lookupPassword}
                onChange={e => {
                  setLookupPassword(e.target.value);
                  setLookupDone(false);
                }}
                placeholder="작성 시 입력한 비밀번호를 입력하세요"
              />
              <button type="submit">내 답변 확인하기</button>
            </form>

            {lookupDone && (
              <div className="list" style={{ marginTop: 24 }}>
                {myVoices.length === 0 && (
                  <div className="empty">접수번호 또는 비밀번호가 일치하는 내용이 없습니다.</div>
                )}

                {myVoices.map(v => (
                  <div
                    key={v.id}
                    className="card"
                    style={{
                      display: "block",
                      width: "100%",
                      boxSizing: "border-box",
                      padding: 0,
                      overflow: "hidden"
                    }}
                  >
                    <div style={{ display: "block", padding: 24, borderBottom: "1px solid #DDE5F3" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              borderRadius: 999,
                              background: "#E8EEF9",
                              color: "#0E2D69",
                              fontWeight: 700,
                              marginBottom: 12
                            }}
                          >
                            {v.status}
                          </span>
                          <h3 style={{ margin: "0 0 8px", wordBreak: "keep-all" }}>{v.title}</h3>
                          <p className="sub" style={{ margin: 0 }}>
                            {v.store} · {v.category} · {dateLabel(v.createdAt)}
                          </p>
                        </div>
                        <small style={{ whiteSpace: "nowrap" }}>{v.anonId}</small>
                      </div>
                    </div>

                    <div style={{ display: "block", padding: 24 }}>
                      <div
                        style={{
                          display: "block",
                          width: "100%",
                          boxSizing: "border-box",
                          background: "#F4F7FD",
                          border: "1px solid #DDE5F3",
                          borderRadius: 18,
                          padding: 18,
                          marginBottom: 18
                        }}
                      >
                        <b>문의 내용</b>
                        <p style={{ whiteSpace: "pre-line", margin: "10px 0 0", lineHeight: 1.7 }}>
                          {v.content}
                        </p>
                      </div>

                      {v.imageUrl && (
                        <div style={{ display: "block", marginBottom: 22 }}>
                          <b>첨부 이미지</b>
                          <div style={{ display: "block", marginTop: 10 }}>
                            <a href={v.imageUrl} target="_blank" rel="noreferrer">
                              <img
                                src={v.imageUrl}
                                alt="첨부 이미지"
                                style={{
                                  display: "block",
                                  width: "100%",
                                  maxWidth: 420,
                                  maxHeight: 280,
                                  objectFit: "cover",
                                  borderRadius: 18,
                                  border: "1px solid #DDE5F3"
                                }}
                              />
                            </a>
                          </div>
                          <small>이미지를 클릭하면 원본으로 확인할 수 있습니다.</small>
                        </div>
                      )}

                      {v.adminReply ? (
                        <div
                          style={{
                            display: "block",
                            width: "100%",
                            boxSizing: "border-box",
                            background: "#0E2D69",
                            color: "white",
                            borderRadius: 18,
                            padding: 18,
                            marginTop: 12
                          }}
                        >
                          <b>운영진 답변</b>
                          <p style={{ whiteSpace: "pre-line", margin: "10px 0 8px", lineHeight: 1.7 }}>
                            {v.adminReply}
                          </p>
                          <small style={{ color: "rgba(255,255,255,0.8)" }}>{dateLabel(v.repliedAt)}</small>
                        </div>
                      ) : (
                        <div className="empty">아직 등록된 답변이 없습니다.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "thanks" && (
          <section className="panel">
            <h2>Thanks Lounge</h2>
            <p className="sub">동료에게 전하고 싶은 고마운 마음을 따뜻하게 남겨주세요.</p>

            <form onSubmit={submitThanks} className="form" style={{ maxWidth: 560 }}>
              <label>감사를 전할 대상</label>
              <input
                value={thanksForm.receiver}
                onChange={e => setThanksForm({...thanksForm, receiver: e.target.value})}
                placeholder="예: 올리브님"
              />

              <label>감사 내용</label>
              <textarea
                value={thanksForm.message}
                onChange={e => setThanksForm({...thanksForm, message: e.target.value})}
                placeholder="고마웠던 순간이나 칭찬하고 싶은 내용을 남겨주세요."
              />

              <button type="submit">Thanks 남기기</button>
            </form>

            <section className="grid" style={{ marginTop: 24 }}>
              {thanksList.length === 0 && (
                <div className="empty">아직 등록된 Thanks가 없습니다.</div>
              )}

              {thanksList.map(item => (
                <div className="card" key={item.id}>
                  <h3>❤️ {item.receiver}</h3>
                  <p>{item.message}</p>
                  <small>{dateLabel(item.created_at)}</small>
                  <button
                    className="soft"
                    onClick={() => likeThanks(item)}
                    disabled={likedThanksIds.includes(item.id)}
                    style={{ marginTop: 12 }}
                  >
                    {likedThanksIds.includes(item.id) ? `❤️ 공감완료 ${item.likes || 0}` : `❤️ 공감 ${item.likes || 0}`}
                  </button>
                </div>
              ))}
            </section>
          </section>
        )}

        {tab === "faq" && (
          <section className="panel">
            <h2>FAQ</h2>
            <p className="sub">반복 문의와 운영 기준을 빠르게 확인할 수 있는 공간입니다.</p>

            <div className="form" style={{ maxWidth: 560 }}>
              <label>FAQ 검색</label>
              <input
                value={faqKeyword}
                onChange={e => setFaqKeyword(e.target.value)}
                placeholder="예: 교육 신청, 뷰티맨션, Color Fit"
              />
            </div>

            <div className="list" style={{ marginTop: 24 }}>
              {filteredFaqs.length === 0 && (
                <div className="empty">검색 결과가 없습니다.</div>
              )}

              {filteredFaqs.map(item => {
                const isOpen = openFaqId === item.id;

                return (
                  <div className="card" key={item.id}>
                    <button
                      className="soft"
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      style={{
                        width: "100%",
                        justifyContent: "space-between",
                        textAlign: "left"
                      }}
                    >
                      <span>{isOpen ? "▼" : "▶"} Q. {item.question}</span>
                    </button>

                    {isOpen && (
                      <div style={{ marginTop: 14 }}>
                        <p>A. {item.answer}</p>
                        <small>{dateLabel(item.created_at)}</small>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tab === "insight" && (
          <section className="panel">
            <h2>BC 인사이트</h2>
            <p className="sub">월간 만족도, VOC, 트렌드, 교육 이슈를 한눈에 확인하는 공간입니다.</p>

            {insights.length === 0 && (
              <div className="empty">등록된 BC 인사이트가 없습니다.</div>
            )}

            <section className="grid">
              {insights.map(item => (
                <button
                  className="card"
                  key={item.id}
                  onClick={() => setSelectedInsight(item)}
                  style={{ textAlign: "left" }}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="BC 인사이트 카드뉴스"
                      style={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        borderRadius: 16,
                        border: "1px solid #DDE5F3",
                        marginBottom: 12
                      }}
                    />
                  )}
                  <h3>{item.title}</h3>
                  <p>{item.month}</p>
                  <small>{dateLabel(item.created_at)}</small>
                </button>
              ))}
            </section>

            {selectedInsight && (
              <div className="card" style={{ marginTop: 24 }}>
                <div className="row">
                  <div>
                    <h3>{selectedInsight.title}</h3>
                    <p className="sub">{selectedInsight.month} · {dateLabel(selectedInsight.created_at)}</p>
                  </div>
                  <button className="soft" onClick={() => setSelectedInsight(null)}>닫기</button>
                </div>
                {selectedInsight.image_url && (
                  <a href={selectedInsight.image_url} target="_blank" rel="noreferrer">
                    <img
                      src={selectedInsight.image_url}
                      alt="BC 인사이트 카드뉴스"
                      style={{
                        width: "100%",
                        maxWidth: 720,
                        borderRadius: 20,
                        border: "1px solid #DDE5F3",
                        marginTop: 16
                      }}
                    />
                  </a>
                )}
                <p style={{ whiteSpace: "pre-line", marginTop: 16 }}>{selectedInsight.content}</p>
              </div>
            )}
          </section>
        )}

        {tab === "admin" && !adminLoggedIn && (
          <section className="panel center">
            <Lock size={50} />
            <h2>운영진 로그인</h2>
            <p className="sub">운영진만 접수 내용을 확인하고 답변할 수 있습니다.</p>

            <form onSubmit={loginAdmin} className="form" style={{ maxWidth: 360, margin: "0 auto" }}>
              <label>비밀번호</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="운영진 비밀번호를 입력하세요"
              />
              <button type="submit">로그인</button>
            </form>
          </section>
        )}

        {tab === "admin" && adminLoggedIn && (
          <section className="panel">
            <div className="row">
              <div>
                <h2>운영진 대시보드</h2>
                <p className="sub">매장별 익명 Voice 접수 내용과 답변 상태를 관리합니다.</p>
              </div>
              <button className="soft" onClick={() => { loadData(); loadNotices(); loadThanks(); loadFaqs(); loadInsights(); }}><RefreshCw size={16}/> 새로고침</button>
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
              <div><b>{stats.processing}</b><span>처리중</span></div>
              <div><b>{stats.done}</b><span>답변완료</span></div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <h3>📢 공지사항 관리</h3>
              <form onSubmit={submitNotice} className="form" style={{ marginTop: 12 }}>
                <label>공지 제목</label>
                <input
                  value={noticeForm.title}
                  onChange={e => setNoticeForm({...noticeForm, title: e.target.value})}
                  placeholder="예: 신규 서비스 교육 신청 오픈"
                />

                <label>공지 내용</label>
                <textarea
                  value={noticeForm.body}
                  onChange={e => setNoticeForm({...noticeForm, body: e.target.value})}
                  placeholder="공지 내용을 입력하세요."
                />

                <label>공지 이미지 첨부</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setNoticeForm({...noticeForm, imageFile: e.target.files?.[0] || null})}
                />
                {noticeForm.imageFile && (
                  <p className="sub">첨부 이미지: {noticeForm.imageFile.name}</p>
                )}

                <button type="submit">공지 등록</button>
              </form>

              <div className="list" style={{ marginTop: 16 }}>
                {notices.length === 0 && <div className="empty">등록된 공지가 없습니다.</div>}
                {notices.map(n => (
                  <div key={n.id} className="card" style={{ marginTop: 10 }}>
                    <h3>{n.title}</h3>
                    <small>{dateLabel(n.created_at)}</small>
                    <p style={{ whiteSpace: "pre-line" }}>{renderLinkedText(n.body)}</p>
                    {n.image_url && (
                      <img
                        src={n.image_url}
                        alt="공지 이미지"
                        style={{
                          width: "100%",
                          maxWidth: 360,
                          maxHeight: 220,
                          objectFit: "cover",
                          borderRadius: 16,
                          border: "1px solid #DDE5F3",
                          marginTop: 10
                        }}
                      />
                    )}
                    <button className="soft" onClick={() => deleteNotice(n.id)}>삭제</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <h3>FAQ 관리</h3>
              <form onSubmit={submitFaq} className="form" style={{ marginTop: 12 }}>
                <label>질문</label>
                <input
                  value={faqForm.question}
                  onChange={e => setFaqForm({...faqForm, question: e.target.value})}
                  placeholder="예: 교육 신청은 어떻게 하나요?"
                />

                <label>답변</label>
                <textarea
                  value={faqForm.answer}
                  onChange={e => setFaqForm({...faqForm, answer: e.target.value})}
                  placeholder="FAQ 답변을 입력하세요."
                />

                <button type="submit">FAQ 등록</button>
              </form>

              <div className="list" style={{ marginTop: 16 }}>
                {faqs.length === 0 && <div className="empty">등록된 FAQ가 없습니다.</div>}
                {faqs.map(item => (
                  <div key={item.id} className="card" style={{ marginTop: 10 }}>
                    <h3>Q. {item.question}</h3>
                    <p>A. {item.answer}</p>
                    <button className="soft" onClick={() => deleteFaq(item.id)}>삭제</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <h3>📊 BC 인사이트 관리</h3>
              <form onSubmit={submitInsight} className="form" style={{ marginTop: 12 }}>
                <label>월</label>
                <input
                  value={insightForm.month}
                  onChange={e => setInsightForm({...insightForm, month: e.target.value})}
                  placeholder="예: 2026년 07월"
                />

                <label>제목</label>
                <input
                  value={insightForm.title}
                  onChange={e => setInsightForm({...insightForm, title: e.target.value})}
                  placeholder="예: 2026년 7월 BC 인사이트"
                />

                <label>내용</label>
                <textarea
                  value={insightForm.content}
                  onChange={e => setInsightForm({...insightForm, content: e.target.value})}
                  placeholder="만족도, VOC, 트렌드, 교육 일정 등을 입력하세요."
                />

                <label>카드뉴스 이미지 첨부</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setInsightForm({...insightForm, imageFile: e.target.files?.[0] || null})}
                />
                {insightForm.imageFile && (
                  <p className="sub">첨부 이미지: {insightForm.imageFile.name}</p>
                )}

                <button type="submit">BC 인사이트 등록</button>
              </form>

              <div className="list" style={{ marginTop: 16 }}>
                {insights.length === 0 && <div className="empty">등록된 BC 인사이트가 없습니다.</div>}
                {insights.map(item => (
                  <div key={item.id} className="card" style={{ marginTop: 10 }}>
                    <h3>{item.title}</h3>
                    <p>{item.month}</p>
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt="BC 인사이트 카드뉴스"
                        style={{
                          width: "100%",
                          maxWidth: 360,
                          maxHeight: 220,
                          objectFit: "cover",
                          borderRadius: 16,
                          border: "1px solid #DDE5F3",
                          marginTop: 10
                        }}
                      />
                    )}
                    <p style={{ whiteSpace: "pre-line" }}>{item.content}</p>
                    <button className="soft" onClick={() => deleteInsight(item.id)}>삭제</button>
                  </div>
                ))}
              </div>
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
                    <p><b>{v.title}</b></p>
                    <p>{v.content}</p>
                    {v.imageUrl && <small>📎 첨부 이미지 있음</small>}
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
                        <h3>{selected.title}</h3>
                        <p>{selected.anonId} · {selected.store} · {selected.category} · {dateLabel(selected.createdAt)}</p>
                      </div>
                      <select value={selected.status} onChange={e => changeStatus(selected.id, e.target.value)}>
                        <option>접수</option>
                        <option>검토중</option>
                        <option>처리중</option>
                        <option>답변완료</option>
                      </select>
                    </div>

                    <div className="chat">
                      <div className="bubble user">
                        <b>{selected.anonId}</b>
                        <p>{selected.content}</p>
                        {selected.imageUrl && (
                          <a href={selected.imageUrl} target="_blank" rel="noreferrer">
                            <img
                              src={selected.imageUrl}
                              alt="첨부 이미지"
                              style={{ maxWidth: "100%", borderRadius: 16, marginTop: 12 }}
                            />
                          </a>
                        )}
                        <small>{dateLabel(selected.createdAt)}</small>
                      </div>

                      {selected.adminReply && (
                        <div className="bubble admin">
                          <b>운영진</b>
                          <p>{selected.adminReply}</p>
                          <small>{dateLabel(selected.repliedAt)}</small>
                        </div>
                      )}
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
