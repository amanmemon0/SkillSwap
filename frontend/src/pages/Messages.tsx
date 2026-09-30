import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Calendar, MessageSquare, Send, Smile } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Avatar, Button, SkillTag, StatusDot } from '../components/ui/Primitives';
import { api } from '../utils/api';

type Message = {
  id: string;
  sender: 'me' | 'them';
  text: string;
  timestamp: string;
};

type Chat = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  online: boolean;
  skill: string;
  messages: Message[];
};

export default function Messages() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  const fetchChats = async () => {
    try {
      setLoading(true);
      const me = await api.getMe();
      setUserId(me._id);

      const convs = await api.getConversations();
      const chatsList: Chat[] = [];

      for (const conv of convs || []) {
        const isUser1 = conv.user1_id === me._id;
        const otherUser = isUser1 ? conv.user2 : conv.user1;
        const otherName = otherUser?.full_name || 'Member';

        let dbMsgs: any[] = [];
        try { dbMsgs = await api.getMessages(conv.id); } catch {}

        const mappedMsgs: Message[] = (dbMsgs || []).map((m: any) => ({
          id: m.id,
          sender: m.sender_id === me._id ? 'me' : 'them',
          text: m.body || '',
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        chatsList.push({
          id: conv.id, name: otherName,
          avatar: otherName.charAt(0).toUpperCase(),
          lastMessage: mappedMsgs[mappedMsgs.length - 1]?.text || 'No messages yet',
          time: 'Active', unread: false, online: true,
          skill: otherUser?.primary_skill || 'Collaboration',
          messages: mappedMsgs,
        });
      }

      setChats(chatsList);
      if (chatsList.length > 0 && (!activeChatId || !chatsList.some(c => c.id === activeChatId))) {
        setActiveChatId(chatsList[0].id);
      }
    } catch (err) {
      console.error('fetchChats error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time: polls only the ACTIVE conversation messages every 2 seconds
  const pollActiveMessages = async (convId: string, myId: string) => {
    try {
      const dbMsgs = await api.getMessages(convId);
      const mapped: Message[] = (dbMsgs || []).map((m: any) => ({
        id: m.id,
        sender: m.sender_id === myId ? 'me' : 'them',
        text: m.body || '',
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setChats(prev => prev.map(c =>
        c.id === convId
          ? { ...c, messages: mapped, lastMessage: mapped[mapped.length - 1]?.text || c.lastMessage }
          : c
      ));
    } catch { /* silently ignore */ }
  };

  useEffect(() => { fetchChats(); }, []);

  // Poll active conversation every 2 s for near-instant message delivery
  useEffect(() => {
    if (!activeChatId || !userId) return;
    pollActiveMessages(activeChatId, userId);
    const interval = setInterval(() => pollActiveMessages(activeChatId, userId), 2000);
    return () => clearInterval(interval);
  }, [activeChatId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, chats]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || !userId) return;

    const messageText = inputText.trim();
    setInputText('');

    // Optimistic update — show my message instantly while the API call is in-flight
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      sender: 'me',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChats(prev => prev.map(c =>
      c.id === activeChatId
        ? { ...c, messages: [...c.messages, optimisticMsg], lastMessage: messageText }
        : c
    ));

    try {
      await api.sendMessage(activeChatId, messageText);
      // Immediately replace the optimistic message with the real server record
      if (userId) pollActiveMessages(activeChatId, userId);
    } catch (err) {
      console.error('Send message error:', err);
      // Revert optimistic message on failure
      setChats(prev => prev.map(c =>
        c.id === activeChatId
          ? { ...c, messages: c.messages.filter(m => m.id !== optimisticId) }
          : c
      ));
      setInputText(messageText);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface text-ink flex flex-col">
        <Navbar variant="auth" />
        <div className="flex-1 grid place-items-center">
          <p className="text-ink/50 text-sm font-bold animate-pulse">Loading conversations...</p>
        </div>
      </main>
    );
  }

  if (chats.length === 0) {
    return (
      <main className="min-h-screen bg-surface text-ink flex flex-col">
        <Navbar variant="auth" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-violet/10 grid place-items-center text-violet mb-4">
            <MessageSquare size={32} />
          </div>
          <h2 className="text-2xl font-bold font-display">No Conversations Yet</h2>
          <p className="text-sm text-ink/50 max-w-sm mt-2">
            Propose a skill exchange or connect with a swapper to start messaging!
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/explore">
              <Button className="bg-gradient-to-r from-violet to-electric text-white">
                Explore Skills
              </Button>
            </Link>
            <Link to="/match">
              <Button className="bg-white text-ink ring-1 ring-ink/10">
                Find Matches
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-ink flex flex-col">
      <Navbar variant="auth" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-6 flex-1 flex flex-col md:flex-row gap-4 h-[calc(100vh-5rem)] sm:px-8">
        {/* Chat Sidebar */}
        <aside
          className={`${
            showSidebar ? 'flex' : 'hidden md:flex'
          } w-full md:w-80 rounded-3xl bg-white p-4 shadow-card border border-ink/5 flex-col h-full`}
        >
          <div className="mb-4 px-2">
            <h2 className="font-display text-xl font-bold">Messages</h2>
            <p className="text-xs text-ink/40 mt-0.5">{chats.filter((c) => c.unread).length} unread</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  setShowSidebar(false);
                  setChats((current) =>
                    current.map((c) => (c.id === chat.id ? { ...c, unread: false } : c))
                  );
                }}
                className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                  activeChatId === chat.id
                    ? 'bg-gradient-to-r from-violet to-electric text-white shadow-sm'
                    : 'hover:bg-surface'
                }`}
              >
                <span className="relative">
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full text-base font-extrabold shadow-sm ${
                      activeChatId === chat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gradient-to-br from-violet to-electric text-white'
                    }`}
                  >
                    {chat.avatar}
                  </span>
                  {chat.online && (
                    <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ${
                      activeChatId === chat.id ? 'bg-emerald-400 ring-violet' : 'bg-emerald-400 ring-white'
                    }`} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-sm block truncate">{chat.name}</span>
                    <span
                      className={`text-[10px] uppercase font-mono ${
                        activeChatId === chat.id ? 'text-white/60' : 'text-ink/35'
                      }`}
                    >
                      {chat.time}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-0.5 truncate ${
                      activeChatId === chat.id ? 'text-white/70' : 'text-ink/50'
                    }`}
                  >
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread && <span className="h-2.5 w-2.5 rounded-full bg-violet animate-pulse shrink-0" />}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Window */}
        <section className="flex-1 rounded-3xl bg-white border border-ink/5 shadow-card flex flex-col h-full overflow-hidden">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-ink/5 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden rounded-xl p-2 bg-surface text-ink/60"
              >
                ☰
              </button>
              <span className="relative">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet to-electric text-white text-base font-extrabold shadow-sm">
                  {activeChat.avatar}
                </span>
                {activeChat.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                )}
              </span>
              <div>
                <h3 className="font-display text-base font-bold">{activeChat.name}</h3>
                <StatusDot status={activeChat.online ? 'online' : 'offline'} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Skill Context Badge */}
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-violet/10 px-3 py-1.5 text-[10px] font-bold text-violet">
                <ArrowRightLeft size={12} /> {activeChat.skill}
              </span>
              <Button className="bg-surface text-ink/60 hover:bg-violet hover:text-white text-xs py-2">
                <Calendar size={14} /> Schedule
              </Button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface/50">
            {/* Skill Context at top */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet/5 border border-violet/10 px-4 py-2 text-xs font-bold text-violet/70">
                <ArrowRightLeft size={12} /> Skill Swap: {activeChat.skill}
              </span>
            </div>

            {activeChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[75%] ${
                  msg.sender === 'me' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`rounded-2xl p-4 text-sm shadow-sm ${
                    msg.sender === 'me'
                      ? 'bg-gradient-to-br from-violet to-electric text-white rounded-tr-md'
                      : 'bg-white border border-ink/5 text-ink rounded-tl-md'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-[10px] text-ink/30 font-bold uppercase tracking-wide mt-1.5 px-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-ink/5 bg-white flex gap-3 shrink-0">
            <button
              type="button"
              className="p-2.5 text-ink/40 hover:text-ink hover:bg-surface rounded-xl transition"
            >
              <Smile size={20} />
            </button>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeChat.name}...`}
              className="flex-1 rounded-2xl bg-surface px-4 py-2.5 text-sm outline-none placeholder-ink/35 focus:ring-2 focus:ring-violet/20 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 bg-gradient-to-r from-violet to-electric text-white rounded-2xl hover:shadow-glow transition shadow-sm disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
