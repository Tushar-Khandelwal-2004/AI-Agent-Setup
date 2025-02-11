// server.js
import express from "express";
import { getAIResponse } from "./index2.js";

const app = express();
app.use(express.json());

app.post("/query", async (req, res) => {
  const { query } = req.body;
  console.log("Received query:", query);

  try {
    const aiResponse = await getAIResponse(query);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ error: "Failed to process the request." });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));