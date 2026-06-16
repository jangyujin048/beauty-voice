import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 4000;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

app.use(cors());
app.use(express.json());

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      voices: [
        {
          id: nanoid(),
          anonId: "BC-284",
          category: "운영 건의",
          content: "신규 서비스 교육 일정이 조금 더 빨리 공유되면 좋겠습니다.",
          wantsReply: true,
          status: "검토중",
          createdAt: new Date().toISOString(),
          messages: [
            { from: "user", text: "신규 서비스 교육 일정이 조금 더 빨리 공유되면 좋겠습니다.", createdAt: new Date().toISOString() },
            { from: "admin", text: "다음 기수부터 공지 시점을 앞당기는 방향으로 검토하겠습니다.", createdAt: new Date().toISOString() }
          ]
        }
      ],
      notices: [
        { id: nanoid(), title: "신규 서비스 교육 신청 오픈", body: "6월 신규 서비스 교육 신청이 오픈되었습니다.", createdAt: new Date().toISOString() },
        { id: nanoid(), title: "이번 주 서비스 TIP", body: "결과 설명 전 고객 니즈를 먼저 확인해 주세요.", createdAt: new Date().toISOString() }
      ]
    }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function makeAnonId() {
  return "BC-" + Math.floor(100 + Math.random() * 900);
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/notices", (req, res) => {
  const db = readDb();
  res.json(db.notices);
});

app.get("/api/voices", (req, res) => {
  const db = readDb();
  res.json(db.voices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post("/api/voices", (req, res) => {
  const { category, content, wantsReply } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "내용을 입력해주세요." });
  }

  const db = readDb();
  const voice = {
    id: nanoid(),
    anonId: makeAnonId(),
    category: category || "기타",
    content: content.trim(),
    wantsReply: Boolean(wantsReply),
    status: "접수",
    createdAt: new Date().toISOString(),
    messages: [
      { from: "user", text: content.trim(), createdAt: new Date().toISOString() }
    ]
  };

  db.voices.unshift(voice);
  writeDb(db);
  res.status(201).json(voice);
});

app.patch("/api/voices/:id", (req, res) => {
  const db = readDb();
  const voice = db.voices.find(v => v.id === req.params.id);
  if (!voice) return res.status(404).json({ message: "해당 의견을 찾을 수 없습니다." });

  const { status } = req.body;
  if (status) voice.status = status;
  writeDb(db);
  res.json(voice);
});

app.post("/api/voices/:id/messages", (req, res) => {
  const db = readDb();
  const voice = db.voices.find(v => v.id === req.params.id);
  if (!voice) return res.status(404).json({ message: "해당 의견을 찾을 수 없습니다." });

  const { text, from } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ message: "답변 내용을 입력해주세요." });

  const message = {
    from: from === "user" ? "user" : "admin",
    text: text.trim(),
    createdAt: new Date().toISOString()
  };

  voice.messages.push(message);
  if (from !== "user") voice.status = "답변완료";
  writeDb(db);
  res.status(201).json(message);
});

app.listen(PORT, () => {
  console.log(`BC Voice API running: http://localhost:${PORT}`);
});
