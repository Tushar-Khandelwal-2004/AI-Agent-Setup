import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;

async function getHaiku() {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: "what is the temperature of delhi" }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // console.log("Full API Response:", JSON.stringify(response.data, null, 2));

    const haiku = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!haiku) {
      throw new Error("Unexpected API response structure");
    }

    console.log("Generated Haiku:\n", haiku.trim());
  } catch (error) {
    if (error.response) {
      // Server responded with an error status code
      if (error.response.status === 429) {
        console.error("❌ Quota Exceeded or Rate Limit Hit. Check your usage.");
      } else {
        console.error("API Error:", error.response.data.error.message);
      }
    } else if (error.request) {
      // No response from the server
      console.error("No response from the API. Check your network connection.");
    } else {
      // Other errors
      console.error("Error:", error.message);
    }
  }
}

getHaiku();
