import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import './Chatbot.css';
import { Bot, MessageSquare, X, Send, Database, RefreshCw, Star, Info, List, Clock, ShieldCheck, MapPin, Building2, Flame, Zap } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Quick action suggestions
const QUICK_ACTIONS = [
  { icon: Clock, label: 'Track My Complaint', message: 'Show me my recent complaints and their status' },
  { icon: ShieldCheck, label: 'View Statistics', message: 'Show me overall complaint statistics and department performance' },
  { icon: MapPin, label: 'File a Complaint', message: 'How do I file a new complaint?' },
  { icon: Star, label: 'Credit & Rewards', message: 'Explain the credit and reward system' },
  { icon: Building2, label: 'Department Info', message: 'Show department-wise complaint data' },
  { icon: List, label: 'Recent Complaints', message: 'Show recent complaints filed in the system' },
];

const TYPING_TEXTS = [
  'Querying database matrix...',
  'Extracting complaint records...',
  'Synthesizing data vectors...',
  'Generating AI response...'
];

function TypingIndicator() {
  const [textIdx, setTextIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTextIdx(i => (i + 1) % TYPING_TEXTS.length), 800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="message assistant typing-message">
      <div className="message-avatar"><Bot className="w-5 h-5 text-indigo-400" /></div>
      <div className="message-bubble typing-bubble">
        <div className="typing-dots">
          <span></span><span></span><span></span>
        </div>
        <div className="typing-text">{TYPING_TEXTS[textIdx]}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)', label: 'Pending' },
    in_progress: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', label: 'In Progress' },
    completed: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Completed' },
    rejected: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Rejected' },
    default: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', label: status || 'Unknown' }
  };
  const config = statusConfig[status] || statusConfig.default;
  return (
    <span className="status-badge" style={{ color: config.color, background: config.bg, borderColor: config.color }}>
      {config.label}
    </span>
  );
}

function ComplaintCard({ complaint }) {
  return (
    <div className="complaint-card">
      <div className="complaint-card-header">
        <span className="complaint-id">{complaint.id}</span>
        <StatusBadge status={complaint.status} />
      </div>
      <div className="complaint-title">{complaint.title}</div>
      <div className="complaint-meta">
        <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> {complaint.category}</span>
        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {complaint.department || 'Unassigned'}</span>
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(complaint.createdAt).toLocaleDateString('en-IN')}</span>
      </div>
    </div>
  );
}

function MessageContent({ content, dbContext }) {
  // Render message with markdown-like formatting
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .split('\n')
    .map((line, i) => `<span key="${i}">${line}</span>`)
    .join('<br/>');

  return (
    <div>
      <div className="message-text" dangerouslySetInnerHTML={{ __html: formatted }} />
      {dbContext?.userComplaints && dbContext.userComplaints.length > 0 && (
        <div className="db-cards">
          {dbContext.userComplaints.map((c, i) => <ComplaintCard key={i} complaint={c} />)}
        </div>
      )}
    </div>
  );
}

export default function Chatbot({ token, userInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial greeting
  useEffect(() => {
    const greeting = userInfo
      ? `Greetings ${userInfo.name}! I am the NagarSeva Network AI. I am directly synced with the live database and can render real-time statistics concerning civic complaints, department efficiency, or guide you through protocol.\n\nHow can I serve you today?`
      : `Greetings! I am the NagarSeva Network AI.\n\nI can assist you with:\n- State-wide grievance tracking\n- Retrieving real-time municipal statistics\n- Explaining the credit incentive protocols\n\nHow can I serve you today?`;

    setMessages([{ id: 1, role: 'assistant', content: greeting, timestamp: new Date() }]);
  }, [userInfo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (messageText) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setInput('');
    setShowQuickActions(false);

    const userMsg = { id: Date.now(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Build history for context
    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await axios.post(
        `${API_BASE}/chatbot/chat`,
        { message: text, sessionId, history },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );

      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.reply,
        dbContext: response.data.dbContext,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

      if (!isOpen) {
        setUnreadCount(c => c + 1);
      }
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Connection to the municipal database timed out. Please verify your tracking ID or attempt transmission again later.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, sessionId, token, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: 'Memory buffer cleared. Generating new session. How can I assist you?',
      timestamp: new Date()
    }]);
    setShowQuickActions(true);
  };

  return (
    <>
      <button className={`chatbot-fab ${isOpen ? 'fab-active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? (
          <X className="w-8 h-8 font-bold" />
        ) : (
          <>
            <MessageSquare className="w-8 h-8 text-white mb-0.5" />
            <span className="fab-label">Network AI</span>
          </>
        )}
        {unreadCount > 0 && !isOpen && (
          <span className="unread-badge">{unreadCount}</span>
        )}
        <div className="fab-pulse" />
      </button>

      <div className={`chatbot-window ${isOpen ? 'window-open' : ''}`}>
        <div className="chatbot-header">
          <div className="header-left">
            <div className="bot-avatar">
              <Bot className="w-6 h-6 text-indigo-400" />
              <div className="online-dot" />
            </div>
            <div className="header-info">
              <div className="bot-name">NagarSeva AI Link</div>
              <div className="bot-status">
                <span className="status-dot" /> Online & Responsive
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={clearChat} title="Refresh Session">
              <RefreshCw />
            </button>
            <button className="header-btn" onClick={() => setIsOpen(false)} title="Close Panel">
              <X />
            </button>
          </div>
        </div>

        <div className="db-badge">
          <Database className="w-4 h-4 text-indigo-400" />
          Synchronized to Municipal Database
          <span className="db-dot ml-auto" />
        </div>

        <div className="messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.role} ${msg.isError ? 'error-message' : ''}`}>
              {msg.role === 'assistant' && <div className="message-avatar"><Bot className="w-5 h-5 text-indigo-400" /></div>}
              <div className="message-bubble">
                {msg.role === 'assistant' ? (
                  <MessageContent content={msg.content} dbContext={msg.dbContext} />
                ) : (
                  <div className="message-text">{msg.content}</div>
                )}
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {msg.role === 'user' && <div className="message-avatar user-avatar"><Flame className="w-4 h-4 text-white" /></div>}
            </div>
          ))}

          {isLoading && <TypingIndicator />}

          {showQuickActions && messages.length <= 1 && (
            <div className="quick-actions">
              <div className="quick-actions-label flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-indigo-400" /> Suggested Queries</div>
              <div className="quick-grid">
                {QUICK_ACTIONS.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={i}
                      className="quick-btn flex items-center gap-2"
                      onClick={() => sendMessage(action.message)}
                    >
                      <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span>{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-area">
          <div className="complaint-id-hint">
            <Database className="w-4 h-4 text-gray-500" /> Supply Complaint ID (e.g. CMP-2024-001) for direct retrieval
          </div>
          <div className="input-row">
            <textarea
              ref={inputRef}
              className="chat-input custom-scrollbar"
              placeholder="Query the municipal matrix..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              className={`send-btn ${input.trim() && !isLoading ? 'send-active' : ''}`}
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
            >
              <Send className={`${input.trim() && !isLoading ? 'text-white translate-x-0.5 -translate-y-0.5' : 'text-gray-500'} transition-transform`} />
            </button>
          </div>
          <div className="input-footer">
            Powered by Google Gemini · Encrypted Channel
          </div>
        </div>
      </div>
    </>
  );
}
