// index.js (LLM Logic)
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

export async function getAIResponse(userInput) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{ role: "user", parts: [{ text: userInput }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const aiMessage = response.data.candidates[0]?.content?.parts[0]?.text;
    return aiMessage?.trim() || "No response received.";
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    return "Error occurred while processing your request.";
  }
}
