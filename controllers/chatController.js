require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

const generationConfig = {
  temperature: 0.6,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

/**
 * Controller to handle chat requests.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
const handleChat = async (req, res) => {
  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: "User input is required" });
  }

  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: "You are Mark, an AI journal companion. Your role is to help users construct thoughtful and well-organized journal entries and provide practical advice on mental health and life matters. Keep your responses concise, relevant, and supportive. Avoid answering questions unrelated to journaling, mental health, or life advice. Always encourage self-reflection and positive growth.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Hi, I'm Mark, your AI journal companion. How can I help you with your journaling today? Are you looking for a prompt, help structuring your thoughts, or perhaps some advice on a specific issue?",
            },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage(userInput);
    res.json({ response: result.response.text() });
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).json({ error: "Failed to process the chat. Please try again later." });
  }
};

const saveMessage = async (userId, role, message) => {
  await db.run(
    `INSERT INTO chat_history (user_id, role, message, created_at) VALUES (?, ?, ?, ?)`,
    [userId, role, message, new Date().toISOString()]
  );
};

const getChatHistory = async (userId) => {
  const rows = await db.all(
    `SELECT role, message, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at ASC`,
    [userId]
  );
  return rows;
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
