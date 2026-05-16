import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API Routes
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const chat = ai.chats.create({
      model: "gemini-3.1-flash-lite", // Fast and efficient for chat
      config: {
        systemInstruction: "You are GhostLink AI, the core intelligence of the GhostLink collaboration platform. You are precise, technical, and premium. Assist the user with their workspace tasks.",
      },
      history: history || [],
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process intelligence request" });
  }
});

app.post("/api/search", async (req, res) => {
  try {
    const { query } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Search the GhostLink intelligence network and the web for the requested information. Return a structured briefing.",
      },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    res.json({ 
      text: response.text,
      sources: groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web?.title || 'Source',
        url: chunk.web?.uri || '#'
      })) || []
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Universal Intelligence Search offline" });
  }
});

app.post("/api/commands", async (req, res) => {
  try {
    const { command } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // More capable for command processing
      contents: `Execute semantic directive: ${command}`,
      config: {
        systemInstruction: "You are the GhostLink Semantic Command Center. Process the user directive and return a JSON action plan. Possible actions: NAVIGATE, NOTIFY, SCALE_THREAD, ANALYZE_COLLAB.",
        responseMimeType: "application/json",
      },
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error("Command error:", error);
    res.status(500).json({ error: "Semantic Command Center failure" });
  }
});

// Vite Middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GhostLink Core running on http://localhost:${PORT}`);
  });
}

startServer();
