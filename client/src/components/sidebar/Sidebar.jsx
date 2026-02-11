import SidebarHeader from "./SidebarHeader";
import SearchBar from "./Searchbar";
import ChatList from "./ChatList";

const Sidebar = () => {
  return (
    <div style={{ width: "30%", borderRight: "1px solid #2a2a2a" }}>
      <SidebarHeader />
      <SearchBar />
      <ChatList />
    </div>
  );
};

export default Sidebar;
