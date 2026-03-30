import { Users } from 'lucide-react';

function ChatSidebar({
  contacts,
  activeContact,
  setActiveContact,
  searchQuery,
  setSearchQuery,
  handleSearch,
  searchError,
  searching,
  searchResults,
  loadingContacts,
  onOpenProfile,
}) {
  const renderContactRow = (contact) => (
    <div
      key={contact.id}
      role="button"
      tabIndex={0}
      onClick={() => setActiveContact(contact)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setActiveContact(contact);
        }
      }}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        activeContact?.id === contact.id
          ? 'border-cyan-500 bg-slate-800/80'
          : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-xl text-slate-100">
            {contact.profilePic ? (
              <img src={contact.profilePic} alt={contact.name} className="h-full w-full object-cover" />
            ) : (
              <span>{contact.name?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-white">{contact.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenProfile(contact.id);
          }}
          className="text-sm text-slate-400 hover:text-cyan-300"
        >
          Profile
        </button>
      </div>
    </div>
  );

  const list = searchQuery.trim() ? searchResults : contacts;

  return (
    <section className="h-full rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/20">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Chats</h2>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, email or phone"
            className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
        {searchError && <p className="text-sm text-rose-300">{searchError}</p>}
      </div>

      {loadingContacts ? (
        <p className="text-slate-400">Loading chats...</p>
      ) : list.length > 0 ? (
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">{list.map(renderContactRow)}</div>
      ) : searchQuery.trim() ? (
        <p className="text-slate-400">No matching user found.</p>
      ) : (
        <p className="text-slate-400">You have no chats yet. Search for someone to start a conversation.</p>
      )}
    </section>
  );
}

export default ChatSidebar;
