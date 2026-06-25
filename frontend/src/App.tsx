import { useQuery } from "@tanstack/react-query";

type HealthResponse = {
  status: string;
  service: string;
};

async function getHealth(): Promise<HealthResponse> {
  const response = await fetch("http://127.0.0.1:8000/api/health");

  if (!response.ok) {
    throw new Error("Unable to connect to Newsense API");
  }

  return response.json();
}

function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
  });

  return (
    <main className="min-h-screen bg-[#0b0d10] px-6 py-12 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <p className="mb-3 text-sm font-medium tracking-[0.2em] text-cyan-400">
          AI NEWS INTELLIGENCE
        </p>

        <h1 className="text-5xl font-bold tracking-tight">Newsense</h1>

        <p className="mt-4 max-w-xl text-lg text-slate-400">
          Discover, search, and ask grounded questions about the news that
          matters.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <p className="text-sm text-slate-400">Backend connection</p>

          {isLoading && (
            <p className="mt-2 text-yellow-300">Connecting to API...</p>
          )}

          {isError && (
            <p className="mt-2 text-red-400">
              API is not running. Start the FastAPI backend on port 8000.
            </p>
          )}

          {data && (
            <p className="mt-2 text-emerald-400">
              Connected: {data.service} ({data.status})
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
