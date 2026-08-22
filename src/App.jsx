import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import supabase from "./api/supabase";
import { normalizeVoice, loadVoices } from "./api/voiceApi";
import { Bell, MessageCircle, Heart, BookOpen, Send, Lock, CheckCircle2, Inbox, RefreshCw, Trophy, CalendarDays } from "lucide-react";
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
import LoginButton from "./components/auth/LoginButton";
import MyVoice from "./components/myvoice/MyVoice";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdminBoardPosts from "./components/admin/AdminBoardPosts";
import AdminContentManager from "./components/admin/AdminContentManager";
import WeeklyChallenge from "./components/challenge/WeeklyChallenge";
import AdminChallengeManager from "./components/admin/AdminChallengeManager";
import BeautyLab from "./components/beautylab/BeautyLab";

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
  const { user } = useAuth();
  const [tab, setTab] = useState("home");
  const [voices, setVoices] = useState([]);
  const [notices, setNotices] = useState([]);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedHomeNotice, setSelectedHomeNotice] = useState(null);
  const [thanksList, setThanksList] = useState([]);
  const [thanksForm, setThanksForm] = useState({ receiver: "", message: "" });
  const [likedThanksIds, setLikedThanksIds] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [faqKeyword, setFaqKeyword] = useState("");
  const [faqCategoryFilter, setFaqCategoryFilter] = useState("전체");
  const [openFaqId, setOpenFaqId] = useState(null);
const [openFaqCategories, setOpenFaqCategories] = useState([
  "시스템",
  "서비스",
  "정보",
  "기타",
]);
  const [insights, setInsights] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
const [adminSubTab, setAdminSubTab] = useState("board");
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
    정보: 3,
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

  useEffect(() => {
    async function loadMyThanksLikes() {
      if (!user?.id) {
        setLikedThanksIds([]);
        return;
      }

      const { data, error } = await supabase
        .from("thanks_likes")
        .select("thanks_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Thanks 공감 상태 조회 오류:", error);
        setLikedThanksIds([]);
        return;
      }

      setLikedThanksIds(
        (data || []).map((item) => String(item.thanks_id))
      );
    }

    loadMyThanksLikes();
  }, [user?.id]);

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
  const categoryOrder = ["시스템", "서비스", "정보", "기타"];

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

function loginAdmin(e) {
  e.preventDefault();

  if (adminPassword === ADMIN_PASSWORD) {
    setAdminLoggedIn(true);
    setAdminPassword("");
    return;
  }

  alert("운영진 비밀번호가 일치하지 않습니다.");
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
    if (!user?.id) {
      alert("로그인 후 공감할 수 있습니다.");
      return;
    }

    const { data, error } = await supabase.rpc(
      "toggle_thanks_like",
      {
        p_thanks_id: String(item.id),
      }
    );

    if (error) {
      alert("공감 처리 중 오류가 발생했습니다.");
      console.error("Thanks 공감 처리 오류:", error);
      return;
    }

    const liked = Boolean(data?.liked);
    const likes = Number(data?.likes ?? item.likes ?? 0);
    const itemId = String(item.id);

    setThanksList((previous) =>
      previous.map((thanksItem) =>
        String(thanksItem.id) === itemId
          ? {
              ...thanksItem,
              likes,
            }
          : thanksItem
      )
    );

    setLikedThanksIds((previous) =>
      liked
        ? Array.from(new Set([...previous, itemId]))
        : previous.filter((id) => String(id) !== itemId)
    );
  }

  async function submitThanks(e) {
    e.preventDefault();

    if (!user) {
      alert("로그인 후 Thanks를 남길 수 있습니다.");
      return;
    }

    if (!thanksForm.receiver.trim()) {
      return alert("감사를 전할 대상을 입력해주세요.");
    }

    if (!thanksForm.message.trim()) {
      return alert("감사 내용을 입력해주세요.");
    }

    const { error } = await supabase.from("thanks").insert({
      receiver: thanksForm.receiver.trim(),
      message: thanksForm.message.trim(),
      created_by: user.id
    });

    if (error) {
      alert("Thanks 등록 중 오류가 발생했습니다.");
      console.error(error);
      return;
    }

    setThanksForm({ receiver: "", message: "" });
    await loadThanks();
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

  const loginRequiredInfo = {
    home: {
      title: "홈",
      icon: Bell,
      message: "로그인 후 Beauty Voice의 주요 소식과 콘텐츠를 확인할 수 있습니다.",
    },
    notice: {
      title: "공지사항",
      icon: Bell,
      message: "로그인 후 공지사항과 주요 안내를 확인할 수 있습니다.",
    },
    voice: {
      title: "Beauty Voice",
      icon: MessageCircle,
      message: "로그인 후 구성원들의 이야기와 의견을 확인하고 참여할 수 있습니다.",
    },
    myVoice: {
      title: "My Voice",
      icon: Inbox,
      message: "로그인 후 내가 작성한 글을 확인할 수 있습니다.",
    },
    challenge: {
      title: "Beauty Mission",
      icon: Trophy,
      message: "로그인 후 진행 중인 미션을 확인하고 참여할 수 있습니다.",
    },
    thanks: {
      title: "Thanks",
      icon: Heart,
      message: "로그인 후 동료에게 Thanks를 남기고 감사 메시지를 확인할 수 있습니다.",
    },
    faq: {
      title: "FAQ",
      icon: BookOpen,
      message: "로그인 후 FAQ와 운영 정보를 확인할 수 있습니다.",
    },
    insight: {
      title: "BC 인사이트",
      icon: BookOpen,
      message: "로그인 후 BC 인사이트와 주요 리포트를 확인할 수 있습니다.",
    },
    admin: {
      title: "운영진",
      icon: Lock,
      message: "로그인 후 운영진 전용 메뉴에 접근할 수 있습니다.",
    },
    beautylab: {
      title: "BEAUTY LAB",
      icon: CalendarDays,
      message: "로그인 후 BEAUTY LAB 메뉴를 이용할 수 있습니다.",
    },
  };

  function LoginRequiredPanel() {
    const info =
      loginRequiredInfo[tab] || loginRequiredInfo.home;
    const Icon = info.icon;

    return (
      <section
        className="panel center"
        style={{
          minHeight: 345,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Icon
          size={52}
          strokeWidth={1.8}
          style={{
            color: "#163A73",
            marginBottom: 12,
          }}
        />

        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          {info.title}
        </h2>

        <p
          className="sub"
          style={{
            margin: "14px 0 22px",
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          {info.message}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <LoginButton />
        </div>
      </section>
    );
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
<button
  onClick={() => setTab("myVoice")}
  className={tab === "myVoice" ? "active" : ""}
>
  <Inbox size={18} />
  <span>My Voice</span>
</button>

<button
  onClick={() => setTab("challenge")}
  className={tab === "challenge" ? "active" : ""}
>
  <Trophy size={18} />
  <span>Beauty Mission</span>
</button>

        <button onClick={() => setTab("thanks")} className={tab === "thanks" ? "active" : ""}><Heart size={18}/> Thanks</button>
        <button onClick={() => setTab("faq")} className={tab === "faq" ? "active" : ""}><BookOpen size={18}/> FAQ</button>
        <button onClick={() => setTab("insight")} className={tab === "insight" ? "active" : ""}><BookOpen size={18}/> BC 인사이트</button>

{/* BEAUTY LAB - 잠정 보류
<button
  onClick={() => setTab("beautylab")}
  className={tab === "beautylab" ? "active" : ""}
>
  <CalendarDays size={18}/> BEAUTY LAB
</button>
*/}

        <button onClick={() => setTab("admin")} className={tab === "admin" ? "active" : ""}><Lock size={18}/> 운영진</button>
<div
  style={{
    marginTop: "auto",
    paddingTop: 20,
  }}
>
  <LoginButton />
</div>
      </aside>

      <main className="main">
        {!user ? (
          <LoginRequiredPanel />
        ) : (
          <>

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

            <section
  className="grid"
  style={{
    alignItems: "stretch",
    marginTop: 24,
  }}
>
  <div
  className="card"
  style={{
    display: "flex",
    flexDirection: "column",
    minHeight: 260,
    padding: 22,
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 16,
    }}
  >
    <h3
      style={{
        margin: 0,
      }}
    >
      📢 최신 공지
    </h3>

    <button
      type="button"
      className="soft"
      onClick={() =>
        setTab("notice")
      }
      style={{
        padding: "7px 10px",
        fontSize: 12,
      }}
    >
      전체보기
    </button>
  </div>

  {latestNotices.length === 0 ? (
    <div
      className="empty"
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      등록된 공지가 없습니다.
    </div>
  ) : (
    latestNotices
      .slice(0, 1)
      .map(n => (
        <button
          key={n.id}
          type="button"
          onClick={() => {
            setSelectedNotice(n);
            setTab("notice");
          }}
          style={{
            flex: 1,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: 18,
            border:
              "1px solid #e2e8f2",
            borderRadius: 18,
            background: "#f8faff",
            color: "inherit",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "100%",
            }}
          >
            <span
              style={{
                display: "inline-block",
                marginBottom: 10,
                padding: "5px 9px",
                borderRadius: 999,
                background: "#e8eef9",
                color: "#0e2d69",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              NOTICE
            </span>

            <h4
              style={{
                margin: "0 0 10px",
                fontSize: 17,
                lineHeight: 1.45,
              }}
            >
              {n.title}
            </h4>

            <p
              className="sub"
              style={{
                margin: 0,
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient:
                  "vertical",
                overflow: "hidden",
              }}
            >
              {n.content ||
                "공지 내용을 확인해보세요."}
            </p>
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 10,
              marginTop: 18,
              fontSize: 12,
              color: "#667085",
            }}
          >
            <span>
              {dateLabel(
                n.created_at
              )}
            </span>

            <strong
              style={{
                color: "#0e2d69",
              }}
            >
              자세히 보기 →
            </strong>
          </div>
        </button>
      ))
  )}
</div>

  <div
    className="card"
    style={{
      display: "flex",
      flexDirection: "column",
      minHeight: 260,
      padding: 22,
    }}
  >
    <h3
      style={{
        marginBottom: 14,
      }}
    >
      🏆 Beauty Mission
    </h3>

    <div
      style={{
        flex: 1,
      }}
    >
      <p
        style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 17,
          fontWeight: 800,
        }}
      >
        지금 참여할 수 있는 미션
      </p>

      <p
        className="sub"
        style={{
          margin: 0,
          lineHeight: 1.7,
          maxWidth: 280,
        }}
      >
        함께 나누고 싶은 이야기에
        가볍게 참여해보세요.
      </p>
    </div>

    <button
      type="button"
      className="soft"
      onClick={() => setTab("challenge")}
      style={{
        width: "100%",
        marginTop: 16,
        justifyContent: "center",
      }}
    >
      미션 보러가기
    </button>
  </div>

  <div
    className="card"
    style={{
      display: "flex",
      flexDirection: "column",
      minHeight: 260,
      padding: 22,
    }}
  >
    <h3
      style={{
        marginBottom: 14,
      }}
    >
      ❤️ Thanks TOP3
    </h3>

    <div
      style={{
        display: "grid",
        gap: 10,
        flex: 1,
      }}
    >
      {topThanks.length === 0 ? (
        <p className="sub">
          아직 등록된 Thanks가 없습니다.
        </p>
      ) : (
        topThanks.map((item, index) => (
          <div
            key={item.id}
            style={{
              paddingBottom: 10,
              borderBottom:
                index !== topThanks.length - 1
                  ? "1px solid #ececec"
                  : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
              }}
            >
              <b>
                {index + 1}. {item.receiver}
              </b>

              <small
                style={{
                  flexShrink: 0,
                }}
              >
                ❤️ {item.likes || 0}
              </small>
            </div>

            <p
              className="sub"
              style={{
                margin: "4px 0 0",
                lineHeight: 1.45,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.message}
            </p>
          </div>
        ))
      )}
    </div>

    <button
      type="button"
      className="soft"
      onClick={() => setTab("thanks")}
      style={{
        width: "100%",
        marginTop: 16,
        justifyContent: "center",
      }}
    >
      전체 Thanks 보기
    </button>
  </div>
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

{tab === "myVoice" && (
  <MyVoice
    onBack={() => setTab("voice")}
  />
)}

	{tab === "challenge" && (
	  <WeeklyChallenge />
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

       {tab === "thanks" && (
  <Thanks
    thanksForm={thanksForm}
    setThanksForm={setThanksForm}
    submitThanks={submitThanks}
    thanksList={thanksList}
    likeThanks={likeThanks}
    likedThanksIds={likedThanksIds}
    dateLabel={dateLabel}
    refreshThanks={loadThanks}
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

{tab === "beautylab" && (
  <BeautyLab />
)}

{tab === "admin" && !adminLoggedIn && (
  <section className="panel center adminLoginPanel">
    <div className="adminLoginIcon">
      <Lock size={28} />
    </div>

    <h2>운영진 로그인</h2>

    <p className="sub">
      운영진만 접수 내용을 확인하고 답변할 수 있습니다.
    </p>

    <form
      onSubmit={loginAdmin}
      className="adminLoginForm"
    >
      <label>비밀번호</label>

      <input
        type="password"
        value={adminPassword}
        onChange={(e) => setAdminPassword(e.target.value)}
        placeholder="운영진 비밀번호를 입력하세요"
      />

      <button type="submit">
        로그인
      </button>
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
	  onClick={() => setAdminSubTab("board")}
	  className={
	    adminSubTab === "board" ? "active" : ""}
	>
 	 Beauty Voice 관리
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
		<button
		  onClick={() =>
		    setAdminSubTab("challenge")
		  }
		  className={
		    adminSubTab === "challenge"
		      ? "active"
		      : ""
		  }
		>
		  챌린지관리
		</button>
            </div>
	    {adminSubTab === "board" && (
		  <AdminBoardPosts />
		)}
		{adminSubTab === "challenge" && (
		  <AdminChallengeManager />
		)}

            {["notice", "faq", "insight"].includes(adminSubTab) && (
              <AdminContentManager
                type={adminSubTab}
                items={
                  adminSubTab === "notice"
                    ? notices
                    : adminSubTab === "faq"
                      ? faqs
                      : insights
                }
                onReload={
                  adminSubTab === "notice"
                    ? loadNotices
                    : adminSubTab === "faq"
                      ? loadFaqs
                      : loadInsights
                }
                faqCategories={faqCategories}
              />
            )}
          </section>
        )}
      
          </>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
