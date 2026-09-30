const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const grounding = require('./grounding');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3006;
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

// Configuration du fournisseur IA (API compatible OpenAI Chat Completions).
// CHATBOT_* est la configuration commune avec la branche master ;
// OPENROUTER_API_KEY reste accepté pour compatibilité.
function providerConfig() {
  return {
    apiKey: (process.env.CHATBOT_API_KEY || process.env.OPENROUTER_API_KEY || '').trim(),
    apiUrl: process.env.CHATBOT_API_URL || 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.CHATBOT_MODEL || 'openai/gpt-4o-mini',
    siteUrl: process.env.CHATBOT_SITE_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  };
}

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 12;
const MAX_HISTORY_ITEM_LENGTH = 2000;
const NOT_CONFIGURED_DETAIL =
  "Le chatbot IA n'est pas configuré. Ajoutez CHATBOT_API_KEY (ou OPENROUTER_API_KEY) dans le fichier .env puis redémarrez.";

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:3200',
    'http://frontend:80',
  ],
  credentials: true,
}));
app.use(express.json());

// JWT Verification middleware
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided', detail: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', detail: 'Token invalide ou expiré' });
  }
};

function ownerOf(req) {
  return String(req.user?.user_id ?? req.user?.sub ?? '');
}

// Appelle le fournisseur IA et renvoie le texte de la réponse.
async function askProvider(messages, language = 'fr') {
  const { apiKey, apiUrl, model, siteUrl } = providerConfig();
  const response = await axios.post(apiUrl, {
    model,
    messages: [
      { role: 'system', content: grounding.buildSystemPrompt(language) },
      ...messages,
    ],
    temperature: 0.2,
    max_tokens: 500,
  }, {
    headers: {
      Authorization: ['Bearer', apiKey].join(' '),
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': 'CampusWorkflow',
    },
    timeout: 30000,
  });

  const reply = response.data?.choices?.[0]?.message?.content;
  if (typeof reply !== 'string' || !reply.trim()) {
    const error = new Error('Réponse invalide du fournisseur IA');
    error.invalidReply = true;
    throw error;
  }
  return reply.trim();
}

function providerErrorResponse(res, error) {
  const timedOut = error.code === 'ECONNABORTED';
  console.error('Chatbot provider error:', error.response?.status || error.message);
  if (timedOut) {
    return res.status(504).json({
      error: 'Chatbot timeout',
      detail: 'Le chatbot met trop de temps à répondre. Réessayez.',
    });
  }
  return res.status(502).json({
    error: 'Failed to get response from chatbot',
    detail: error.invalidReply
      ? 'Le fournisseur du chatbot a renvoyé une réponse invalide.'
      : 'Le fournisseur du chatbot est indisponible. Vérifiez la clé, le modèle et les crédits de votre compte.',
  });
}

function validateMessage(message) {
  if (typeof message !== 'string' || message.trim() === '') {
    return { status: 400, detail: 'Saisissez une question.' };
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { status: 413, detail: 'La question ne peut pas dépasser 1 000 caractères.' };
  }
  return null;
}

// Limite globale par IP, appliquée avant toute vérification du JWT. Large,
// car derrière la gateway toutes les requêtes partagent la même IP.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.CHATBOT_API_RATE_LIMIT_PER_MINUTE) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', detail: 'Trop de requêtes. Réessayez dans une minute.' },
});
app.use('/api', apiLimiter);

// Limite par utilisateur (après verifyJWT) : chaque message déclenche un
// appel payant au fournisseur IA. Complète la limite posée par la gateway
// pour le cas où le service est joint directement (port exposé).
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.CHATBOT_RATE_LIMIT_PER_MINUTE) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user?.user_id ?? req.user?.sub ?? 'anonymous'}`,
  message: { error: 'Too many requests', detail: "Trop de messages envoyés à l'assistant. Réessayez dans une minute." },
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'Chatbot service healthy',
    configured: Boolean(providerConfig().apiKey),
    timestamp: new Date(),
  });
});

// ── Assistant Campus (/chatbot) : question ponctuelle, historique fourni par le client ──
app.post('/api/chatbot/message', verifyJWT, messageLimiter, async (req, res) => {
  const invalid = validateMessage(req.body?.message);
  if (invalid) return res.status(invalid.status).json({ error: invalid.detail, detail: invalid.detail });
  const message = req.body.message.trim();

  const history = req.body?.history ?? [];
  if (
    !Array.isArray(history) ||
    history.length > MAX_HISTORY_ITEMS ||
    history.some((item) =>
      !['user', 'assistant'].includes(item?.role) ||
      typeof item?.content !== 'string' ||
      !item.content.trim() ||
      item.content.length > MAX_HISTORY_ITEM_LENGTH
    )
  ) {
    return res.status(400).json({ error: 'Invalid history', detail: 'Historique de conversation invalide.' });
  }

  if (!providerConfig().apiKey) {
    return res.status(503).json({ error: 'Chatbot not configured', detail: NOT_CONFIGURED_DETAIL });
  }

  try {
    const reply = await askProvider(
      [
        ...history.map(({ role, content }) => ({ role, content: content.trim() })),
        { role: 'user', content: message },
      ],
      req.body?.language === 'en' ? 'en' : 'fr'
    );
    return res.json({ reply });
  } catch (error) {
    return providerErrorResponse(res, error);
  }
});

// ── Assistant IA (/assistant) : conversations conservées en mémoire ──
// Chaque conversation appartient à l'utilisateur qui l'a créée.
// (en production, utiliser une base de données)
const conversations = new Map();

function getOwnedConversation(req, res) {
  const conversation = conversations.get(req.params.conversation_id);
  if (!conversation || conversation.owner !== ownerOf(req)) {
    res.status(404).json({ error: 'Conversation not found', detail: 'Conversation introuvable' });
    return null;
  }
  return conversation;
}

// Get conversation history
app.get('/api/chats/:conversation_id', verifyJWT, (req, res) => {
  const conversation = getOwnedConversation(req, res);
  if (!conversation) return;
  res.json({ conversation_id: req.params.conversation_id, messages: conversation.messages });
});

// Create new conversation
app.post('/api/chats', verifyJWT, (req, res) => {
  const conversation_id = uuidv4();
  conversations.set(conversation_id, { owner: ownerOf(req), messages: [] });
  res.json({ conversation_id, messages: [] });
});

// Send message and get AI response
app.post('/api/chats/:conversation_id/messages', verifyJWT, messageLimiter, async (req, res) => {
  const { language = 'fr' } = req.body || {};
  const invalid = validateMessage(req.body?.message);
  if (invalid) return res.status(invalid.status).json({ error: invalid.detail, detail: invalid.detail });
  const message = req.body.message.trim();

  if (!providerConfig().apiKey) {
    return res.status(503).json({ error: 'Chatbot not configured', detail: NOT_CONFIGURED_DETAIL });
  }

  let conversation = conversations.get(req.params.conversation_id);
  if (!conversation) {
    conversation = { owner: ownerOf(req), messages: [] };
    conversations.set(req.params.conversation_id, conversation);
  } else if (conversation.owner !== ownerOf(req)) {
    return res.status(404).json({ error: 'Conversation not found', detail: 'Conversation introuvable' });
  }

  const { messages } = conversation;

  try {
    const assistantMessage = await askProvider([...messages, { role: 'user', content: message }], language);

    messages.push({ role: 'user', content: message });
    messages.push({ role: 'assistant', content: assistantMessage });

    // Keep only last 20 messages for memory efficiency
    while (messages.length > 20) {
      messages.splice(0, 2);
    }

    res.json({
      conversation_id: req.params.conversation_id,
      message: assistantMessage,
      messages,
      sources: [],
      grounded: false,
    });
  } catch (error) {
    return providerErrorResponse(res, error);
  }
});

// Clear conversation
app.delete('/api/chats/:conversation_id', verifyJWT, (req, res) => {
  const conversation = getOwnedConversation(req, res);
  if (!conversation) return;
  conversations.delete(req.params.conversation_id);
  res.json({ success: true, message: 'Conversation cleared' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', detail: 'Erreur interne du chatbot' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🤖 Chatbot service running on port ${PORT}`);
    console.log(`AI provider configured: ${providerConfig().apiKey ? 'Yes' : 'No'}`);
  });
}

module.exports = app;
