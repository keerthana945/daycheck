import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractApiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  if (rawMessage.includes('PERMISSION_DENIED') || rawMessage.includes('403')) {
    return {
      status: 403,
      message: 'API key permission denied. Please check your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('400')) {
    return {
      status: 400,
      message: 'Invalid Gemini API request or key. Please verify GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
    return {
      status: 429,
      message: 'Rate limit reached for the Gemini API. Please wait a moment and try again.',
    };
  }
  return {
    status: 500,
    message: rawMessage || 'Unable to complete AI request.',
  };
}

interface ScheduleRequestBody {
  responsibilities?: string;
  startTime?: string;
  endTime?: string;
  pace?: string;
  existingTasks?: Array<{ title: string; time: string; priority: string; completed: boolean }>;
}

interface ChatRequestBody {
  message?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  context?: {
    tasksSummary: string;
    habitsSummary: string;
    mealsSummary: string;
    currentTime: string;
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/ai/schedule', async (req: Request, res: Response) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const body = (req.body || {}) as ScheduleRequestBody;
    const responsibilities = (body.responsibilities || '').trim();
    const startTime = body.startTime || '08:30';
    const endTime = body.endTime || '17:30';
    const pace = body.pace || 'Balanced';

    if (!responsibilities) {
      res.status(400).json({ error: 'Please describe your responsibilities or tasks for the day.' });
      return;
    }

    const existingList =
      Array.isArray(body.existingTasks) && body.existingTasks.length > 0
        ? body.existingTasks
            .filter((t) => !t.completed)
            .map((t) => `- ${t.time || 'Unscheduled'}: ${t.title} (${t.priority})`)
            .join('\n')
        : 'None';

    const paceGuidance =
      pace === 'Deep Focus'
        ? 'Group related work into 60-90 minute uninterrupted blocks with short 15-minute recovery pauses.'
        : pace === 'Gentle'
          ? 'Keep blocks shorter (25-45 minutes) with generous 15-30 minute breathing buffers and low-friction transitions.'
          : 'Alternate 45-60 minute focus blocks with 10-15 minute breaks and a proper midday meal pause.';

    const prompt = `Create a realistic, calm, time-blocked daily schedule between ${startTime} and ${endTime}.
Preferred pace: ${pace} (${paceGuidance}).

User's responsibilities to schedule:
${responsibilities}

Existing pending tasks already in planner (avoid time collisions where practical):
${existingList}

Return 4 to 8 ordered, realistic time blocks using 24-hour HH:MM start times within [${startTime}, ${endTime}].`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'You are DayEase, a calm, practical personal schedule planner. Build realistic schedules with buffer time, clear actionable titles, accurate HH:MM 24-hour times, and practical categories (Work, Personal, Health, Errands, Home).',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Concise actionable task title.' },
                time: { type: Type.STRING, description: 'Start time in 24-hour HH:MM format.' },
                durationMinutes: { type: Type.INTEGER, description: 'Estimated duration in minutes (15 to 120).' },
                priority: { type: Type.STRING, description: 'Must be exactly High, Medium, or Low.' },
                category: {
                  type: Type.STRING,
                  description: 'Must be exactly Work, Personal, Health, Errands, or Home.',
                },
                rationale: { type: Type.STRING, description: 'One short sentence explaining why this slot fits.' },
              },
              required: ['title', 'time', 'durationMinutes', 'priority', 'category', 'rationale'],
            },
          },
        },
      });

      const rawText = (response.text ?? '[]').trim();
      const blocks = JSON.parse(rawText);
      res.json({ blocks });
    } catch (err) {
      const parsed = extractApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const body = (req.body || {}) as ChatRequestBody;
    const message = (body.message || '').trim();
    if (!message) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    const context = body.context || {
      tasksSummary: 'No tasks recorded.',
      habitsSummary: 'No habit data.',
      mealsSummary: 'No meal plan.',
      currentTime: new Date().toLocaleTimeString(),
    };

    const historyText = Array.isArray(body.history)
      ? body.history
          .slice(-8)
          .map((m) => `${m.role === 'user' ? 'User' : 'DayEase'}: ${m.content}`)
          .join('\n')
      : '';

    const systemInstruction = `You are DayEase, a calm, grounded, practical personal productivity and daily life assistant.
Keep answers concise, warm, specific, and actionable (2-4 short paragraphs or crisp bullet points). Avoid hype, emojis, or fluff.
Always reference the user's real live data below when relevant:

Current local time: ${context.currentTime}

Tasks Snapshot:
${context.tasksSummary}

Habits Snapshot:
${context.habitsSummary}

Meal Plan Snapshot:
${context.mealsSummary}`;

    const fullPrompt = historyText
      ? `Recent conversation:\n${historyText}\n\nUser's new message: ${message}`
      : message;

    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: fullPrompt,
        config: {
          systemInstruction,
        },
      });

      const reply = (response.text ?? '').trim();
      if (!reply) {
        res.status(502).json({ error: 'Received an empty response from Gemini.' });
        return;
      }
      res.json({ reply });
    } catch (err) {
      const parsed = extractApiError(err);
      res.status(parsed.status).json({ error: parsed.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DayEase server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
