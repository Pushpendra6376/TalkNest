import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import api from '../api/axios.js';
import { io } from 'socket.io-client';
import { LogOut } from 'lucide-react';
import ChatSidebar from '../components/ChatSidebar.jsx';
import ChatWindow from '../components/ChatWindow.jsx';

function ChatPage() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [selectedMediaFile, setSelectedMediaFile] = useState(null);
  const [selectedMediaPreview, setSelectedMediaPreview] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState('photo');
  const [selectedMediaName, setSelectedMediaName] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  const loadChatPartners = async () => {
    setLoadingContacts(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const { data } = await api.get('/messages/chats');
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

  useEffect(() => {
    loadChatPartners();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setSearchError('');
    setSearchResults([]);

    if (!query) {
      loadChatPartners();
      return;
    }

    setSearching(true);
    try {
      const { data } = await api.get(`/user/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data.users);
      if (data.users.length && !activeContact) {
        setActiveContact(data.users[0]);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setSearchError('User not found.');
      } else {
        setSearchError(error.response?.data?.message || error.message);
      }
    } finally {
      setSearching(false);
    }
  };

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
    const backendUrl = import.meta.env.VITE_API_URL || window.location.origin;
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

  const handleMediaSelect = (file, mediaType) => {
    const maxFileSize = 50 * 1024 * 1024;
    if (file.size > maxFileSize) {
      setError('File too large. Maximum allowed size is 50MB.');
      return;
    }

    if (selectedMediaPreview) {
      URL.revokeObjectURL(selectedMediaPreview);
    }

    setSelectedMediaFile(file);
    setSelectedMediaPreview(URL.createObjectURL(file));
    setSelectedMediaType(mediaType);
    setSelectedMediaName(file.name);
    setError('');
  };

  const handleRemoveMedia = () => {
    if (selectedMediaPreview) {
      URL.revokeObjectURL(selectedMediaPreview);
    }
    setSelectedMediaFile(null);
    setSelectedMediaPreview('');
    setSelectedMediaType('photo');
    setSelectedMediaName('');
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!draft.trim() && !selectedMediaFile) {
      return;
    }
    if (!activeContact) {
      return;
    }

    setSending(true);
    setError('');

    try {
      let response;
      if (selectedMediaFile) {
        const formData = new FormData();
        if (draft.trim()) {
          formData.append('text', draft.trim());
        }
        formData.append('media', selectedMediaFile);
        formData.append('mediaType', selectedMediaType);

        response = await api.post(`/messages/send/${activeContact.id}`, formData);
      } else {
        response = await api.post(`/messages/send/${activeContact.id}`, {
          text: draft.trim() || null,
        });
      }

      setMessages((prev) => [...prev, response.data]);
      setDraft('');
      handleRemoveMedia();
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
          <ChatSidebar
            contacts={contacts}
            activeContact={activeContact}
            setActiveContact={setActiveContact}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            searchError={searchError}
            searching={searching}
            searchResults={searchResults}
            loadingContacts={loadingContacts}
            onOpenProfile={(id) => navigate(`/profile/${id}`)}
          />

          <ChatWindow
            activeContact={activeContact}
            error={error}
            loadingMessages={loadingMessages}
            messages={messages}
            user={user}
            draft={draft}
            setDraft={setDraft}
            handleSendMessage={handleSendMessage}
            sending={sending}
            selectedMediaPreview={selectedMediaPreview}
            selectedMediaType={selectedMediaType}
            selectedMediaName={selectedMediaName}
            onMediaSelect={handleMediaSelect}
            onRemoveMedia={handleRemoveMedia}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;
