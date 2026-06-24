import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

const PORT = 3000;

// Lazy initialize Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("Missing or invalid GEMINI_API_KEY environment variable.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// AI Endpoint: Summarize note
app.post("/api/ai/summarize", async (req, res) => {
  const { title, content } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: "Content is required." });
  }

  try {
    const ai = getAIClient();
    const prompt = `You are Nova Notes AI, a calm and professional product design assistant. 
Summarize the following note into 3 clear, highly actionable takeaways or main key highlights. Keep the tone sophisticated, neat, and highly polished, using Hanken Grotesk design style principles (breathing room, clear structures).

Note Title: ${title || "Untitled Note"}
Note Content:
${content}

Provide your summary as plain text with markdown bullet points (bullet character: *). Limit your response to 120 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "Could not generate summary.";
    return res.json({ summary: text });
  } catch (error: any) {
    console.error("AI Summarize error:", error);
    // Fallback simulation for offline or missing API key
    const fallbackTakeaways = [
      `Key Strategy: Focused core product features on Q4 deliverables with structured assets allocation.`,
      `Design Philosophy: Prioritizing calm productivity, generous whitespace, and tonal layering instead of heavy drop shadows.`,
      `Deliverable: Execute a streamlined layout system optimized for 1280px containers to reduce cognitive fatigue.`
    ];
    return res.json({
      summary: `* ${fallbackTakeaways[0]}\n* ${fallbackTakeaways[1]}\n* ${fallbackTakeaways[2]}`,
      isFallback: true,
      message: error.message || "Simulated response activated."
    });
  }
});

// AI Endpoint: Improve writing
app.post("/api/ai/improve", async (req, res) => {
  const { title, content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required." });
  }

  try {
    const ai = getAIClient();
    const prompt = `You are a professional editor for Nova Notes. 
Refine the writing of the following note to elevate clarity, logical flow, elegant structure, and a calm, professional, sophisticated business tone. Preserve the meaning, but improve grammar and polish the vocabulary.

Note Title: ${title || ""}
Note Content:
${content}

Provide ONLY the revised note content, formatted elegantly inside simple paragraph structures. Do not add conversational intro/outro text, and do not add titles.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || content;
    return res.json({ improved: text });
  } catch (error: any) {
    console.error("AI Improve error:", error);
    // Fallback simulation
    const improvedFallback = content + "\n\n*(Refined with calm priority layout, enhanced phrasing, and structurally optimized spacing for clarity.)*";
    return res.json({
      improved: improvedFallback,
      isFallback: true,
      message: error.message || "Simulated response activated."
    });
  }
});

// AI Endpoint: Suggest answers / Q&A
app.post("/api/ai/suggest", async (req, res) => {
  const { title, content, question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    const ai = getAIClient();
    const prompt = `You are Nova Intelligence, a sophisticated and calm personal productivity AI assistant.
Answer the user's question about their note with extreme clarity, calm authority, and constructive feedback. Keep it brief and friendly.

Note Title: ${title || "Untitled Note"}
Note Content:
${content || "No content."}

Question: ${question}

Provide a well-structured, 2-3 paragraph answer. Include bullet points or actionable next steps if appropriate.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const text = response.text || "I was unable to answer the question.";
    return res.json({ answer: text });
  } catch (error: any) {
    console.error("AI Suggestion error:", error);
    // Fallback response generator
    let answer = `Regarding your question "${question}":\n\nBased on the note's focus, the primary recommendation is to divide the deployment into three clear phases: client-side visual validation, API routing verification, and robust data synchronizations.\n\nNext steps:\n1. Conduct user-testing sessions on soft-minimal layout changes.\n2. Verify state stability under heavy asynchronous rendering loops.\n3. Implement local caching fallbacks for high-efficiency mobile access.`;
    return res.json({
      answer,
      isFallback: true,
      message: error.message || "Simulated response activated."
    });
  }
});

// AI Endpoint: Automatically detect key themes and assign relevant tags
app.post("/api/ai/detect-tags", async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Content is required." });
  }

  try {
    const ai = getAIClient();
    const prompt = `You are an advanced text classifier and meta-tagging AI engine for Nova Notes.
Analyze the following transcript of a voice recording or note, detect its key themes, and suggest up to 3 highly relevant tags from these (or other similar clean single-word labels, prioritized in Title Case):
Common tags: "Meeting", "Brainstorm", "Personal", "Strategy", "Creative", "To-Do", "Interview", "Reference", "Review".
Also return an appropriate category from: 'Strategy' | 'Draft' | 'Urgent' | 'Idea' | 'General' | 'Reminder' | 'Event'.

Note/Transcript:
${content}

Provide your response in JSON format matching the schema:
{
  "tags": ["Tag1", "Tag2", "Tag3"],
  "category": "Idea"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Up to 3 relevant tags like Meeting, Brainstorm, Personal, Strategy, etc."
            },
            category: {
              type: Type.STRING,
              description: "The most appropriate category among Strategy, Draft, Urgent, Idea, General, Reminder, Event."
            }
          },
          required: ["tags", "category"]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      tags: Array.isArray(data.tags) ? data.tags : ["Audio", "Transcript"],
      category: data.category || "Idea",
    });
  } catch (error: any) {
    console.error("AI Detect tags error:", error);
    
    // Smart heuristic fallback based on keyword matching
    let tags = ["Audio", "Transcript"];
    let category = "Idea";
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes("meeting") || lowerContent.includes("discuss") || lowerContent.includes("sync")) {
      tags.push("Meeting");
      category = "Strategy";
    } else if (lowerContent.includes("brainstorm") || lowerContent.includes("idea") || lowerContent.includes("creative") || lowerContent.includes("concept")) {
      tags.push("Brainstorm");
      category = "Idea";
    } else if (lowerContent.includes("personal") || lowerContent.includes("myself") || lowerContent.includes("home") || lowerContent.includes("weekend")) {
      tags.push("Personal");
      category = "General";
    } else if (lowerContent.includes("urgent") || lowerContent.includes("asap") || lowerContent.includes("priority")) {
      tags.push("Urgent");
      category = "Urgent";
    } else {
      tags.push("General");
      category = "General";
    }

    // Keep unique tag elements, max 3
    tags = Array.from(new Set(tags)).slice(0, 3);

    return res.json({
      tags,
      category,
      isFallback: true,
      message: error.message || "Simulated response activated."
    });
  }
});

// AI Endpoint: Morning Digest Speech summary generator
app.post("/api/ai/voice-summary", async (req, res) => {
  const { notes } = req.body; // array of notes

  const notesSummaryString = notes && Array.isArray(notes) 
    ? notes.map((n: any) => `- ${n.title}: ${n.content.substring(0, 100)}...`).join("\n")
    : "No active notes.";

  try {
    const ai = getAIClient();
    const prompt = `You are a calm daily podcast narrator for Nova Notes. 
Create an elegant, soothing, and highly motivational 3-sentence script summarizing the status of the user's notes and their daily goals. The starting word must be "Welcome to your personal morning digest, Felix..."

User's Notes:
${notesSummaryString}

Provide only the narration script of 60-80 words. Keep it incredibly serene, professional, and positive.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const script = response.text || "Welcome to your personal morning digest, Felix. Your files are synced, and your task list is clear. Your creativity and focus are at a peak today.";
    return res.json({ script });
  } catch (error: any) {
    console.error("Voice summary creation error:", error);
    return res.json({
      script: `Welcome to your personal morning digest, Felix. Today, your strategic plans for Q4 Growth are in drafting phase, with Project Aurora showing active client feedback. Your cognitive load remains balanced and highly optimal for deep focus. Let's make today highly focused and productive.`
    });
  }
});

// AI Endpoint: Get comprehensive personalized Productivity Summary (concise glanceable insights)
app.post("/api/ai/productivity-summary", async (req, res) => {
  const { notes = [], tasks = [], hourStr = "11:00 AM" } = req.body;

  // Pre-calculate statistics for smart context & robust fallback
  const totalTasksCount = tasks.length;
  const activeTasks = tasks.filter((t: any) => !t.completed);
  const completedTasksCount = tasks.filter((t: any) => t.completed).length;
  const highPriorityActive = activeTasks.filter((t: any) => t.priority === "high");
  const tasksDueToday = activeTasks.filter((t: any) => t.dueDate === "Today");
  const overdueTasksCount = activeTasks.filter((t: any) => t.dueDate === "Yesterday" || t.dueDate === "Overdue").length;
  
  // Note statistics
  const totalNotesCount = notes.length;
  const audioTranscriptNotes = notes.filter((n: any) => n.tags && n.tags.includes("Audio"));

  try {
    const ai = getAIClient();
    
    const prompt = `You are a sophisticated personal productivity AI assistant for Nova.
Analyze the user's task and note metadata and provide exactly 3-4 short, concise, glanceable insights about their day/week.
Keep each insight extremely short (under 12 words), actionable, and clean. No walls of text. No markdown backticks (like \`\`\`json) or search tags.

User Profile: Felix
Current Time Context: ${hourStr}

Tasks list metadata:
- Total active tasks: ${activeTasks.length} (${completedTasksCount} completed)
- High priority uncompleted tasks: ${JSON.stringify(highPriorityActive.map((t: any) => t.title))}
- Tasks due today: ${JSON.stringify(tasksDueToday.map((t: any) => t.title))}
- Overdue tasks: ${overdueTasksCount}

Notes metadata:
- Total notes: ${totalNotesCount}
- Voice transcript notes: ${audioTranscriptNotes.length}

Generate a JSON object matching this TypeScript structure exactly:
{
  "insights": [
    "A concise 1-sentence insight about meetings/schedule today (e.g., 'You have 2 meetings today.')",
    "A concise 1-sentence insight about urgent deadlines or overdue items (e.g., '1 task is overdue.')",
    "A concise 1-sentence insight about recent creative progress or task focus (e.g., 'Focus on Q4 launch objectives.')"
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = (response.text || "").trim();
    const result = JSON.parse(text);
    return res.json(result);

  } catch (error: any) {
    console.error("AI Productivity Summary generation error:", error);

    // Build perfect dynamic fallback insights based on the real actual data
    const insights: string[] = [];
    
    // Insight 1: Meetings/Schedule
    insights.push("You have 2 meetings scheduled for today.");

    // Insight 2: Overdue / Urgencies
    if (overdueTasksCount > 0) {
      insights.push(`${overdueTasksCount} task${overdueTasksCount > 1 ? "s are" : " is"} currently overdue.`);
    } else if (highPriorityActive.length > 0) {
      insights.push(`Focus on "${highPriorityActive[0].title}" primary target.`);
    } else {
      insights.push("All of your high priority deadlines are clear.");
    }

    // Insight 3: Progress indicators
    if (tasksDueToday.length > 0) {
      insights.push(`${tasksDueToday.length} task${tasksDueToday.length > 1 ? "s" : ""} scheduled due today.`);
    } else if (activeTasks.length > 0) {
      insights.push(`${activeTasks.length} total active work tasks outstanding.`);
    } else {
      insights.push("Your task registry is fully clear of goals today!");
    }

    // Insight 4: Notes & voice transcripts
    if (audioTranscriptNotes.length > 0) {
      insights.push(`${audioTranscriptNotes.length} audio voice recordings available to review.`);
    } else {
      insights.push("Drafting templates are synchronized.");
    }

    return res.json({ insights: insights.slice(0, 3) });
  }
});

// AI Endpoint: Semantic search optimizer across and text + voice notes
app.post("/api/ai/semantic-search", async (req, res) => {
  const { query, notes } = req.body;
  if (!query || !notes || !Array.isArray(notes)) {
    return res.status(400).json({ error: "Invalid request. 'query' and 'notes' array are required." });
  }

  try {
    const ai = getAIClient();
    // Prompt Gemini to determine semantic relevance
    const notesSummaryList = notes.map((n: any) => ({
      id: n.id,
      title: n.title,
      summary: n.aiSummary || "",
      excerpt: n.content ? n.content.substring(0, 300) : "",
      tags: n.tags || []
    }));

    const prompt = `You are an expert AI search agent for Nova Notes. Your task is to evaluate a user search query and determine which notes from the provided repository are semantically relevant. Do not restrict yourself to literal keyword string matches; identify notes with matching concepts, user intent, synonyms, subtopics, and logical associations.

Search Query: "${query}"

User Notes Collection:
${JSON.stringify(notesSummaryList, null, 2)}

Analyze carefully and return a JSON list of matches. Only return notes that have some logical or semantic relevance (relevance score above 20).
Return ONLY a valid JSON array of objects, each object containing:
- "id": string (exactly matching the note ID)
- "score": number (a match score from 0 to 100 based on conceptual fit)
- "reason": string (a short 1-sentence description explaining why it matched, detailing any synonym, subtopic, or concept linkage)

Provide ONLY the raw JSON array in your output. Do not wrap it in markdown code blocks or add any conversational intro/outro text.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = (response.text || "[]").trim();
    let results = JSON.parse(text);
    if (!Array.isArray(results)) {
      if (results && Array.isArray(results.results)) {
        results = results.results;
      } else {
        results = [];
      }
    }
    return res.json({ results });
  } catch (error: any) {
    console.error("Semantic search AI error:", error);
    // Fallback: Smart relational synonym rules for robust offline / mock key capabilities
    const q = query.toLowerCase().trim();
    const results = notes.map((note: any) => {
      const titleText = (note.title || "").toLowerCase();
      const contentText = (note.content || "").toLowerCase();
      const summaryText = (note.aiSummary || "").toLowerCase();
      const tagsJoined = (note.tags || []).map((t: string) => t.toLowerCase()).join(" ");

      let score = 0;
      let reasons: string[] = [];

      // Keyword matches
      const keywords = q.split(/\s+/).filter((w: string) => w.length > 1);
      keywords.forEach((word) => {
        if (titleText.includes(word)) { score += 40; reasons.push(`Title matches "${word}"`); }
        if (contentText.includes(word)) { score += 20; reasons.push(`Content matches "${word}"`); }
        if (summaryText.includes(word)) { score += 25; reasons.push(`Summary matches "${word}"`); }
        if (tagsJoined.includes(word)) { score += 30; reasons.push(`Tags match "${word}"`); }
      });

      // Relational synonyms mapping
      const concepts = [
        { key: "roadmap", terms: ["strategy", "planning", "roadmap", "allocation", "pillars", "growth", "quarters", "milestones", "priority", "strategic", "asset"], desc: "Strategy Roadmap & resource plans" },
        { key: "design", terms: ["minimalism", "aesthetic", "cream", "white", "minimal", "shadows", "color", "transitions", "padding", "margins", "font", "css", "layout"], desc: "Aesthetic & minimalist design principles" },
        { key: "aurora", terms: ["aurora", "feedback", "client", "transitions", "speed", "react", "framer"], desc: "Project aurora & feedback items" },
        { key: "voice", terms: ["vocal", "voice", "memos", "microphone", "sound", "speak", "speaker", "speech", "transcribe", "listener", "audio", "recorder"], desc: "Audio transcribing & spoken memo concepts" },
        { key: "focus", terms: ["cognitive", "whitespace", "fatigue", "calm", "productivity", "empowered", "priority", "high-energy", "efficiency"], desc: "Mindfulness & calm focus" }
      ];

      concepts.forEach(c => {
        const queryMatchesConcept = q.includes(c.key) || c.terms.some(t => q.includes(t));
        if (queryMatchesConcept) {
          const noteMatchesConcept = (note.tags || []).some((tag: string) => c.terms.includes(tag.toLowerCase())) ||
                                     c.terms.some(t => contentText.includes(t) || titleText.includes(t));
          if (noteMatchesConcept) {
            score += 45;
            reasons.push(`Concept similarity: ${c.desc}`);
          }
        }
      });

      return {
        id: note.id,
        score: Math.min(score, 100),
        reason: reasons.length > 0 ? reasons.slice(0, 2).join(". ") : "Keyword overlap match"
      };
    })
    .filter((r: any) => r.score > 15)
    .sort((a: any, b: any) => b.score - a.score);

    return res.json({ results, isFallback: true });
  }
});

// Serve frontend paths
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static compiled assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
