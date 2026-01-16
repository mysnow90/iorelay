const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Data storage
const DATA_DIR = path.join(__dirname, "data");
const STREAMS_FILE = path.join(DATA_DIR, "streams.json");
const DESTINATIONS_FILE = path.join(DATA_DIR, "destinations.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files
if (!fs.existsSync(STREAMS_FILE)) {
  fs.writeFileSync(STREAMS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(DESTINATIONS_FILE)) {
  fs.writeFileSync(DESTINATIONS_FILE, JSON.stringify([]));
}

// Helper functions
function readStreams() {
  try {
    const data = fs.readFileSync(STREAMS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeStreams(streams) {
  fs.writeFileSync(STREAMS_FILE, JSON.stringify(streams, null, 2));
}

function readDestinations() {
  try {
    const data = fs.readFileSync(DESTINATIONS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeDestinations(destinations) {
  fs.writeFileSync(DESTINATIONS_FILE, JSON.stringify(destinations, null, 2));
}

// Broadcast updates
function broadcastUpdate(type, data) {
  io.emit(`stream:${type}`, data);
}

// Streams API
app.get("/api/streams", (req, res) => {
  const streams = readStreams();
  res.json(streams);
});

app.post("/api/streams", (req, res) => {
  const streams = readStreams();
  const newStream = {
    id: uuidv4(),
    name: req.body.name,
    inputUrl: req.body.inputUrl,
    active: req.body.active !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  streams.push(newStream);
  writeStreams(streams);
  
  broadcastUpdate("update", { type: "stream_added", stream: newStream });
  res.status(201).json(newStream);
});

app.put("/api/streams/:id", (req, res) => {
  const streams = readStreams();
  const index = streams.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Stream not found" });
  }
  
  streams[index] = {
    ...streams[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  writeStreams(streams);
  broadcastUpdate("update", { type: "stream_updated", stream: streams[index] });
  res.json(streams[index]);
});

app.delete("/api/streams/:id", (req, res) => {
  let streams = readStreams();
  const index = streams.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Stream not found" });
  }
  
  streams = streams.filter(s => s.id !== req.params.id);
  writeStreams(streams);
  
  broadcastUpdate("update", { type: "stream_deleted", streamId: req.params.id });
  res.json({ message: "Stream deleted" });
});

// Destinations API
app.get("/api/destinations", (req, res) => {
  const destinations = readDestinations();
  res.json(destinations);
});

app.post("/api/destinations", (req, res) => {
  const destinations = readDestinations();
  const newDestination = {
    id: uuidv4(),
    name: req.body.name,
    outputUrl: req.body.outputUrl,
    active: req.body.active !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  destinations.push(newDestination);
  writeDestinations(destinations);
  
  broadcastUpdate("update", { type: "destination_added", destination: newDestination });
  res.status(201).json(newDestination);
});

app.put("/api/destinations/:id", (req, res) => {
  const destinations = readDestinations();
  const index = destinations.findIndex(d => d.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Destination not found" });
  }
  
  destinations[index] = {
    ...destinations[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  writeDestinations(destinations);
  broadcastUpdate("update", { type: "destination_updated", destination: destinations[index] });
  res.json(destinations[index]);
});

app.delete("/api/destinations/:id", (req, res) => {
  let destinations = readDestinations();
  const index = destinations.findIndex(d => d.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: "Destination not found" });
  }
  
  destinations = destinations.filter(d => d.id !== req.params.id);
  writeDestinations(destinations);
  
  broadcastUpdate("update", { type: "destination_deleted", destinationId: req.params.id });
  res.json({ message: "Destination deleted" });
});

// Stats API
app.get("/api/stats", (req, res) => {
  const streams = readStreams();
  const destinations = readDestinations();
  
  const stats = {
    streams: streams.length,
    destinations: destinations.length,
    activeStreams: streams.filter(s => s.active).length,
    activeDestinations: destinations.filter(d => d.active).length,
    lastUpdated: new Date().toISOString()
  };
  
  res.json(stats);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  // Send initial stats
  const streams = readStreams();
  const destinations = readDestinations();
  const stats = {
    streams: streams.length,
    destinations: destinations.length,
    activeStreams: streams.filter(s => s.active).length
  };
  
  socket.emit("stream:stats", stats);
  socket.emit("connected", { message: "Connected to ioRelay" });
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`?? Backend server running on http://localhost:${PORT}`);
  console.log(`?? WebSocket server ready for connections`);
  console.log(`?? Data directory: ${DATA_DIR}`);
});
