import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/api';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare } from 'lucide-react';

export default function CareerChatbotDrawer({ profile }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I am your AI Career Intelligence Advisor. I have analyzed your resume for ${profile?.recommended_role || 'Software Engineer'}. Ask me anything about your score, missing competencies, or interview positioning!`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !profile) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setLoading(true);

    try {
      const res = await axios.post(getApiUrl('/api/chat'), {
        query: userQuery,
        user_id: profile.user_id,
        mode: 'candidate'
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Apologies, I encountered a temporary connection issue. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-[#0f172a] border border-gray-800 flex flex-col h-[500px] sm:h-[600px] max-h-[85vh]">
      <div className="flex items-center gap-3 pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Grounded Career Intelligence Assistant</h3>
          <p className="text-[11px] text-gray-400">
            Conversational RAG grounded strictly in your verified resume skills and target role.
          </p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 sm:pr-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 text-xs ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`p-3 sm:p-3.5 rounded-2xl max-w-[85%] sm:max-w-[80%] leading-relaxed break-words ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-sm whitespace-pre-wrap'
              }`}
            >
              {m.content}
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-400 italic">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>Formulating grounded career recommendation...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 py-2.5 border-t border-gray-800">
        {[
          "Why did I get this score?",
          "Which 3 skills should I learn first?",
          "How can I highlight my projects?",
          "Can I apply for Senior roles?"
        ].map((prompt, i) => (
          <button
            key={i}
            onClick={() => setInput(prompt)}
            className="text-[10px] text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:border-blue-500/50 px-2.5 py-1 rounded-full transition-colors min-h-[28px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI Career Advisor..."
          className="flex-1 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 min-h-[44px]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all disabled:opacity-50 min-h-[44px] min-w-[44px]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
