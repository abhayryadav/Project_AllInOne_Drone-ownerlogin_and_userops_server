import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_MATCH_FILE = path.join(__dirname, "../match.txt"); // adjust path

export const checkFileMatch = async (req, res) => {
  console.log("📩 Incoming POST /avm");

  try {
    // Timeout handling
    req.setTimeout(30000, () => {
      console.log("⏰ Request timeout");
      return res.status(408).json({ error: "Request timeout" });
    });

    const { clientFileContent } = req.body;
    if (!clientFileContent) {
      console.log("⚠️ Missing clientFileContent in body");
      return res.status(400).json({ error: "Missing clientFileContent" });
    }

    if (clientFileContent.length > 5_000_000) {
      return res.status(413).json({ error: "File too large" });
    }

    console.log(`📄 Client content length: ${clientFileContent.length}`);

    // Ensure server file exists
    if (!fs.existsSync(SERVER_MATCH_FILE)) {
      console.log("⚠️ match.txt does not exist. Creating default file...");
      fs.writeFileSync(SERVER_MATCH_FILE, "default-content", "utf8");
    }

    let serverContent;
    try {
      serverContent = fs.readFileSync(SERVER_MATCH_FILE, "utf8");
      console.log(`📄 Server content length: ${serverContent.length}`);
    } catch (readErr) {
      console.error("❌ Error reading file:", readErr);
      return res.status(500).json({ error: "Cannot read match.txt" });
    }

    const isMatch = clientFileContent.trim() === serverContent.trim();
    console.log(`✅ Match result: ${isMatch}`);

    return res.json({
      match: isMatch,
      clientLength: clientFileContent.length,
      serverLength: serverContent.length
    });

  } catch (err) {
    console.error("❌ Fatal error in /avm:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const healthCheck = (req, res) => {
  res.send("Server working ✅");
};
