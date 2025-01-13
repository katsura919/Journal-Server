const WebSocket = require('ws');
const { broadcast } = require('../utils/websocket');
const { insertJournals } = require('./journalUtils');

const clients = {}; // Map to track user connections

module.exports = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const userId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('userId');

    // Add the connection to the clients map
    if (!clients[userId]) clients[userId] = [];
    clients[userId].push(ws);

    ws.on('message', (message) => {
      let messageString = message.toString(); // Convert buffer to string
      console.log(`Message from ${userId}:`, messageString);

      // Parse the message string to JSON
      try {
        const data = JSON.parse(messageString);
        if (data.type === 'sync_journals' && data.journals) {
          const journals = data.journals;
          broadcast(clients, userId, { type: 'journals_synced', message: `Journals synced for user ${userId}`, userId, journals });
          insertJournals(journals); // Insert journals into the database
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    });

    ws.on('close', () => {
      clients[userId] = clients[userId].filter(client => client !== ws);
      if (clients[userId].length === 0) delete clients[userId];
    });
  });

  return wss; // Return the WebSocket server instance
};
