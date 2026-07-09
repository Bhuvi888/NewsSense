import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-[var(--paper)] font-sans antialiased text-[var(--headline)]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="px-8 py-6 flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}