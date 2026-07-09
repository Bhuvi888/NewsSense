import {
  Menu,
  Home,
  Compass,
  Newspaper,
  Sparkles,
  Star,
  MapPin,
  Globe,
  Briefcase,
  Cpu,
  Beaker,
  Trophy,
  Film,
  Activity,
  Bookmark,
  List
} from "lucide-react";
import { NavLink, useLocation, useSearchParams } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");
  const isSavedOnly = searchParams.get("saved") === "true";

  // Menu navigation links
  const menuItems = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "Explore", icon: Compass, path: "/explore" },
    { name: "Sources", icon: Newspaper, path: "/sources" },
    { name: "Ask AI", icon: Sparkles, path: "/ask-ai" }
  ];

  // Topic filters (Navigates to /explore with category query)
  const topics = [
    { name: "Top Stories", icon: Star, category: "top" },
    { name: "India", icon: MapPin, category: "India" },
    { name: "World", icon: Globe, category: "World" },
    { name: "Business", icon: Briefcase, category: "Business" },
    { name: "Technology", icon: Cpu, category: "Technology" },
    { name: "Science", icon: Beaker, category: "Science" },
    { name: "Sports", icon: Trophy, category: "Sports" },
    { name: "Entertainment", icon: Film, category: "Entertainment" },
    { name: "Health", icon: Activity, category: "Health" }
  ];

  // Helper to check if a navigation item is active
  const isMenuLinkActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" && !activeCategory && !isSavedOnly;
    }
    return location.pathname === path && !activeCategory && !isSavedOnly;
  };

  return (
    <aside className="w-[260px] min-w-[260px] border-r border-[var(--border)] bg-[var(--surface)] flex flex-col h-screen sticky top-0 overflow-y-auto select-none">
      {/* Brand Header block */}
      <div className="px-6 py-6 border-b border-[var(--border)]/40">
        <div className="flex items-center gap-3">
          <button className="text-[var(--headline)] hover:text-[var(--accent)] transition cursor-pointer" aria-label="Menu">
            <Menu size={22} strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="font-serif text-2xl font-extrabold tracking-tight text-[var(--headline)]">
              Newsense
            </h1>
            <p className="text-[9px] font-bold text-neutral-500 mt-0.5 tracking-widest uppercase">
              AI-Powered News Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isMenuLinkActive(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3.5 rounded px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                isActive
                  ? "bg-[#EFEAE2] text-[var(--headline)] border-l-2 border-[var(--accent)] pl-2.5"
                  : "text-neutral-600 hover:bg-[#F5EFE4] hover:text-[var(--headline)] hover:pl-[18px]"
              }`}
            >
              <Icon size={16} strokeWidth={2.5} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Topics Section */}
      <div className="px-3 pt-2">
        <h3 className="px-3.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Topics
        </h3>
        <div className="mt-2 space-y-0.5">
          {topics.map((topic) => {
            const Icon = topic.icon;
            const isActive =
              topic.category === "top"
                ? (location.pathname === "/explore" || location.pathname === "/") && !activeCategory && !isSavedOnly
                : activeCategory?.toLowerCase() === topic.category.toLowerCase();

            const linkPath =
              topic.category === "top"
                ? "/explore"
                : `/explore?category=${topic.category}`;

            return (
              <NavLink
                key={topic.name}
                to={linkPath}
                className={`flex items-center gap-3.5 rounded px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#EFEAE2] text-[var(--headline)] font-semibold border-l-2 border-[var(--accent)] pl-2.5"
                    : "text-neutral-600 hover:bg-[#F5EFE4] hover:text-[var(--headline)] hover:pl-[18px]"
                }`}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className="text-neutral-500" />
                <span>{topic.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Saved Section */}
      <div className="px-3 pt-6 pb-6">
        <h3 className="px-3.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Saved
        </h3>
        <div className="mt-2 space-y-0.5">
          <NavLink
            to="/explore?saved=true"
            className={`flex items-center gap-3.5 rounded px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
              isSavedOnly
                ? "bg-[#EFEAE2] text-[var(--headline)] font-semibold border-l-2 border-[var(--accent)] pl-2.5"
                : "text-neutral-600 hover:bg-[#F5EFE4] hover:text-[var(--headline)] hover:pl-[18px]"
            }`}
          >
            <Bookmark size={15} strokeWidth={isSavedOnly ? 2.5 : 2} className="text-neutral-500" />
            <span>Saved Articles</span>
          </NavLink>
          <NavLink
            to="/explore?readingList=true"
            className={`flex items-center gap-3.5 rounded px-3.5 py-2 text-xs font-medium transition-all duration-200 ${
              searchParams.get("readingList") === "true"
                ? "bg-[#EFEAE2] text-[var(--headline)] font-semibold border-l-2 border-[var(--accent)] pl-2.5"
                : "text-neutral-600 hover:bg-[#F5EFE4] hover:text-[var(--headline)] hover:pl-[18px]"
            }`}
          >
            <List size={15} strokeWidth={2} className="text-neutral-500" />
            <span>Reading List</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}