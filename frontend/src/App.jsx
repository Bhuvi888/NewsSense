import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";

import Dashboard from "./pages/Dashboard";
import Explore from "./pages/Explore";
import Sources from "./pages/Sources";
import AskAI from "./pages/AskAI";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/ask-ai" element={<AskAI />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}