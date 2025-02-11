// server.js
import express from "express";
import { getAIResponse } from "./index2.js";

const app = express();
app.use(express.json());

// Conversation store with TTL (60 minutes)
const userConversations = new Map();

app.post("/query", async (req, res) => {
  const { userId, query } = req.body;
  
  if (!userId || !query) {
    return res.status(400).json({ error: "Both userId and query are required." });
  }

  try {
    // Retrieve or initialize conversation history
    const conversation = userConversations.get(userId) || [];
    
    // Prevent duplicate consecutive messages
    const lastMessage = conversation[conversation.length - 1];
    if (lastMessage?.content === query) {
      return res.json({
        response: "Please provide new information or rephrase your question.",
        conversationHistory: conversation
      });
    }

    // Process the query
    const { followUpRequired, clarification, clarificationTemplate, response, conversationHistory } = 
      await getAIResponse(query, conversation);

    // Handle clarification flow
    if (followUpRequired) {
      userConversations.set(userId, conversationHistory);
      return res.json({
        followUpRequired: true,
        clarification,
        conversationHistory
      });
    }

    // Update conversation store
    userConversations.set(userId, conversationHistory);

    // Handle successful response
    res.json({
      response,
      conversationHistory
    });

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
});

// Cleanup old conversations
setInterval(() => {
  const now = Date.now();
  for (const [userId, conversation] of userConversations) {
    if (now - conversation.lastActivity > 3600000) { // 1 hour
      userConversations.delete(userId);
    }
  }
}, 600000); // Run every 10 minutes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));