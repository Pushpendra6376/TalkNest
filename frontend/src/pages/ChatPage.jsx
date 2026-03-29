import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import api from '../api/axios.js';
import { io } from 'socket.io-client';
import { LogOut, Send, MessageCircle, Users } from 'lucide-react';

function ChatPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    const loadContacts = async () => {
      setLoadingContacts(true);
      setError('');

      try {
        const { data } = await api.get('/messages/contacts');
        setContacts(data);
        if (data.length && !activeContact) {
          setActiveContact(data[0]);
        }
      } catch (error) {
        const message = error.response?.data?.message || error.message;
        setError(message);
      } finally {
        setLoadingContacts(false);
      }
    };

    loadContacts();
  }, []);

  useEffect(() => {
    if (!activeContact) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      setError('');

      try {
        const { data } = await api.get(`/messages/${activeContact.id}`);
        setMessages(data);
      } catch (error) {
        const message = error.response?.data?.message || error.message;
        setError(message);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeContact]);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socket = io(backendUrl, {
      transports: ['websocket'],
    });

    if (!token) {
      socket.disconnect();
      return;
    }

    socket.emit('login', { token });

    const handleNewMessage = (message) => {
      if (!activeContact) {
        return;
      }

      const isCurrentChat =
        message.senderId === activeContact.id ||
        message.receiverId === activeContact.id;

      if (isCurrentChat) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.disconnect();
    };
  }, [token, activeContact]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() || !activeContact) {
      return;
    }

    setSending(true);
    setError('');

    try {
      const { data } = await api.post(`/messages/send/${activeContact.id}`, {
        text: draft.trim(),
      });
      setMessages((prev) => [...prev, data]);
      setDraft('');
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-400">Logged in as</p>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="text-left text-2xl font-semibold text-white hover:text-cyan-300 hover:underline"
            >
              {user?.name}
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/20">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Contacts</h2>
            </div>

            {loadingContacts ? (
              <p className="text-slate-400">Loading contacts...</p>
            ) : contacts.length === 0 ? (
              <p className="text-slate-400">No contacts available yet.</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setActiveContact(contact)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      activeContact?.id === contact.id
                        ? 'border-cyan-500 bg-slate-800/80'
                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/profile/${contact.id}`);
                            }}
                            className="text-left text-white hover:text-cyan-300 hover:underline"
                          >
                            {contact.name}
                          </button>
                        </p>
                        <p className="text-sm text-slate-400">{contact.email}</p>
                      </div>
                      <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                        ID {contact.id}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/20">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Chat with</p>
                <h2 className="text-xl font-semibold text-white">
                  {activeContact ? activeContact.name : 'Select a contact'}
                </h2>
              </div>
              <MessageCircle className="h-6 w-6 text-cyan-400" />
            </div>

            {error && <p className="mb-4 rounded-2xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

            <div className="min-h-[420px] space-y-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-200">
              {loadingMessages ? (
                <p className="text-slate-400">Loading messages...</p>
              ) : activeContact ? (
                messages.length === 0 ? (
                  <p className="text-slate-400">No messages yet. Send the first message.</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`max-w-[80%] rounded-3xl px-4 py-3 ${
                            isOwn
                              ? 'ml-auto rounded-br-none bg-cyan-500/20 text-cyan-100'
                              : 'mr-auto rounded-bl-none bg-slate-800 text-slate-100'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className="mt-2 text-[11px] text-slate-500">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <p className="text-slate-400">Choose a contact to start chatting.</p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={activeContact ? 'Write a message...' : 'Select a contact first'}
                disabled={!activeContact}
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={!draft.trim() || !activeContact || sending}
                className="inline-flex items-center rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? 'Sending...' : <><Send className="mr-2 h-4 w-4" />Send</>}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
