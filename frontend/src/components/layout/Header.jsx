import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  // Sync search input with URL search parameters
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate("/explore");
    }
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] select-none">
      {/* Brand & Search Row using grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 items-center px-8 py-5">
        {/* Left Spacer Column */}
        <div className="hidden md:block"></div>

        {/* Centered Brand Title */}
        <div className="flex justify-center text-center">
          <h1 className="font-serif text-5xl font-extrabold tracking-tight text-[var(--headline)] leading-none select-none">
            Newsense
          </h1>
        </div>

        {/* Search Bar on the Right */}
        <div className="flex justify-end w-full">
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs flex items-center">
            <input
              type="text"
              placeholder="Search news, topics or sources..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full rounded-sm border border-[var(--border)] bg-transparent py-1.5 pl-3 pr-9 text-xs text-[var(--headline)] placeholder-[#8C8476] outline-none transition duration-150 focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[var(--accent)] transition cursor-pointer"
              aria-label="Search"
            >
              <Search size={14} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>

      {/* Subheader info bar - Styled with premium double print borders */}
      <div className="border-t-4 border-b-4 border-double border-[var(--border)] px-8 py-2.5 flex justify-between items-center text-[10px] tracking-widest text-neutral-600 font-bold uppercase select-none">
        <div>Stay Informed. Stay Ahead.</div>
        <div className="font-serif font-extrabold text-sm text-[var(--headline)] tracking-normal normal-case">
          {todayStr}
        </div>
        <div className="flex items-center gap-1 cursor-pointer transition hover:text-[var(--accent)] border border-transparent hover:border-[var(--border)] px-2 py-0.5 rounded-sm">
          <span>Edition: India</span>
          <span className="text-[8px] translate-y-[0.5px]">▼</span>
        </div>
      </div>
    </header>
  );
}