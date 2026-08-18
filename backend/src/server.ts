import http from 'http';
import app from './app';
import { initWebSocket } from './services/websocket.service';

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Attach WebSocket server
initWebSocket(server);

server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket available at ws://0.0.0.0:${PORT}/ws`);
});
