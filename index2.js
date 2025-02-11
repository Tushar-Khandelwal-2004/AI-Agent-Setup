// index.js (LLM Logic)
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

export async function getAIResponse(userInput, conversationHistory = []) {
  try {
    // Add the new user input to the conversation history
    conversationHistory.push({ role: "user", content: userInput });

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: conversationHistory.map((msg) => ({ role: msg.role, parts: [{ text: msg.content }] })),
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const aiMessage = response.data.candidates[0]?.content?.parts[0]?.text;

    // Add AI response to the conversation history
    conversationHistory.push({ role: "assistant", content: aiMessage?.trim() || "No response received." });

    // Dynamic clarification checks
    const incompleteQueries = [
      {
        pattern: /capital of\s*\?*$/i,
        clarification: "Could you specify the country you are asking about?",
      },
      {
        pattern: /market trends/i,
        clarification: "Which industry and country are you referring to for market trends?",
      },
    ];

    for (const query of incompleteQueries) {
      if (query.pattern.test(userInput)) {
        return {
          followUpRequired: true,
          clarificationQuestion: query.clarification,
          conversationHistory,
        };
      }
    }

    return {
      followUpRequired: false,
      response: aiMessage?.trim() || "No response received.",
      conversationHistory,
    };
  } catch (error) {
    console.error("❌ Error Details:", error); // Detailed error logging
    console.error("❌ Response Data:", error.response?.data); // API response data
    console.error("❌ Request Config:", error.config); // Request configuration

    return {
      followUpRequired: false,
      response: "Error occurred while processing your request.",
      conversationHistory,
    };
  }
} 
