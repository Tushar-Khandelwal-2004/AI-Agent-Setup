// index2.js
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are a helpful assistant. If a user's query is ambiguous, vague, or missing essential details, ask a single follow-up question. Start clarification requests with 'CLARIFICATION_NEEDED:' exactly. Examples:

- User: 'What is the capital?'
  Assistant: 'CLARIFICATION_NEEDED: Which country's capital are you interested in?'

- User: 'Analyze market trends.'
  Assistant: 'CLARIFICATION_NEEDED: Could you specify the industry and time frame for this market analysis?'

For clear queries, provide a normal response without the CLARIFICATION_NEEDED prefix.`;

const ROLES = {
  USER: "user",
  MODEL: "model" // Changed from "assistant" to "model"
};

function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

export async function getAIResponse(userInput, conversationHistory = []) {
  try {
    let formattedHistory = [
      { role: ROLES.USER, parts: [{ text: SYSTEM_PROMPT }] },
      { role: ROLES.MODEL, parts: [{ text: "Understood. I will ask clarifying questions when needed." }] },
      ...conversationHistory
        .filter((msg) => isValidRole(msg.role))
        .map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }]
        }))
    ];

    const contents = [
      ...formattedHistory,
      { role: ROLES.USER, parts: [{ text: userInput }] }
    ];

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      { contents },
      { headers: { "Content-Type": "application/json" } }
    );

    const aiMessage = response.data.candidates[0]?.content?.parts[0]?.text?.trim() || "No response received.";

    const newHistory = [
      ...conversationHistory.filter((msg) => isValidRole(msg.role)),
      { role: ROLES.USER, content: userInput },
      { role: ROLES.MODEL, content: aiMessage }
    ];

    if (aiMessage.startsWith("CLARIFICATION_NEEDED:")) {
      return {
        followUpRequired: true,
        clarification: aiMessage.replace("CLARIFICATION_NEEDED:", "").trim(),
        conversationHistory: newHistory
      };
    }

    return {
      followUpRequired: false,
      response: aiMessage,
      conversationHistory: newHistory
    };
  } catch (error) {
    console.error("❌ Error Details:", error);
    if (error.response) {
      console.error("❌ Response Data:", error.response.data);
      console.error("❌ Status Code:", error.response.status);
      console.error("❌ Headers:", error.response.headers);
    } else if (error.request) {
      console.error("❌ No response received:", error.request);
    } else {
      console.error("❌ Error setting up request:", error.message);
    }

    return {
      followUpRequired: false,
      response: `Error occurred while processing your request. ${error.response?.data?.error?.message || error.message}`,
      conversationHistory: [
        ...conversationHistory.filter((msg) => isValidRole(msg.role)),
        { role: ROLES.USER, content: userInput }
      ]
    };
  }
}
