/**
 * Helper to resolve high-quality thematic image URLs from Unsplash
 * based on article titles, summaries, and categories.
 */
export function getArticleImage(article) {
  if (!article) return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=85";

  const title = (article.title || "").toLowerCase();
  const category = (article.category || "").toLowerCase();
  const summary = (article.summary || "").toLowerCase();

  // 1. ISRO / Space / Satellite Launches
  if (
    title.includes("isro") ||
    title.includes("satellite") ||
    title.includes("space") ||
    title.includes("launch") ||
    title.includes("rocket") ||
    title.includes("pslv") ||
    title.includes("eos")
  ) {
    return "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800&q=85";
  }

  // 2. RBI / Repo Rate / Stocks / Finance / Nifty / Crore
  if (
    title.includes("rbi") ||
    title.includes("repo rate") ||
    title.includes("nifty") ||
    title.includes("stock") ||
    title.includes("market") ||
    title.includes("crore") ||
    title.includes("rupee") ||
    title.includes("finance") ||
    title.includes("economy") ||
    title.includes("bank") ||
    title.includes("clash") // Thiruvananthapuram clashes
  ) {
    if (title.includes("rbi") || title.includes("repo rate")) {
      // Currency / Finance
      return "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=85";
    }
    if (title.includes("nifty") || title.includes("stock") || title.includes("market")) {
      // Stock chart
      return "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=85";
    }
    return "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=85";
  }

  // 3. Trade / FTA / negotiations / EU / international relations
  if (
    title.includes("fta") ||
    title.includes("negotiat") ||
    title.includes("trade") ||
    title.includes("eu ") ||
    title.includes("union")
  ) {
    return "https://images.unsplash.com/photo-1521791136364-7286472b5399?auto=format&fit=crop&w=800&q=85";
  }

  // 4. Monsoon / Rain / Flooding
  if (
    title.includes("monsoon") ||
    title.includes("rain") ||
    title.includes("flood") ||
    title.includes("weather") ||
    title.includes("water resources")
  ) {
    return "https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=800&q=85";
  }

  // 5. Arrest / Vandalism / Crime / Law / Police
  if (
    title.includes("arrest") ||
    title.includes("vandalism") ||
    title.includes("police") ||
    title.includes("court") ||
    title.includes("law") ||
    title.includes("clash") ||
    title.includes("sentenced")
  ) {
    return "https://images.unsplash.com/photo-1505664194762-819975b1457a?auto=format&fit=crop&w=800&q=85";
  }

  // 6. Heatwave / Temperature / Summer / Climate
  if (
    title.includes("heatwave") ||
    title.includes("temperature") ||
    title.includes("degrees") ||
    title.includes("celcius") ||
    title.includes("weather") ||
    title.includes("summer")
  ) {
    return "https://images.unsplash.com/photo-1504370805625-d32c54b16100?auto=format&fit=crop&w=800&q=85";
  }

  // 7. Water Extraction / River / Lakes
  if (
    title.includes("groundwater") ||
    title.includes("water") ||
    title.includes("river") ||
    title.includes("lake")
  ) {
    return "https://images.unsplash.com/photo-1562016600-ece13e8ad570?auto=format&fit=crop&w=800&q=85";
  }

  // 8. Drugs / Health / Disease / Medicine / Bio / Vaccine
  if (
    title.includes("drug") ||
    title.includes("health") ||
    title.includes("medicine") ||
    title.includes("doctor") ||
    title.includes("hospital") ||
    title.includes("virus") ||
    title.includes("disease")
  ) {
    return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=85";
  }

  // 9. Default category fallbacks
  if (category === "india") {
    // Elegant Indian scenery/monument
    return "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=85";
  }
  if (category === "technology" || category === "tech") {
    // Tech motherboard/circuit
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=85";
  }
  if (category === "world") {
    // Earth from space
    return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=85";
  }

  // Default fallback image (newspaper/press)
  return "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=85";
}
