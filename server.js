// server.js
import express from "express";
import { getAIResponse } from "./index2.js";

const app = express();
app.use(express.json());

// Store conversation history per user
const userConversations = {};

app.post("/query", async (req, res) => {
  const { userId, query } = req.body;
  console.log("Received query:", query);

  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  // Initialize conversation history for new users
  if (!userConversations[userId]) {
    userConversations[userId] = [];
  }

  try {
    const conversationHistory = userConversations[userId];

    // Prevent adding duplicate consecutive user inputs
    if (
      conversationHistory.length === 0 ||
      conversationHistory[conversationHistory.length - 1].content !== query
    ) {
      conversationHistory.push({ role: "user", content: query });
    }

    // Check if this is a clarification for a previous incomplete question
    let combinedQuery = query;
    if (conversationHistory.length >= 2) {
      const lastAssistantMessage = conversationHistory[conversationHistory.length - 2];

      if (
        lastAssistantMessage.role === "assistant" &&
        lastAssistantMessage.content.toLowerCase().includes("specify the country")
      ) {
        // Combine clarification with the original question
        combinedQuery = `What is the capital of ${query}?`;
      }
    }

    console.log("Sending combinedQuery to AI:", combinedQuery);
    console.log("Conversation History:", conversationHistory);

    // Send full conversation history with combined query
    const aiResponse = await getAIResponse(combinedQuery, conversationHistory);

    console.log("AI Response:", aiResponse);

    // Update conversation history with latest response
    userConversations[userId] = aiResponse.conversationHistory;

    // Check for follow-up requirements
    if (aiResponse.followUpRequired) {
      return res.json({
        response: {
          followUpRequired: true,
          clarificationQuestion: aiResponse.clarificationQuestion,
          conversationHistory: userConversations[userId],
        },
      });
    }

    // Add AI response to conversation history if it's valid
    if (aiResponse.response && aiResponse.response !== "No response received.") {
      conversationHistory.push({ role: "assistant", content: aiResponse.response });
    } else {
      return res.json({
        response: {
          followUpRequired: false,
          response: "I'm sorry, I couldn't find the information you needed. Could you clarify your question?",
          conversationHistory: userConversations[userId],
        },
      });
    }

    res.json({
      response: {
        followUpRequired: false,
        response: aiResponse.response,
        conversationHistory: userConversations[userId],
      },
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    console.error("❌ Error Message:", error.message);
    if (error.response) {
      console.error("❌ Response Data:", error.response.data);
      console.error("❌ Response Status:", error.response.status);
      console.error("❌ Response Headers:", error.response.headers);
    }
    res.status(500).json({
      error: "Failed to process the request.",
      details: error.response?.data || error.message,
      stack: error.stack,
    });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
