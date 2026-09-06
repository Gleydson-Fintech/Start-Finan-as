import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { GoogleGenAI } from "@google/genai";

const db = new Database("finance.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT NOT NULL,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    isSystem INTEGER DEFAULT 0,
    fileData TEXT,
    fileType TEXT
  )
`);

// Migration for existing chat_messages table
try {
  db.exec("ALTER TABLE chat_messages ADD COLUMN fileData TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE chat_messages ADD COLUMN fileType TEXT");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    timestamp TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_rooms (
    room TEXT PRIMARY KEY,
    userName TEXT,
    status TEXT DEFAULT 'waiting', -- waiting, active, ended
    lastMessage TEXT,
    updatedAt TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    firstName TEXT,
    lastName TEXT,
    age INTEGER,
    country TEXT,
    state TEXT,
    city TEXT,
    createdAt TEXT
  )
`);

// Migration for existing users table
const columns = [
  { name: 'password', type: 'TEXT' },
  { name: 'firstName', type: 'TEXT' },
  { name: 'lastName', type: 'TEXT' },
  { name: 'age', type: 'INTEGER' },
  { name: 'country', type: 'TEXT' },
  { name: 'state', type: 'TEXT' },
  { name: 'city', type: 'TEXT' },
  { name: 'createdAt', type: 'TEXT' }
];

columns.forEach(col => {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
  } catch (e) {
    // Column already exists or table doesn't exist yet
  }
});

// Create a default user if none exists
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
console.log(`Current user count in database: ${userCount.count}`);

if (userCount.count === 0) {
  console.log("Creating default test user...");
  db.prepare(`
    INSERT INTO users (id, email, password, firstName, lastName, age, country, state, city, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'admin-id', 
    'admin@admin.com', 
    'admin123', 
    'Admin', 
    'Teste', 
    30, 
    'Brasil', 
    'SP', 
    'São Paulo', 
    new Date().toISOString()
  );
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json());

  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        console.warn('GEMINI_API_KEY is missing. AI responses will be unavailable.');
        return null;
      }
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  async function handleAnnyAIResponse(room: string, userName: string, userText: string, financialContext?: any) {
    const client = getGeminiClient();
    if (!client) {
      console.warn("Anny AI failed: Gemini client not initialized.");
      return;
    }

    // Inform the client that Anny is thinking/typing
    io.to(room).emit('anny_typing', { isTyping: true });

    try {
      // 1. Fetch recent transactions to calculate backend context
      const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC LIMIT 50").all() as any[];
      
      let totalIncome = 0;
      let totalExpense = 0;
      const categoryTotals: Record<string, number> = {};
      const recentTxList: string[] = [];

      transactions.forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else if (t.type === 'expense') {
          totalExpense += t.amount;
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }
        if (recentTxList.length < 12) {
          recentTxList.push(`• ${t.date.slice(0, 10)} | ${t.type === 'income' ? 'Receita (+)' : 'Despesa (-)'}: R$ ${t.amount.toFixed(2)} (${t.category} - ${t.description})`);
        }
      });

      const dbBalance = totalIncome - totalExpense;
      const topCategoriesFormatted = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, val]) => `${cat}: R$ ${val.toFixed(2)} (${totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0}%)`)
        .join(', ');

      // 2. Format detailed context combining DB calculations and frontend snapshot
      let liveSnapshotText = '';
      if (financialContext) {
        const { balance, totalIncome: ctxIncome, totalExpense: ctxExpense, goals, fixedExpenses, healthScore, healthLabel, forecast } = financialContext;
        
        liveSnapshotText += `
PAINEL EM TEMPO REAL DO USUÁRIO (${userName}):
- Saldo Atual: R$ ${(balance ?? dbBalance).toFixed(2)}
- Receitas Totais Registradas: R$ ${(ctxIncome ?? totalIncome).toFixed(2)}
- Despesas Totais Registradas: R$ ${(ctxExpense ?? totalExpense).toFixed(2)}
- Diagnóstico de Saúde Financeira: ${healthScore || 50}/100 (${healthLabel || 'Regular'})
`;
        if (goals && Array.isArray(goals) && goals.length > 0) {
          liveSnapshotText += `- Metas Financeiras Ativas:\n${goals.map((g: any) => `  * "${g.name}": Saldo R$ ${g.currentAmount} de R$ ${g.targetAmount} (Categoria: ${g.category || 'Geral'})`).join('\n')}\n`;
        } else {
          liveSnapshotText += `- Metas Financeiras: Nenhum objetivo cadastrado ainda.\n`;
        }

        if (fixedExpenses && Array.isArray(fixedExpenses) && fixedExpenses.length > 0) {
          liveSnapshotText += `- Contas Fixas / Despesas Recorrentes:\n${fixedExpenses.map((f: any) => `  * "${f.description}": R$ ${f.amount} (Vencimento dia ${f.dueDay || 5})`).join('\n')}\n`;
        } else {
          liveSnapshotText += `- Contas Fixas: Nenhuma conta fixa cadastrada no momento.\n`;
        }

        if (forecast) {
          liveSnapshotText += `- Previsão de Saldo Próximos 30 dias: ${forecast.willBeNegative ? `⚠️ Alerta de saldo negativo previsto para ${forecast.negativeDate || 'em breve'}` : '✅ Saldo projetado positivo e seguro'}\n`;
        }
      } else {
        liveSnapshotText = `
DADOS EXTRAÍDOS DO BANCO DE DADOS:
- Saldo Atual: R$ ${dbBalance.toFixed(2)}
- Total de Receitas: R$ ${totalIncome.toFixed(2)}
- Total de Despesas: R$ ${totalExpense.toFixed(2)}
- Maiores Categorias de Despesa: ${topCategoriesFormatted || 'Nenhum gasto registrado'}
`;
      }

      // 3. Fetch recent conversation history
      let chatHistoryStr = '';
      try {
        const history = db.prepare("SELECT sender, text FROM chat_messages WHERE room = ? ORDER BY id DESC LIMIT 10").all(room) as any[];
        history.reverse();
        chatHistoryStr = history.map(h => `${h.sender === 'Anny' ? 'Anny' : h.sender}: ${h.text}`).join('\n');
      } catch (e) {
        console.error("Failed to fetch chat history:", e);
      }

      const systemPrompt = `Você é Anny, a consultora financeira e assistente inteligente oficial do aplicativo "Start Finanças".
Você NÃO é um chatbot genérico, você é uma consultora financeira pessoal ativa, empática, inteligente e integrada aos dados do usuário.

SEU OBJETIVO:
Ajudar o(a) ${userName} a organizar a vida financeira, analisar gastos, alcançar metas, otimizar o orçamento e investir melhor.

${liveSnapshotText}

ÚLTIMOS LANÇAMENTOS RECENTES:
${recentTxList.length > 0 ? recentTxList.join('\n') : '  Nenhum lançamento recente.'}

DIRETRIZES DE PERSONALIDADE E COMPORTAMENTO DA ANNY:
1. LINGUAGEM HUMANA E ACOLHEDORA: Responda em Português do Brasil com calor humano, inteligência, simpatia e otimismo. NUNCA responda de forma fria, mecânica ou robótica. Trate o usuário diretamente por ${userName}.
2. RESPOSTAS CURTAS E ÚTEIS: Suas respostas devem ser objetivas e concisas (de 1 a 3 parágrafos curtos). Use negrito para valores e termos importantes e emojis combinando com a conversa.
3. CONSELHOS BASEADOS EM DADOS REAIS: Sempre que falar sobre dinheiro, saldo, gastos ou economias, cite os números reais informados acima em R$!
4. SUGESTÕES ESPONTÂNEAS E PROATIVAS (CRÍTICO): Sempre que identificar uma oportunidade na mensagem ou nos dados, ofereça espontaneamente uma sugestão ou pergunta construtiva ao final da resposta!
   Exemplos reais de sugestões proativas que você deve usar:
   - "Você já pensou em estabelecer um limite quinzenal para a categoria [Categoria]?"
   - "Posso montar um planejamento passo a passo para te ajudar a atingir essa meta mais rápido."
   - "Percebi que seus gastos com [Categoria] estão acima da sua média. Gostaria de uma sugestão de corte simples sem perder qualidade de vida?"
   - "Que tal destinarmos uma parte do seu saldo excedente para sua meta de economia?"
5. ENCAMINHAMENTO A HUMANO: Caso o usuário peça para falar com "atendente" ou "suporte", confirme que a equipe humana foi acionada.

HISTÓRICO RECENTE DO CHAT:
${chatHistoryStr}
`;

      const response = await client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: userText,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });

      const aiText = response.text || "Estou aqui para te ajudar a cuidar do seu dinheiro! Como posso te orientar hoje?";

      // Save Anny's response to the database
      const timestamp = new Date().toISOString();
      db.prepare(
        "INSERT INTO chat_messages (room, sender, text, timestamp, isSystem) VALUES (?, ?, ?, ?, 0)"
      ).run(room, 'Anny', aiText, timestamp);

      // Update room last response
      db.prepare(
        "UPDATE chat_rooms SET lastMessage = ?, updatedAt = ? WHERE room = ?"
      ).run(aiText, timestamp, room);

      // Broadcast message to room
      io.to(room).emit("receive_message", {
        room,
        sender: 'Anny',
        text: aiText,
        timestamp,
        isSystem: false
      });

      io.emit("admin_room_update");

    } catch (error) {
      console.error("Error generating Anny AI response:", error);
    } finally {
      // Remove typing state
      io.to(room).emit('anny_typing', { isTyping: false });
    }
  }

  // Socket.io logic
  io.on("connection", (socket) => {
    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("send_message", (data) => {
      // data: { room, sender, text, timestamp, isSystem, userName, financialContext, fileData, fileType }
      const { room, sender, text, timestamp, isSystem, userName, financialContext, fileData, fileType } = data;
      db.prepare(
        "INSERT INTO chat_messages (room, sender, text, timestamp, isSystem, fileData, fileType) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(room, sender, text, timestamp, isSystem ? 1 : 0, fileData || null, fileType || null);
      
      // Update room last message and userName if provided
      if (userName) {
        db.prepare(
          "INSERT INTO chat_rooms (room, userName, lastMessage, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(room) DO UPDATE SET userName = excluded.userName, lastMessage = excluded.lastMessage, updatedAt = excluded.updatedAt"
        ).run(room, userName, text, timestamp);
      } else {
        db.prepare(
          "INSERT INTO chat_rooms (room, lastMessage, updatedAt) VALUES (?, ?, ?) ON CONFLICT(room) DO UPDATE SET lastMessage = excluded.lastMessage, updatedAt = excluded.updatedAt"
        ).run(room, text, timestamp);
      }

      io.to(room).emit("receive_message", data);
      io.emit("admin_room_update"); // Notify admin dashboard to refresh list

      // Trigger Anny AI response if sender is user, it's not a system message, and not requesting an attendant
      if (sender === 'user' && !isSystem) {
        const lowerText = (text || "").toLowerCase();
        const isAttendantRequest = (
          lowerText.includes('atendente') || 
          lowerText.includes('suporte') || 
          lowerText.includes('humano')
        );

        if (!isAttendantRequest) {
          const roomInfo = db.prepare("SELECT status FROM chat_rooms WHERE room = ?").get(room) as { status: string } | undefined;
          if (roomInfo?.status !== 'active') {
            handleAnnyAIResponse(room, userName || 'usuário', text, financialContext);
          }
        }
      }
    });

    socket.on("request_attendant", (data) => {
      // data: { room, userName, text }
      const { room, userName, text } = data;
      const timestamp = new Date().toISOString();
      
      db.prepare(
        "INSERT INTO chat_rooms (room, userName, status, lastMessage, updatedAt) VALUES (?, ?, 'waiting', ?, ?) ON CONFLICT(room) DO UPDATE SET status = 'waiting', updatedAt = excluded.updatedAt"
      ).run(room, userName, text, timestamp);

      io.emit("admin_notification", {
        type: "ATTENDANT_REQUESTED",
        ...data
      });
      io.emit("admin_room_update");
    });

    socket.on("service_ended", (room) => {
      db.prepare("UPDATE chat_rooms SET status = 'ended' WHERE room = ?").run(room);
      io.to(room).emit("service_ended", room);
      io.emit("admin_room_update");
    });
  });

  // API Routes
  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC").all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { description, amount, type, category, date } = req.body;
    const info = db.prepare(
      "INSERT INTO transactions (description, amount, type, category, date) VALUES (?, ?, ?, ?, ?)"
    ).run(description, amount, type, category, date);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { description, amount, type, category } = req.body;
    db.prepare(
      "UPDATE transactions SET description = ?, amount = ?, type = ?, category = ? WHERE id = ?"
    ).run(description, amount, type, category, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        category, 
        SUM(amount) as total 
      FROM transactions 
      WHERE type = 'expense' 
      GROUP BY category
    `).all();
    res.json(stats);
  });

  app.get("/api/chat/:room", (req, res) => {
    const messages = db.prepare("SELECT * FROM chat_messages WHERE room = ? ORDER BY timestamp ASC").all(req.params.room);
    res.json(messages.map((m: any) => ({ ...m, isSystem: !!m.isSystem })));
  });

  app.post("/api/chat/:room/message", (req, res) => {
    const { room } = req.params;
    const { sender, text, timestamp, isSystem, userName, financialContext, fileData, fileType } = req.body;
    
    db.prepare(
      "INSERT INTO chat_messages (room, sender, text, timestamp, isSystem, fileData, fileType) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(room, sender, text, timestamp, isSystem ? 1 : 0, fileData || null, fileType || null);
    
    if (userName) {
      db.prepare(
        "INSERT INTO chat_rooms (room, userName, lastMessage, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(room) DO UPDATE SET userName = excluded.userName, lastMessage = excluded.lastMessage, updatedAt = excluded.updatedAt"
      ).run(room, userName, text, timestamp);
    } else {
      db.prepare(
        "INSERT INTO chat_rooms (room, lastMessage, updatedAt) VALUES (?, ?, ?) ON CONFLICT(room) DO UPDATE SET lastMessage = excluded.lastMessage, updatedAt = excluded.updatedAt"
      ).run(room, text, timestamp);
    }

    const mData = { room, sender, text, timestamp, isSystem: !!isSystem, fileData, fileType, userName };
    io.to(room).emit("receive_message", mData);
    io.emit("admin_room_update");

    if (sender === 'user' && !isSystem) {
      const lowerText = (text || "").toLowerCase();
      const isAttendantRequest = (
        lowerText.includes('atendente') || 
        lowerText.includes('suporte') || 
        lowerText.includes('humano')
      );

      if (!isAttendantRequest) {
        const roomInfo = db.prepare("SELECT status FROM chat_rooms WHERE room = ?").get(room) as { status: string } | undefined;
        if (roomInfo?.status !== 'active') {
          handleAnnyAIResponse(room, userName || 'usuário', text, financialContext);
        }
      }
    }

    res.json(mData);
  });

  app.post("/api/chat/:room/request_attendant", (req, res) => {
    const { room } = req.params;
    const { userName, text } = req.body;
    const timestamp = new Date().toISOString();
    
    db.prepare(
      "INSERT INTO chat_rooms (room, userName, status, lastMessage, updatedAt) VALUES (?, ?, 'waiting', ?, ?) ON CONFLICT(room) DO UPDATE SET status = 'waiting', updatedAt = excluded.updatedAt"
    ).run(room, userName, text, timestamp);

    io.emit("admin_notification", {
      type: "ATTENDANT_REQUESTED",
      room,
      userName,
      text
    });
    io.emit("admin_room_update");
    
    res.json({ success: true });
  });

  app.post("/api/chat/:room/service_ended", (req, res) => {
    const { room } = req.params;
    db.prepare("UPDATE chat_rooms SET status = 'ended' WHERE room = ?").run(room);
    io.to(room).emit("service_ended", room);
    io.emit("admin_room_update");
    res.json({ success: true });
  });

  app.post("/api/chat/rating", (req, res) => {
    const { room, rating, comment, timestamp } = req.body;
    db.prepare(
      "INSERT INTO chat_ratings (room, rating, comment, timestamp) VALUES (?, ?, ?, ?)"
    ).run(room, rating, comment, timestamp);
    res.json({ success: true });
  });

  app.get("/api/admin/rooms", (req, res) => {
    const rooms = db.prepare("SELECT * FROM chat_rooms ORDER BY updatedAt DESC").all();
    res.json(rooms);
  });

  app.post("/api/admin/rooms/status", (req, res) => {
    const { room, status } = req.body;
    db.prepare("UPDATE chat_rooms SET status = ? WHERE room = ?").run(status, room);
    res.json({ success: true });
  });

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { email, password, firstName, lastName, age, country, state, city } = req.body;
    
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: "Dados inválidos", message: "E-mail e senha (mín. 6 caracteres) são obrigatórios." });
    }

    try {
      const id = Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO users (id, email, password, firstName, lastName, age, country, state, city, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, email, password, firstName, lastName, age, country, state, city, new Date().toISOString());
      
      const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      res.json(newUser);
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: "E-mail já cadastrado", message: "Este e-mail já está em uso." });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: "Erro no servidor", message: "Não foi possível realizar o cadastro." });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Dados incompletos", message: "E-mail e senha são obrigatórios." });
      }
      
      const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
      
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Credenciais inválidas", message: "E-mail ou senha incorretos." });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Erro no servidor", message: "Ocorreu um erro interno ao tentar fazer login." });
    }
  });

  app.get("/api/users/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    res.json(user || null);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
