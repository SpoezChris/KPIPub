// api/winrate.js – Serverless proxy (token hidden in env vars)
export default async function handler(req, res) {
  try {
    const NOTION_TOKEN = process.env.NOTION_TOKEN; // Hidden!
    const DATABASE_ID = process.env.DATABASE_ID;   // Hidden too
    const PROPERTY_NAME = process.env.PROPERTY_NAME || "Win Rate";

    if (!NOTION_TOKEN || !DATABASE_ID) {
      return res.status(500).json({ error: "Missing env vars" });
    }

    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ page_size: 1 })
    });

    if (!response.ok) {
      throw new Error(`Notion error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("No data");
    }

    const page = data.results[0];
    const value = page.properties[PROPERTY_NAME]?.formula?.number
               ?? page.properties[PROPERTY_NAME]?.number
               ?? page.properties[PROPERTY_NAME]?.rollup?.number
               ?? page.properties[PROPERTY_NAME]?.percentage
               ?? 0;
    const percent = Math.round(value * 100);

    res.status(200).json({ winrate: percent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ winrate: null });
  }
}
