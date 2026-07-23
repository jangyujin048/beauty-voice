import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import supabase from "./api/supabase";
import { normalizeVoice, loadVoices } from "./api/voiceApi";
import { Bell, MessageCircle, Heart, BookOpen, Send, Lock, CheckCircle2, Inbox, RefreshCw } from "lucide-react";
import "./style.css";
import AdminFilters from "./components/admin/AdminFilters";
import DashboardStats from "./components/admin/DashboardStats";
import VoiceList from "./components/admin/VoiceList";
import VoiceDetail from "./components/admin/VoiceDetail";
import FAQ from "./components/faq/FAQ";
import Notice from "./components/notice/Notice";
import Thanks from "./components/thanks/Thanks";
import Insight from "./components/insight/Insight";
import BeautyVoiceBoard from "./components/board/BeautyVoiceBoard";

const ADMIN_PASSWORD = "bcadmin2026!";

import {
  stores,
  writeStores,
  categories,
  faqCategories,
} from "./utils/constants";

import { dateLabel } from "./utils/date";
import { makeAnonId } from "./utils/id";
import { renderLinkedText } from "./utils/link";

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
  const [faqForm, setFaqForm] = useState({ category: "교육", question: "", answer: "" });
  const [faqKeyword, setFaqKeyword] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState("전체");
  const [openFaqId, setOpenFaqId] = useState(null);
const [openFaqCategories, setOpenFaqCategories] = useState([
  "시스템",
  "서비스",
  "교육",
  "기타",
]);
  const [insights, setInsights] = useState([]);
  const [insightForm, setInsightForm] = useState({ month: "", title: "", content: "", imageFile: null });
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminSubTab, setAdminSubTab] = useState("voice");
  const [lookupAnonId, setLookupAnonId] = useState("");
  const [lookupPassword, setLookupPassword] = useState("");
  const [lookupDone, setLookupDone] = useState(false);
  const [submittedAnonId, setSubmittedAnonId] = useState("");
  const [storeFilter, setStoreFilter] = useState("전체");
  const [voiceKeyword, setVoiceKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
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
    let normalized = [];

    try {
      normalized = await loadVoices();
    } catch (error) {
      alert("Supabase 연결 오류가 발생했습니다. 키와 테이블 컬럼을 확인해주세요.");
      console.error(error);
      return;
    }
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
    .select("*");

  if (error) {
    alert("FAQ를 불러오는 중 오류가 발생했습니다.");
    console.error(error);
    return;
  }

  const categoryOrder = {
    시스템: 1,
    서비스: 2,
    교육: 3,
    기타: 4,
  };

  const sortedData = [...(data || [])].sort((a, b) => {
    const categoryDiff =
      (categoryOrder[a.category] ?? 999) -
      (categoryOrder[b.category] ?? 999);

    if (categoryDiff !== 0) return categoryDiff;

    // 같은 카테고리 안에서는 최신순
    return new Date(b.created_at) - new Date(a.created_at);
  });

  setFaqs(sortedData);
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
    const keyword = voiceKeyword.trim().toLowerCase();

    return voices.filter((voice) => {
      const matchStore =
        storeFilter === "전체" || voice.store === storeFilter;

      const matchCategory =
        categoryFilter === "전체" || voice.category === categoryFilter;

      const matchStatus =
        statusFilter === "전체" || voice.status === statusFilter;

      const matchKeyword =
        keyword === "" ||
        (voice.title || "").toLowerCase().includes(keyword) ||
        (voice.content || "").toLowerCase().includes(keyword) ||
        (voice.adminReply || "").toLowerCase().includes(keyword);

      return (
        matchStore &&
        matchCategory &&
        matchStatus &&
        matchKeyword
      );
    });
  }, [
    voices,
    storeFilter,
    categoryFilter,
    statusFilter,
    voiceKeyword
  ]);

  const myVoices = useMemo(() => {
    if (!lookupDone || !lookupAnonId.trim() || !lookupPassword.trim()) return [];
    return voices.filter(
      v =>
        v.anonId === lookupAnonId.trim() &&
        v.userPassword === lookupPassword.trim()
    );
  }, [voices, lookupAnonId, lookupPassword, lookupDone]);

  const stats = useMemo(() => {

    const today=new Date().toISOString().slice(0,10);

    const done=filteredVoices.filter(v=>v.status==="답변완료").length;

    const todayCount=filteredVoices.filter(v=>
      (v.createdAt||"").slice(0,10)===today
    ).length;

    return{
      total:voices.length,
      filtered:filteredVoices.length,
      today:todayCount,
      waiting:filteredVoices.filter(v=>v.status==="접수").length,
      checking:filteredVoices.filter(v=>v.status==="검토중").length,
      processing:filteredVoices.filter(v=>v.status==="처리중").length,
      done,
      replyRate:filteredVoices.length
        ?Math.round(done/filteredVoices.length*100)
        :0
    };

  },[voices,filteredVoices]);

  const storeStats = useMemo(() => writeStores.map(store => ({
    store,
    count: voices.filter(v => v.store === store).length
  })), [voices]);

  const answeredCount = useMemo(() => (
  voices.filter(v => (v.adminReply || v.status === "답변완료") && !v.replySeen).length
), [voices]);

function toggleFaqCategory(category) {
  setOpenFaqCategories((prev) => {
    if (prev.includes(category)) {
      return prev.filter((item) => item !== category);
    }

    return [...prev, category];
  });
}

  const filteredFaqs = useMemo(() => {
    const keyword = faqKeyword.trim().toLowerCase();

    return faqs.filter(item => {
      const matchesCategory =
        faqCategoryFilter === "전체" ||
        (item.category || "기타") === faqCategoryFilter;

      const matchesKeyword =
        !keyword ||
        (item.question || "").toLowerCase().includes(keyword) ||
        (item.answer || "").toLowerCase().includes(keyword);

      return matchesCategory && matchesKeyword;
    });
  }, [faqs, faqKeyword, faqCategoryFilter]);

const groupedFaqs = useMemo(() => {
  const categoryOrder = ["시스템", "서비스", "교육", "기타"];

  const groups = {};

  filteredFaqs.forEach((faq) => {
    const category = faq.category || "기타";

    if (!groups[category]) {
      groups[category] = [];
    }

    groups[category].push(faq);
  });

  return categoryOrder
    .filter((category) => groups[category]?.length > 0)
    .map((category) => ({
      category,
      items: groups[category],
    }));
}, [filteredFaqs]);

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

  function downloadVoiceCsv() {
    if (voices.length === 0) {
      alert("다운로드할 Voice가 없습니다.");
      return;
    }

    const headers = [
      "작성일",
      "매장",
      "카테고리",
      "제목",
      "내용",
      "상태",
      "답변여부",
      "답변내용"
    ];

    const escapeCsv = value => {
      const textValue = String(value ?? "").replace(/"/g, '""');
      return `"${textValue}"`;
    };

    const rows = voices.map(v => [
      new Date(v.createdAt).toLocaleString("ko-KR"),
      v.store,
      v.category,
      v.title,
      v.content,
      v.status,
      v.adminReply ? "답변완료" : "미답변",
      v.adminReply || ""
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(","),
      ...rows.map(row => row.map(escapeCsv).join(","))
    ].join("\\n");

    const bom = "\\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `BeautyVoice_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
      category: faqForm.category,
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim()
    });

    if (error) {
      alert("FAQ 등록 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setFaqForm({ category: "교육", question: "", answer: "" });
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
    (v) =>
      v.anonId === lookupAnonId.trim() &&
      v.userPassword === lookupPassword.trim()
  );

  if (
    matchedVoice &&
    (matchedVoice.adminReply || matchedVoice.status === "답변완료") &&
    !matchedVoice.replySeen
  ) {
    const { data, error } = await supabase
      .from("voices")
      .update({ reply_seen: true })
      .eq("id", matchedVoice.id)
      .select("id, reply_seen")
      .single();

    if (error) {
      console.error("답변 읽음 처리 오류:", error);
      alert("답변 읽음 처리 중 오류가 발생했습니다.");
    } else {
      console.log("답변 읽음 처리 성공:", data);

      setVoices((prev) =>
        prev.map((voice) =>
          voice.id === matchedVoice.id
            ? { ...voice, replySeen: true }
            : voice
        )
      );
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
        <button onClick={() => setTab("voice")} className={tab === "voice" ? "active" : ""}><MessageCircle size={18}/> Beauty Voice</button>
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
  <Notice
    notices={notices}
    selectedNotice={selectedNotice}
    setSelectedNotice={setSelectedNotice}
    renderLinkedText={renderLinkedText}
  />
)}

{tab === "voice" && (
  <BeautyVoiceBoard />
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
  <Thanks
    thanksForm={thanksForm}
    setThanksForm={setThanksForm}
    submitThanks={submitThanks}
    thanksList={thanksList}
    likeThanks={likeThanks}
    likedThanksIds={likedThanksIds}
    dateLabel={dateLabel}
  />
)}

        {tab === "faq" && (
  <FAQ
    faqCategoryFilter={faqCategoryFilter}
    setFaqCategoryFilter={setFaqCategoryFilter}
    faqCategories={faqCategories}
    faqKeyword={faqKeyword}
    setFaqKeyword={setFaqKeyword}
    filteredFaqs={filteredFaqs}
    groupedFaqs={groupedFaqs}
    openFaqCategories={openFaqCategories}
    toggleFaqCategory={toggleFaqCategory}
    openFaqId={openFaqId}
    setOpenFaqId={setOpenFaqId}
  />
)}

      {tab === "insight" && (
  <Insight
    insights={insights}
    selectedInsight={selectedInsight}
    setSelectedInsight={setSelectedInsight}
  />
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
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="soft" onClick={downloadVoiceCsv}>
                  📥 Voice CSV 다운로드
                </button>
                <button className="soft" onClick={() => { loadData(); loadNotices(); loadThanks(); loadFaqs(); loadInsights(); }}>
                  <RefreshCw size={16}/> 새로고침
                </button>
              </div>
            </div>

            <div className="filterTabs" style={{ marginBottom: 24 }}>
              <button
                onClick={() => setAdminSubTab("voice")}
                className={adminSubTab === "voice" ? "active" : ""}
              >
                Voice 관리
              </button>
              <button
                onClick={() => setAdminSubTab("notice")}
                className={adminSubTab === "notice" ? "active" : ""}
              >
                공지관리
              </button>
              <button
                onClick={() => setAdminSubTab("faq")}
                className={adminSubTab === "faq" ? "active" : ""}
              >
                FAQ관리
              </button>
              <button
                onClick={() => setAdminSubTab("insight")}
                className={adminSubTab === "insight" ? "active" : ""}
              >
                인사이트관리
              </button>
            </div>

            {adminSubTab === "voice" && (
              <>
                <AdminFilters
                  keyword={voiceKeyword}
                  onKeywordChange={(value) => {
                    setVoiceKeyword(value);
                    setSelected(null);
                  }}
                  stores={stores}
                  storeFilter={storeFilter}
                  onStoreChange={(value) => {
                    setStoreFilter(value);
                    setSelected(null);
                  }}
                  categories={categories}
                  categoryFilter={categoryFilter}
                  onCategoryChange={(value) => {
                    setCategoryFilter(value);
                    setSelected(null);
                  }}
                  statusFilter={statusFilter}
                  onStatusChange={(value) => {
                    setStatusFilter(value);
                    setSelected(null);
                  }}
                  onReset={() => {
                    setVoiceKeyword("");
                    setStoreFilter("전체");
                    setCategoryFilter("전체");
                    setStatusFilter("전체");
                    setSelected(null);
                  }}
                />

            <DashboardStats stats={stats} />

            <div className="adminLayout">
              <VoiceList
                voices={filteredVoices}
                selected={selected}
                onSelect={(voice) => {
                  setSelected(voice);
                  setReply(voice.adminReply || "");
                }}
              />

              <VoiceDetail
                selected={selected}
                reply={reply}
                onReplyChange={setReply}
                onSubmitReply={sendReply}
                onStatusChange={changeStatus}
              />
            </div>
              </>
            )}

            {adminSubTab === "notice" && (
              <>
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

              </>
            )}

            {adminSubTab === "faq" && (
              <>
            <div className="card" style={{ marginBottom: 24 }}>
              <h3>FAQ 관리</h3>
              <form onSubmit={submitFaq} className="form" style={{ marginTop: 12 }}>
                <label>카테고리</label>
                <select
                  value={faqForm.category}
                  onChange={e => setFaqForm({...faqForm, category: e.target.value})}
                >
                  {faqCategories.filter(category => category !== "전체").map(category => (
                    <option key={category}>{category}</option>
                  ))}
                </select>

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
                    <small>{item.category || "기타"}</small>
                    <h3>Q. {item.question}</h3>
                    <p>A. {item.answer}</p>
                    <button className="soft" onClick={() => deleteFaq(item.id)}>삭제</button>
                  </div>
                ))}
              </div>
            </div>

              </>
            )}

            {adminSubTab === "insight" && (
              <>
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

              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
