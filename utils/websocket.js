const WebSocket = require('ws'); // Import WebSocket module

let wss;

const initWebSocket = (server) => {
  // Initialize the WebSocket server with the HTTP server
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const userId = new URLSearchParams(req.url.slice(1)).get('userId');
    console.log(`User ${userId} connected`);

    // Sending a welcome message to the connected client
    ws.send(JSON.stringify({ message: `Welcome user ${userId}` }));

    // Listen for messages from the client
    ws.on('message', (message) => {
      console.log('Received message:', message);

      // Handle the message from client (e.g., syncing journals)
      const data = JSON.parse(message);
      if (data.type === 'sync_journals') {
        console.log('Syncing journals:', data.journals);
        // You can perform database sync here and respond with the result

        // After syncing, broadcast the update to all clients (optional)
        broadcastToAllClients({
          type: 'journals_synced',
          message: `Journals synced for user ${userId}`,
          userId,
          journals: data.journals,
        });
      }
    });

    ws.on('close', () => {
      console.log(`User ${userId} disconnected`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
};

// Broadcast function to send messages to all clients of a particular user
const broadcast = (clients, userId, data) => {
  if (clients[userId]) {
    clients[userId].forEach(client => {
      // Check if the client is still open before sending the message
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  } else {
    console.log(`No clients found for userId: ${userId}`);
  }
};
module.exports = {initWebSocket, broadcast};
