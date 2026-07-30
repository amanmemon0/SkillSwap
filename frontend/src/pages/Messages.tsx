import { useEffect, useRef, useState } from 'react';
import { Send, Smile } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Avatar } from '../components/ui/Primitives';

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
  messages: Message[];
};

const initialChats: Chat[] = [
  {
    id: '1',
    name: 'Meera Iyer',
    avatar: 'M',
    lastMessage: 'Let\'s start this Thursday evening!',
    time: '12m ago',
    unread: true,
    messages: [
      { id: '101', sender: 'them', text: 'Hi! I saw you wanted to learn Spanish. I can help with that!', timestamp: '5:15 PM' },
      { id: '102', sender: 'me', text: 'Awesome! I can teach you React in exchange.', timestamp: '5:18 PM' },
      { id: '103', sender: 'them', text: 'That sounds perfect! Let\'s start this Thursday evening!', timestamp: '5:20 PM' }
    ]
  },
  {
    id: '2',
    name: 'Rohan Kapoor',
    avatar: 'R',
    lastMessage: 'Are weekends better for you?',
    time: '2h ago',
    unread: false,
    messages: [
      { id: '201', sender: 'them', text: 'Hey Rohan here, interested in your UI/UX skill.', timestamp: 'Yesterday' },
      { id: '202', sender: 'me', text: 'Hey Rohan! I\'d love to learn street photography from you.', timestamp: 'Yesterday' },
      { id: '203', sender: 'them', text: 'Are weekends better for you?', timestamp: 'Yesterday' }
    ]
  },
  {
    id: '3',
    name: 'Tara Singh',
    avatar: 'T',
    lastMessage: 'Thanks for the Python class today!',
    time: 'Yesterday',
    unread: false,
    messages: [
      { id: '301', sender: 'me', text: 'Let me know if you need help with Excel.', timestamp: '2 days ago' },
      { id: '302', sender: 'them', text: 'Thanks for the Python class today!', timestamp: 'Yesterday' }
    ]
  }
];

export default function Messages() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = useState('1');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  useEffect(() => {
    // Scroll to bottom of message list on chat switch or new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, chats]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats((current) =>
      current.map((chat) => {
        if (chat.id === activeChatId) {
          return {
            ...chat,
            lastMessage: newMessage.text,
            time: 'Just now',
            unread: false,
            messages: [...chat.messages, newMessage]
          };
        }
        return chat;
      })
    );

    setInputText('');

    // Simulate reply after 1.5 seconds
    setTimeout(() => {
      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'them',
        text: `Thanks for the message! I'll get back to you soon regarding our exchange.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats((current) =>
        current.map((chat) => {
          if (chat.id === activeChatId) {
            return {
              ...chat,
              lastMessage: replyMessage.text,
              time: 'Just now',
              messages: [...chat.messages, replyMessage]
            };
          }
          return chat;
        })
      );
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-ink flex flex-col">
      <Navbar />

      <section className="mx-auto w-full max-w-6xl px-5 pb-12 flex-1 flex flex-col md:flex-row gap-5 h-[calc(100vh-8rem)]">
        {/* Chats Sidebar */}
        <aside className="w-full md:w-80 rounded-3xl bg-white p-4 shadow-sm border border-ink/5 flex flex-col h-full">
          <div className="mb-4">
            <h2 className="font-display text-2xl px-2">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  setChats((current) =>
                    current.map((c) => (c.id === chat.id ? { ...c, unread: false } : c))
                  );
                }}
                className={`w-full flex items-center gap-3 rounded-2xl p-3 text-left transition ${
                  activeChatId === chat.id ? 'bg-ink text-white' : 'hover:bg-[#f7f5f2]'
                }`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-full text-base font-extrabold shadow-sm ${
                  activeChatId === chat.id ? 'bg-mint text-ink' : 'bg-gradient-to-br from-violet to-[#a99eff] text-white'
                }`}>
                  {chat.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline">
                    <span className="font-extrabold text-sm block truncate">{chat.name}</span>
                    <span className={`text-[10px] uppercase font-mono ${
                      activeChatId === chat.id ? 'text-white/60' : 'text-ink/40'
                    }`}>
                      {chat.time}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 truncate ${
                    activeChatId === chat.id ? 'text-white/70' : 'text-ink/55'
                  }`}>
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unread && <span className="h-2 w-2 rounded-full bg-violet animate-pulse" />}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat Window */}
        <section className="flex-1 rounded-3xl bg-white border border-ink/5 shadow-sm flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-ink/5 flex items-center gap-4 bg-white shrink-0">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet to-[#a99eff] text-white text-base font-extrabold shadow-sm">
              {activeChat.avatar}
            </span>
            <div>
              <h3 className="font-display text-lg font-bold">{activeChat.name}</h3>
              <p className="text-xs text-emerald-600 font-bold">Online</p>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#faf9f7]">
            {activeChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[75%] ${msg.sender === 'me' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div
                  className={`rounded-2xl p-4 text-sm ${
                    msg.sender === 'me'
                      ? 'bg-ink text-white rounded-tr-none'
                      : 'bg-white border border-ink/5 text-ink rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
                <span className="text-[10px] text-ink/40 font-bold uppercase tracking-wide mt-1.5 px-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Form */}
          <form onSubmit={handleSend} className="p-4 border-t border-ink/5 bg-white flex gap-3 shrink-0">
            <button
              type="button"
              className="p-2.5 text-ink/45 hover:text-ink hover:bg-[#f7f5f2] rounded-xl transition"
            >
              <Smile size={20} />
            </button>
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Send message to ${activeChat.name}...`}
              className="flex-1 rounded-2xl bg-[#f7f5f2] px-4 py-2 text-sm outline-none placeholder-ink/40 focus:ring-1 focus:ring-violet"
            />
            <button
              type="submit"
              className="p-3 bg-violet text-white rounded-2xl hover:bg-ink transition shadow-sm"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
