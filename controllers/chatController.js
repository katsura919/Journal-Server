require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

/** Initialize the Gemini SDK with the API key. */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/** Initialize the Gemini model. */
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Controller for handling normal chat (non-streaming).
 * Processes a chat message and history, then returns the model's response.
 */
const handleChat = async (req, res) => {
    try {
      const chatHistory = req.body.history || [];
      const msg = req.body.chat;
  
      /** Initialize chat with the given history. */
      const chat = model.startChat({ history: chatHistory });
  
      /** Send message to the model and retrieve the response. */
      const result = await chat.sendMessage(msg);
      const response = await result.response;
      const text = response.text();
  
      res.status(200).json({ text });
    } catch (error) {
      console.error("Error in handleChat:", error.message);
      res.status(500).json({ error: "Failed to process the chat message." });
    }
  };
  

/**
 * Controller for handling streaming chat.
 * Streams the model's response as chunks for a given chat message and history.
 */
const handleStream = async (req, res) => {
  try {
    const chatHistory = req.body.history || [];
    const msg = req.body.chat;

    /** Initialize chat with the given history. */
    const chat = model.startChat({ history: chatHistory });

    /** Stream the response chunks back to the client. */
    const result = await chat.sendMessageStream(msg);
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      res.write(chunkText);
    }
    res.end();
  } catch (error) {
    console.error("Error in handleStream:", error.message);
    res.status(500).json({ error: "Failed to stream the chat response." });
  }
};

module.exports = {
  handleChat,
  handleStream,
};
