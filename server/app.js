const createError = require('http-errors');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { Pool } = require('pg');
const fetch = require('node-fetch');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const { pipeline } = require('node:stream/promises');
const { Readable } = require('stream');
const { QdrantClient } = require('@qdrant/js-client-rest');
const { v4: uuidv4 } = require('uuid');
const { HfInference } = require('@huggingface/inference');
const ics = require('ics');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

// --- PostgreSQL connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_meeting',
});

// --- Example REST endpoint for CRM update ---
app.post('/api/crm', async (req, res) => {
  // Simulate CRM update
  res.json({ status: 'CRM updated', data: req.body });
});

// --- Example REST endpoint for web search ---
app.get('/api/search', async (req, res) => {
  const q = req.query.q;
  // Simulate web search (replace with real API)
  const result = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`);
  const data = await result.json();
  res.json({ answer: data.AbstractText || 'No result found.' });
});

// --- Advanced: Real GenAI (OpenAI, HuggingFace, or Ollama local) integration for RAG, STT, TTS ---
const HF_TOKEN = process.env.HF_TOKEN || '';
const hf = new HfInference(HF_TOKEN);

// --- Qdrant (open-source vector DB, free tier cloud or local) ---
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });
const VECTOR_COLLECTION = 'meeting-notes';

// --- Real: Meeting Summarization (HuggingFace summarization) ---
app.post('/api/summarize', async (req, res) => {
  const { messages } = req.body;
  const text = messages.map(m => m.text).join('\n');
  try {
    const result = await hf.summarization({ model: 'facebook/bart-large-cnn', inputs: text });
    res.json({ summary: result.summary_text });
  } catch (e) {
    res.json({ summary: 'Summary unavailable (API error or rate limit).' });
  }
});

// --- Real: Action Items Extraction (HuggingFace NER or custom prompt) ---
app.post('/api/action-items', async (req, res) => {
  const { messages } = req.body;
  const text = messages.map(m => m.text).join('\n');
  try {
    const result = await hf.textGeneration({ model: 'tiiuae/falcon-7b-instruct', inputs: `Extract action items from this meeting:\n${text}` });
    res.json({ items: result.generated_text.split(/\n|\d+\./).filter(Boolean) });
  } catch (e) {
    res.json({ items: ['Action items unavailable (API error or rate limit).'] });
  }
});

// --- Real: Vector Search (Qdrant) ---
app.get('/api/vector-search', async (req, res) => {
  const q = req.query.q;
  try {
    // Embed query using HuggingFace MiniLM
    const embed = await hf.featureExtraction({ model: 'sentence-transformers/all-MiniLM-L6-v2', inputs: q });
    const search = await qdrant.search(VECTOR_COLLECTION, { vector: embed[0], limit: 1 });
    res.json({ result: search.length ? search[0].payload.text : 'No relevant result.' });
  } catch (e) {
    res.json({ result: 'Vector search unavailable (API error or not indexed).' });
  }
});

// --- Real: Store meeting notes in Qdrant vector DB ---
app.post('/api/vector-store', async (req, res) => {
  const { text } = req.body;
  try {
    const embed = await hf.featureExtraction({ model: 'sentence-transformers/all-MiniLM-L6-v2', inputs: text });
    await qdrant.upsert(VECTOR_COLLECTION, [{ id: uuidv4(), vector: embed[0], payload: { text } }]);
    res.json({ status: 'Stored in vector DB' });
  } catch (e) {
    res.json({ status: 'Vector DB store failed.' });
  }
});

// --- Real: STT (HuggingFace Wav2Vec2) ---
app.post('/api/stt', async (req, res) => {
  try {
    const audioBuffer = req.body.audio; // Expect base64 or binary
    const result = await hf.automaticSpeechRecognition({ model: 'facebook/wav2vec2-base-960h', data: audioBuffer });
    res.json({ text: result.text });
  } catch (e) {
    res.json({ text: 'STT unavailable (API error or rate limit).' });
  }
});

// --- Real: TTS (HuggingFace TTS) ---
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await hf.textToSpeech({ model: 'espnet/kan-bayashi_ljspeech_vits', inputs: text });
    res.set('Content-Type', 'audio/wav');
    pipeline(Readable.from(result.audio), res);
  } catch (e) {
    res.status(500).send('TTS unavailable.');
  }
});

// --- Advanced: Real-time meeting transcript storage in PostgreSQL ---
app.post('/api/store-transcript', async (req, res) => {
  const { meetingId, user, text, timestamp } = req.body;
  try {
    await pool.query(
      'INSERT INTO transcripts (meeting_id, username, text, timestamp) VALUES ($1, $2, $3, $4)',
      [meetingId, user, text, timestamp || new Date()]
    );
    res.json({ status: 'Transcript stored' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Retrieve full meeting transcript from PostgreSQL ---
app.get('/api/transcript', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM transcripts WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
    res.json({ transcript: result.rows });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Real-time analytics and insights endpoint ---
app.get('/api/analytics', async (req, res) => {
  const { meetingId } = req.query;
  try {
    // Example: count messages, users, AI vs user ratio
    const result = await pool.query('SELECT username, COUNT(*) as count FROM transcripts WHERE meeting_id = $1 GROUP BY username', [meetingId]);
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    const aiCount = result.rows.find(r => r.username === 'ai')?.count || 0;
    const userCount = total - aiCount;
    res.json({
      totalMessages: total,
      aiMessages: aiCount,
      userMessages: userCount,
      userBreakdown: result.rows
    });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Real-time meeting sentiment analysis (HuggingFace) ---
app.post('/api/sentiment', async (req, res) => {
  const { text } = req.body;
  try {
    const result = await hf.textClassification({ model: 'distilbert-base-uncased-finetuned-sst-2-english', inputs: text });
    res.json({ sentiment: result[0]?.label || 'unknown', score: result[0]?.score || 0 });
  } catch (e) {
    res.json({ sentiment: 'unavailable', score: 0 });
  }
});

// --- Advanced: Real-time topic modeling (HuggingFace) ---
app.post('/api/topics', async (req, res) => {
  const { text } = req.body;
  try {
    const result = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text,
      parameters: { candidate_labels: ['sales', 'support', 'product', 'pricing', 'technical', 'general'] }
    });
    res.json({ topics: result.labels, scores: result.scores });
  } catch (e) {
    res.json({ topics: [], scores: [] });
  }
});

// --- Advanced: Real-time user intent detection (HuggingFace) ---
app.post('/api/intent', async (req, res) => {
  const { text } = req.body;
  try {
    const result = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: text,
      parameters: { candidate_labels: ['question', 'request', 'feedback', 'greeting', 'closing', 'other'] }
    });
    res.json({ intent: result.labels[0], score: result.scores[0] });
  } catch (e) {
    res.json({ intent: 'unknown', score: 0 });
  }
});

// --- Advanced: Real-time meeting timeline (chronological summary) ---
app.get('/api/timeline', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM transcripts WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
    // For demo, just return the ordered transcript; in production, chunk and summarize
    res.json({ timeline: result.rows });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Real-time meeting agenda management ---
app.post('/api/agenda', async (req, res) => {
  const { meetingId, agenda } = req.body;
  try {
    await pool.query(
      'INSERT INTO agendas (meeting_id, agenda, timestamp) VALUES ($1, $2, $3)',
      [meetingId, agenda, new Date()]
    );
    res.json({ status: 'Agenda stored' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

app.get('/api/agenda', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM agendas WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
    res.json({ agenda: result.rows });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Real-time action item assignment and tracking ---
app.post('/api/action-item', async (req, res) => {
  const { meetingId, assignedTo, item, dueDate } = req.body;
  try {
    await pool.query(
      'INSERT INTO action_items (meeting_id, assigned_to, item, due_date, status, timestamp) VALUES ($1, $2, $3, $4, $5, $6)',
      [meetingId, assignedTo, item, dueDate, 'open', new Date()]
    );
    res.json({ status: 'Action item created' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

app.get('/api/action-items', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM action_items WHERE meeting_id = $1 ORDER BY due_date ASC', [meetingId]);
    res.json({ actionItems: result.rows });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

app.post('/api/action-item/complete', async (req, res) => {
  const { id } = req.body;
  try {
    await pool.query('UPDATE action_items SET status = $1 WHERE id = $2', ['completed', id]);
    res.json({ status: 'Action item completed' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Meeting access control and roles ---
app.post('/api/role', async (req, res) => {
  const { meetingId, user, role } = req.body;
  try {
    await pool.query(
      'INSERT INTO roles (meeting_id, username, role, timestamp) VALUES ($1, $2, $3, $4)',
      [meetingId, user, role, new Date()]
    );
    res.json({ status: 'Role assigned' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

app.get('/api/roles', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM roles WHERE meeting_id = $1', [meetingId]);
    res.json({ roles: result.rows });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Meeting audit log (all actions, for compliance) ---
app.post('/api/audit', async (req, res) => {
  const { meetingId, user, action, details } = req.body;
  try {
    await pool.query(
      'INSERT INTO audit_logs (meeting_id, username, action, details, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [meetingId, user, action, details, new Date()]
    );
    res.json({ status: 'Audit log stored' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

app.get('/api/audit', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM audit_logs WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
    res.json({ audit: result.rows });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Meeting calendar integration (Google Calendar, iCal export) ---
app.get('/api/ical', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM agendas WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
    const agenda = result.rows.map(r => r.agenda).join(' | ');
    const now = new Date();
    const event = {
      start: [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()],
      duration: { hours: 1 },
      title: `Meeting ${meetingId}`,
      description: agenda,
      status: 'CONFIRMED',
    };
    ics.createEvent(event, (error, value) => {
      if (error) return res.status(500).send('iCal error');
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="meeting_${meetingId}.ics"`);
      res.send(value);
    });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Meeting SSO (OAuth2, SAML placeholder endpoints) ---
app.get('/api/sso/login', (req, res) => {
  // Placeholder for SSO login (OAuth2/SAML integration)
  res.json({ url: 'https://sso-provider.example.com/login?redirect_uri=...' });
});

app.get('/api/sso/callback', (req, res) => {
  // Placeholder for SSO callback
  res.json({ status: 'SSO callback received', user: { id: 'demo', name: 'Demo User' } });
});

// --- Advanced: Meeting real-time co-pilot plugin system (dynamic AI tools) ---
const plugins = [
  {
    name: 'weather',
    description: 'Get current weather for a city',
    run: async ({ city }) => {
      const resp = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
      return await resp.text();
    }
  },
  {
    name: 'wiki',
    description: 'Get a Wikipedia summary',
    run: async ({ query }) => {
      const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      const data = await resp.json();
      return data.extract || 'No summary found.';
    }
  }
  // Add more plugins as needed
];

app.post('/api/plugin', async (req, res) => {
  const { plugin, params } = req.body;
  const found = plugins.find(p => p.name === plugin);
  if (!found) return res.status(404).json({ error: 'Plugin not found' });
  try {
    const result = await found.run(params);
    res.json({ result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/plugins', (req, res) => {
  res.json({ plugins: plugins.map(p => ({ name: p.name, description: p.description })) });
});

// --- Advanced: Meeting co-pilot system prompt customization (per meeting) ---
app.post('/api/system-prompt', async (req, res) => {
  const { meetingId, prompt } = req.body;
  try {
    await pool.query(
      'INSERT INTO system_prompts (meeting_id, prompt, timestamp) VALUES ($1, $2, $3)',
      [meetingId, prompt, new Date()]
    );
    res.json({ status: 'System prompt stored' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

app.get('/api/system-prompt', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM system_prompts WHERE meeting_id = $1 ORDER BY timestamp DESC LIMIT 1', [meetingId]);
    res.json({ prompt: result.rows[0]?.prompt || '' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Meeting co-pilot automation rules engine (triggered actions) ---
const automationRules = [
  // Example: auto-summarize after every 10 messages
  {
    name: 'auto-summarize',
    trigger: async ({ meetingId }) => {
      const result = await pool.query('SELECT COUNT(*) FROM transcripts WHERE meeting_id = $1', [meetingId]);
      return parseInt(result.rows[0].count) % 10 === 0;
    },
    action: async ({ meetingId }) => {
      const transcript = await pool.query('SELECT text FROM transcripts WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
      const text = transcript.rows.map(r => r.text).join('\n');
      const summary = await hf.summarization({ model: 'facebook/bart-large-cnn', inputs: text });
      await pool.query('INSERT INTO summaries (meeting_id, summary, timestamp) VALUES ($1, $2, $3)', [meetingId, summary.summary_text, new Date()]);
      return summary.summary_text;
    }
  }
  // Add more rules as needed
];

app.post('/api/automation/check', async (req, res) => {
  const { meetingId } = req.body;
  const triggered = [];
  for (const rule of automationRules) {
    if (await rule.trigger({ meetingId })) {
      const result = await rule.action({ meetingId });
      triggered.push({ rule: rule.name, result });
    }
  }
  res.json({ triggered });
});

app.get('/api/automation/rules', (req, res) => {
  res.json({ rules: automationRules.map(r => ({ name: r.name })) });
});

// --- Advanced: Meeting co-pilot webhook/event system (external integrations) ---
const webhookSubscribers = [];

app.post('/api/webhook/subscribe', (req, res) => {
  const { url, event } = req.body;
  webhookSubscribers.push({ url, event });
  res.json({ status: 'Subscribed' });
});

async function triggerWebhooks(event, payload) {
  for (const sub of webhookSubscribers.filter(s => s.event === event)) {
    try {
      await fetch(sub.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch {}
  }
}

// Example: trigger webhook on new transcript
const oldStoreTranscript = app._router.stack.find(r => r.route && r.route.path === '/api/store-transcript').route.stack[0].handle;
app._router.stack.find(r => r.route && r.route.path === '/api/store-transcript').route.stack[0].handle = async function(req, res, next) {
  await oldStoreTranscript(req, res, next);
  triggerWebhooks('transcript', req.body);
};

// --- WebSocket server for real-time AI/meeting ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  let userId = null;
  // --- Advanced: Real-time meeting participant presence and activity tracking ---
  const activeParticipants = new Map();

  ws.on('message', async (message) => {
    let data;
    try { data = JSON.parse(message); } catch { data = {}; }
    if (data.type === 'presence') {
      userId = data.userId;
      activeParticipants.set(userId, { lastActive: Date.now(), ws });
      // Broadcast updated participant list
      const participants = Array.from(activeParticipants.keys());
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'participants', participants }));
        }
      });
      return;
    }
    if (data.type === 'user') {
      // Store transcript in DB
      await pool.query(
        'INSERT INTO transcripts (meeting_id, username, text, timestamp) VALUES ($1, $2, $3, $4)',
        [data.meetingId || 'demo', data.user || 'user', data.text, new Date()]
      );
      // GenAI response
      let aiText = '';
      try {
        const result = await hf.textGeneration({ model: 'tiiuae/falcon-7b-instruct', inputs: `You are an expert meeting assistant. Respond to: ${data.text}` });
        aiText = result.generated_text;
      } catch {
        aiText = `AI: ${data.text} (fallback)`;
      }
      ws.send(JSON.stringify({ role: 'user', text: data.text, type: 'message' }));
      ws.send(JSON.stringify({ role: 'ai', text: aiText, type: 'message' }));
      // Prompt suggestions
      ws.send(JSON.stringify({ type: 'suggestions', suggestions: [
        'Ask for meeting summary',
        'Request action items',
        'Search the web for competitor info',
        'Store this discussion in knowledge base',
        'Summarize last 5 minutes',
      ] }));
      // TTS for AI response
      try {
        const ttsResult = await hf.textToSpeech({ model: 'espnet/kan-bayashi_ljspeech_vits', inputs: aiText });
        // In production, serve audio as a file or stream
        ws.send(JSON.stringify({ type: 'tts', audioUrl: '/api/tts?text=' + encodeURIComponent(aiText) }));
      } catch {}
      // Store in vector DB
      try {
        const embed = await hf.featureExtraction({ model: 'sentence-transformers/all-MiniLM-L6-v2', inputs: aiText });
        await qdrant.upsert(VECTOR_COLLECTION, [{ id: uuidv4(), vector: embed[0], payload: { text: aiText } }]);
      } catch {}
    } else if (message instanceof Buffer) {
      // STT: convert audio to text
      try {
        const sttResult = await hf.automaticSpeechRecognition({ model: 'facebook/wav2vec2-base-960h', data: message });
        ws.send(JSON.stringify({ role: 'ai', text: 'Transcribed: ' + sttResult.text, type: 'message' }));
      } catch {
        ws.send(JSON.stringify({ role: 'ai', text: 'Transcription failed.', type: 'message' }));
      }
    }
    // After handling, update activity
    if (userId) {
      activeParticipants.set(userId, { lastActive: Date.now(), ws });
    }
  });
  ws.on('close', () => {
    if (userId) {
      activeParticipants.delete(userId);
      // Broadcast updated participant list
      const participants = Array.from(activeParticipants.keys());
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'participants', participants }));
        }
      });
    }
  });
});

// --- Advanced: Meeting recording download endpoint (export transcript as CSV) ---
app.get('/api/export-transcript', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM transcripts WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
    const rows = result.rows;
    const csv = [
      'timestamp,username,text',
      ...rows.map(r => `${r.timestamp.toISOString()},${r.username.replace(/,/g, ' ')},"${r.text.replace(/"/g, '""')}"`)
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="meeting_${meetingId}.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Real-time meeting feedback collection ---
app.post('/api/feedback', async (req, res) => {
  const { meetingId, user, rating, comment } = req.body;
  try {
    await pool.query(
      'INSERT INTO feedback (meeting_id, username, rating, comment, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [meetingId, user, rating, comment, new Date()]
    );
    res.json({ status: 'Feedback stored' });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Meeting feedback analytics ---
app.get('/api/feedback-analytics', async (req, res) => {
  const { meetingId } = req.query;
  try {
    const result = await pool.query('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM feedback WHERE meeting_id = $1', [meetingId]);
    res.json({ avgRating: result.rows[0].avg_rating, count: result.rows[0].count });
  } catch (e) {
    res.status(500).json({ status: 'DB error', error: e.message });
  }
});

// --- Advanced: Meeting transcript redaction (PII/PHI removal using HuggingFace) ---
app.post('/api/redact', async (req, res) => {
  const { text } = req.body;
  try {
    // Use HuggingFace NER to find PII/PHI entities
    const result = await hf.tokenClassification({ model: 'dslim/bert-base-NER', inputs: text });
    let redacted = text;
    if (result && Array.isArray(result)) {
      result.forEach(entity => {
        if (['PER', 'ORG', 'LOC', 'MISC'].includes(entity.entity_group)) {
          redacted = redacted.replace(entity.word, '[REDACTED]');
        }
      });
    }
    res.json({ redacted });
  } catch (e) {
    res.json({ redacted: text });
  }
});

// --- Advanced: Meeting knowledge base Q&A (semantic search + GenAI answer) ---
app.post('/api/knowledge-qa', async (req, res) => {
  const { question } = req.body;
  try {
    // Embed question
    const embed = await hf.featureExtraction({ model: 'sentence-transformers/all-MiniLM-L6-v2', inputs: question });
    // Search vector DB for relevant context
    const search = await qdrant.search(VECTOR_COLLECTION, { vector: embed[0], limit: 3 });
    const context = search.map(hit => hit.payload.text).join('\n');
    // Use GenAI to answer based on context
    const result = await hf.textGeneration({ model: 'tiiuae/falcon-7b-instruct', inputs: `Context:\n${context}\n\nQuestion: ${question}\nAnswer:` });
    res.json({ answer: result.generated_text });
  } catch (e) {
    res.json({ answer: 'Unable to answer (API error or no context).' });
  }
});

// --- Advanced: Meeting live translation (HuggingFace translation) ---
app.post('/api/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  try {
    const result = await hf.translation({ model: `Helsinki-NLP/opus-mt-en-${targetLang}`, inputs: text });
    res.json({ translation: result.translation_text });
  } catch (e) {
    res.json({ translation: text });
  }
});

// --- Advanced: Meeting co-pilot real-time insights streaming (Server-Sent Events, multi-insight, advanced logic, compliance, and extensibility) ---
app.get('/api/insights/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const { meetingId } = req.query;
  let lastCount = 0;
  let lastSummary = '';
  let lastSentiment = '';
  let lastTopics = [];
  let lastActionItems = [];
  let lastAnalytics = [];
  let lastTimelineHash = '';
  let lastAgendaHash = '';
  let lastRolesHash = '';
  let lastAuditHash = '';
  let lastFeedbackHash = '';
  let lastHeartbeat = Date.now();
  const interval = setInterval(async () => {
    try {
      // Get transcript count
      const result = await pool.query('SELECT COUNT(*) FROM transcripts WHERE meeting_id = $1', [meetingId]);
      const count = parseInt(result.rows[0].count);
      if (count !== lastCount) {
        lastCount = count;
        // --- Analytics ---
        const analytics = await pool.query('SELECT username, COUNT(*) as count FROM transcripts WHERE meeting_id = $1 GROUP BY username', [meetingId]);
        if (JSON.stringify(analytics.rows) !== JSON.stringify(lastAnalytics)) {
          lastAnalytics = analytics.rows;
          res.write(`event: analytics\ndata: ${JSON.stringify({ analytics: analytics.rows })}\n\n`);
        }
        // --- Get last 50 messages for insights ---
        const transcriptResult = await pool.query('SELECT text FROM transcripts WHERE meeting_id = $1 ORDER BY timestamp DESC LIMIT 50', [meetingId]);
        const texts = transcriptResult.rows.map(r => r.text).reverse();
        const joinedText = texts.join('\n');
        // --- Summary ---
        try {
          const summaryResult = await hf.summarization({ model: 'facebook/bart-large-cnn', inputs: joinedText });
          if (summaryResult.summary_text !== lastSummary) {
            lastSummary = summaryResult.summary_text;
            res.write(`event: summary\ndata: ${JSON.stringify({ summary: summaryResult.summary_text })}\n\n`);
          }
        } catch {}
        // --- Sentiment ---
        try {
          const sentimentResult = await hf.textClassification({ model: 'distilbert-base-uncased-finetuned-sst-2-english', inputs: joinedText });
          if (sentimentResult[0]?.label !== lastSentiment) {
            lastSentiment = sentimentResult[0]?.label;
            res.write(`event: sentiment\ndata: ${JSON.stringify({ sentiment: sentimentResult[0]?.label, score: sentimentResult[0]?.score })}\n\n`);
          }
        } catch {}
        // --- Topics ---
        try {
          const topicsResult = await hf.zeroShotClassification({
            model: 'facebook/bart-large-mnli',
            inputs: joinedText,
            parameters: { candidate_labels: ['sales', 'support', 'product', 'pricing', 'technical', 'general', 'compliance', 'roadmap', 'customer', 'bug', 'feature', 'release', 'integration', 'security', 'legal', 'finance', 'hr', 'marketing', 'strategy', 'risk', 'incident', 'escalation', 'onboarding', 'training', 'performance', 'innovation', 'AI', 'automation', 'privacy', 'governance', 'partnership', 'expansion', 'retention', 'churn', 'growth', 'cost', 'ROI', 'NDA', 'SLA', 'KPI', 'OKR'] }
          });
          if (JSON.stringify(topicsResult.labels) !== JSON.stringify(lastTopics)) {
            lastTopics = topicsResult.labels;
            res.write(`event: topics\ndata: ${JSON.stringify({ topics: topicsResult.labels, scores: topicsResult.scores })}\n\n`);
          }
        } catch {}
        // --- Action Items ---
        try {
          const aiResult = await hf.textGeneration({ model: 'tiiuae/falcon-7b-instruct', inputs: `Extract action items from this meeting:\n${joinedText}` });
          const items = aiResult.generated_text.split(/\n|\d+\./).map(s => s.trim()).filter(Boolean);
          if (JSON.stringify(items) !== JSON.stringify(lastActionItems)) {
            lastActionItems = items;
            res.write(`event: action_items\ndata: ${JSON.stringify({ items })}\n\n`);
          }
        } catch {}
        // --- Timeline (hash for change detection) ---
        try {
          const timelineResult = await pool.query('SELECT username, text, timestamp FROM transcripts WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
          const timeline = timelineResult.rows;
          const timelineHash = require('crypto').createHash('md5').update(JSON.stringify(timeline)).digest('hex');
          if (timelineHash !== lastTimelineHash) {
            lastTimelineHash = timelineHash;
            res.write(`event: timeline\ndata: ${JSON.stringify({ timeline })}\n\n`);
          }
        } catch {}
        // --- Agenda (hash for change detection) ---
        try {
          const agendaResult = await pool.query('SELECT agenda, timestamp FROM agendas WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
          const agenda = agendaResult.rows;
          const agendaHash = require('crypto').createHash('md5').update(JSON.stringify(agenda)).digest('hex');
          if (agendaHash !== lastAgendaHash) {
            lastAgendaHash = agendaHash;
            res.write(`event: agenda\ndata: ${JSON.stringify({ agenda })}\n\n`);
          }
        } catch {}
        // --- Roles (hash for change detection) ---
        try {
          const rolesResult = await pool.query('SELECT username, role FROM roles WHERE meeting_id = $1', [meetingId]);
          const roles = rolesResult.rows;
          const rolesHash = require('crypto').createHash('md5').update(JSON.stringify(roles)).digest('hex');
          if (rolesHash !== lastRolesHash) {
            lastRolesHash = rolesHash;
            res.write(`event: roles\ndata: ${JSON.stringify({ roles })}\n\n`);
          }
        } catch {}
        // --- Audit Log (hash for change detection) ---
        try {
          const auditResult = await pool.query('SELECT username, action, details, timestamp FROM audit_logs WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
          const audit = auditResult.rows;
          const auditHash = require('crypto').createHash('md5').update(JSON.stringify(audit)).digest('hex');
          if (auditHash !== lastAuditHash) {
            lastAuditHash = auditHash;
            res.write(`event: audit\ndata: ${JSON.stringify({ audit })}\n\n`);
          }
        } catch {}
        // --- Feedback (hash for change detection) ---
        try {
          const feedbackResult = await pool.query('SELECT username, rating, comment, timestamp FROM feedback WHERE meeting_id = $1 ORDER BY timestamp ASC', [meetingId]);
          const feedback = feedbackResult.rows;
          const feedbackHash = require('crypto').createHash('md5').update(JSON.stringify(feedback)).digest('hex');
          if (feedbackHash !== lastFeedbackHash) {
            lastFeedbackHash = feedbackHash;
            res.write(`event: feedback\ndata: ${JSON.stringify({ feedback })}\n\n`);
          }
        } catch {}
      }
      // --- Heartbeat ---
      if (Date.now() - lastHeartbeat > 10000) {
        lastHeartbeat = Date.now();
        res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
      }
    } catch (e) {
      res.write(`event: error\ndata: {\"error\":\"${e.message}\"}\n\n`);
    }
  }, 3000);
  req.on('close', () => clearInterval(interval));
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
