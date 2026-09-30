const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
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
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Chatbot service healthy', timestamp: new Date() });
});

// Store conversations in memory (in production, use database)
const conversations = new Map();

// Get conversation history
app.get('/api/chats/:conversation_id', verifyJWT, (req, res) => {
  const { conversation_id } = req.params;
  const messages = conversations.get(conversation_id) || [];
  res.json({ conversation_id, messages });
});

// Create new conversation
app.post('/api/chats', verifyJWT, (req, res) => {
  const conversation_id = uuidv4();
  conversations.set(conversation_id, []);
  res.json({ conversation_id, messages: [] });
});

// Send message and get GPT response
app.post('/api/chats/:conversation_id/messages', verifyJWT, async (req, res) => {
  const { conversation_id } = req.params;
  const { message, language = 'fr' } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message is too long (1000 characters max)' });
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'OpenRouter API key not configured' });
  }

  try {
    // Get or create conversation
    if (!conversations.has(conversation_id)) {
      conversations.set(conversation_id, []);
    }

    const messages = conversations.get(conversation_id);

    // Add user message
    const userMessage = { role: 'user', content: message };
    messages.push(userMessage);

    const systemPrompt = grounding.buildSystemPrompt(language);

    // Call OpenRouter API
    const response = await axios.post(OPENROUTER_API_URL, {
      model: 'openai/gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.2,
      max_tokens: 500,
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3200',
        'X-Title': 'Globetrotter Chat',
      },
      timeout: 30000,
    });

    const assistantMessage = response.data.choices[0].message.content;

    // Add assistant message to history
    messages.push({ role: 'assistant', content: assistantMessage });

    // Keep only last 20 messages for memory efficiency
    if (messages.length > 20) {
      messages.shift();
      messages.shift();
    }

    res.json({
      conversation_id,
      message: assistantMessage,
      messages: messages,
      sources: [],
      grounded: false,
    });
  } catch (error) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to get response from chatbot',
      details: error.response?.data?.error?.message || error.message,
    });
  }
});

// Clear conversation
app.delete('/api/chats/:conversation_id', verifyJWT, (req, res) => {
  const { conversation_id } = req.params;
  conversations.delete(conversation_id);
  res.json({ success: true, message: 'Conversation cleared' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🤖 Chatbot service running on port ${PORT}`);
  console.log(`OpenRouter API configured: ${OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
});
