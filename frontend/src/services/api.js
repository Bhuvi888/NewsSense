import axios from "axios";

const apiInstance = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// A helper to generate a stable numeric hash from a string
const stringHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

// Generates a consistent aesthetic color based on the publisher's name
const getSourceColor = (name) => {
  const colors = [
    "#8B1E1E", // Deep Red
    "#0E3957", // Deep Blue
    "#BB1919", // Red
    "#02B875", // Tech Green
    "#E5127D", // Magenta
    "#0B66C3", // Blue
    "#7C3AED", // Violet
    "#EA580C", // Orange
  ];
  const index = Math.abs(stringHash(name)) % colors.length;
  return colors[index];
};

// Generates a consistent, realistic followers count based on the publisher's name
const getSourceFollowers = (name) => {
  const h = Math.abs(stringHash(name));
  return (h % 900) * 5000 + 150000; // Between 150k and 4.6M followers
};

const api = {
  // Forward core methods of axios
  get: (url, config) => apiInstance.get(url, config),
  post: (url, data, config) => apiInstance.post(url, data, config),
  put: (url, data, config) => apiInstance.put(url, data, config),
  delete: (url, config) => apiInstance.delete(url, config),

  // Retrieve categories and map to simple strings array for TopicChips
  getTopics: async () => {
    try {
      const { data } = await apiInstance.get("/news/topics");
      return data.map((item) => item.topic);
    } catch (err) {
      console.error("Failed to fetch topics:", err);
      return ["India", "World", "Technology", "Business", "Science"];
    }
  },

  // Retrieve publisher catalog and enrich dynamically with generated metadata
  getSources: async () => {
    try {
      const { data } = await apiInstance.get("/news/sources");
      const followed = localStorage.getItem("newsense_followed_sources");
      const followedList = followed ? JSON.parse(followed) : ["the-hindu", "bbc-news"];

      return data.map((item, index) => {
        const name = item.source;
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

        return {
          id: id,
          name: name,
          logo: getSourceColor(name),
          description: `A media outlet providing daily news bulletins, in-depth reports, and coverage concerning recent developments in ${name}.`,
          followers: getSourceFollowers(name),
          articlesCount: item.article_count || 0,
          latestArticle: item.latest_article,
          isFollowing: followedList.includes(id),
        };
      });
    } catch (err) {
      console.error("Failed to fetch sources:", err);
      return [];
    }
  },

  // Follow/unfollow media sources tracker using localStorage
  toggleFollowSource: async (id) => {
    // Simulate short network delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    const followed = localStorage.getItem("newsense_followed_sources");
    let followedList = followed ? JSON.parse(followed) : ["the-hindu", "bbc-news"];

    if (followedList.includes(id)) {
      followedList = followedList.filter((x) => x !== id);
    } else {
      followedList.push(id);
    }
    localStorage.setItem("newsense_followed_sources", JSON.stringify(followedList));

    return {
      id: id,
      isFollowing: followedList.includes(id),
    };
  },

  // Simulated AI RAG search responder using news database keywords
  askAI: async (text, messages) => {
    // Simulate thinking delay
    await new Promise((resolve) => setTimeout(resolve, 900));

    const query = (text || "").toLowerCase();
    let responseText = "";

    if (query.includes("summarize") || query.includes("news") || query.includes("today")) {
      responseText = "Here is a summary of the latest news intel in our network:\n\n" +
        "• **National Development**: Diverse updates are recorded under India news topics in the database including agricultural and local government updates.\n" +
        "• **World Affairs**: International news coverage spans BBC reports and global policy briefings.\n" +
        "• **Technology**: Recent bulletins capture shifts in the tech sector, startup profiles from TechCrunch, and hardware trends in The Verge.";
    } else if (query.includes("agentic ai") || query.includes("agentic") || query.includes("antigravity")) {
      responseText = "Agentic AI refers to systems that do not just process prompts, but autonomously formulate plans, use developer tools, handle task lists (like `task.md`), and execute workflows to solve complex user challenges. My framework leverages agentic coding to pair-program and redesign platforms efficiently.";
    } else if (query.includes("exoplanet") || query.includes("planet") || query.includes("discover")) {
      responseText = "Astronomers have recently detected TOI-715 b, a super-Earth exoplanet located 137 light-years away. Orbiting inside its star's habitable zone, it takes only 19 days to complete a year, making it a high-priority target for atmospheric exploration using the James Webb Space Telescope.";
    } else if (query.includes("inflation") || query.includes("repo") || query.includes("interest")) {
      responseText = "In core financial news, central banking authorities decide policy interest rates to align inflation targets while fostering growth. You can browse Business and India categories in the Explore section to view the latest market data.";
    } else {
      responseText = `Based on your request, I searched our news intelligence database. The system highlights recent activity in trade relations, and regional reports indicating monsoon onset in Kerala and temperature variations in Telangana. Let me know if you would like me to deep-dive into any of these areas.`;
    }

    return {
      role: "assistant",
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  },
};

export default api;