import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// Local storage files
const STREAMS_FILE = join(__dirname, "data", "streams.json");
const DESTINATIONS_FILE = join(__dirname, "data", "destinations.json");
const DATA_DIR = join(__dirname, "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions for local storage
const readJSON = (file) => {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, "utf8");
      return JSON.parse(data) || [];
    }
    return [];
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
};

const writeJSON = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error(`Error writing ${file}:`, error);
  }
};

// Initialize default data
if (!fs.existsSync(STREAMS_FILE)) {
  writeJSON(STREAMS_FILE, [
    {
      id: "1",
      name: "Main Stream",
      rtmp_url: "rtmp://localhost:1936/live/",
      stream_key: "main",
      status: "stopped",
      viewers: 0,
      bitrate: 0,
      created_at: new Date().toISOString()
    },
    {
      id: "2",
      name: "Backup Stream",
      rtmp_url: "rtmp://localhost:1936/live/",
      stream_key: "backup",
      status: "stopped",
      viewers: 0,
      bitrate: 0,
      created_at: new Date().toISOString()
    }
  ]);
}

if (!fs.existsSync(DESTINATIONS_FILE)) {
  writeJSON(DESTINATIONS_FILE, [
    {
      id: "youtube",
      name: "YouTube",
      type: "rtmp",
      url: "rtmp://a.rtmp.youtube.com/live2",
      enabled: true,
      stream_key: "",
      icon: "youtube",
      color: "#FF0000"
    },
    {
      id: "facebook",
      name: "Facebook",
      type: "rtmp",
      url: "rtmp://live-api-s.facebook.com:80/rtmp/",
      enabled: true,
      stream_key: "",
      icon: "facebook",
      color: "#1877F2"
    },
    {
      id: "twitch",
      name: "Twitch",
      type: "rtmp",
      url: "rtmp://live.twitch.tv/app/",
      enabled: true,
      stream_key: "",
      icon: "twitch",
      color: "#9146FF"
    }
  ]);
}

// API Routes
app.get("/api/ingests", (req, res) => {
  const streams = readJSON(STREAMS_FILE);
  res.json(streams);
});

app.post("/api/ingests", (req, res) => {
  const streams = readJSON(STREAMS_FILE);
  const streamKey = req.body.stream_key || `stream_${Date.now()}`;
  const newStream = {
    id: Date.now().toString(),
    name: req.body.name || "New Stream",
    rtmp_url: `rtmp://localhost:1936/live/${streamKey}`,
    stream_key: streamKey,
    status: "stopped",
    viewers: 0,
    bitrate: 0,
    created_at: new Date().toISOString()
  };
  streams.push(newStream);
  writeJSON(STREAMS_FILE, streams);
  io.emit("stream_update", newStream);
  res.json(newStream);
});

app.put("/api/ingests/:id", (req, res) => {
  const streams = readJSON(STREAMS_FILE);
  const index = streams.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    streams[index] = { ...streams[index], ...req.body };
    writeJSON(STREAMS_FILE, streams);
    io.emit("stream_update", streams[index]);
    res.json(streams[index]);
  } else {
    res.status(404).json({ error: "Stream not found" });
  }
});

app.delete("/api/ingests/:id", (req, res) => {
  const streams = readJSON(STREAMS_FILE);
  const filtered = streams.filter(s => s.id !== req.params.id);
  writeJSON(STREAMS_FILE, filtered);
  io.emit("stream_removed", req.params.id);
  res.json({ success: true });
});

app.get("/api/destinations", (req, res) => {
  const destinations = readJSON(DESTINATIONS_FILE);
  res.json(destinations);
});

app.post("/api/destinations", (req, res) => {
  const destinations = readJSON(DESTINATIONS_FILE);
  const newDest = {
    id: Date.now().toString(),
    ...req.body,
    enabled: true
  };
  destinations.push(newDest);
  writeJSON(DESTINATIONS_FILE, destinations);
  io.emit("destination_update", newDest);
  res.json(newDest);
});

app.get("/streams/active", (req, res) => {
  const streams = readJSON(STREAMS_FILE);
  const active = streams.filter(s => s.status === "active");
  res.json(active);
});

app.get("/health", (req, res) => {
  const streams = readJSON(STREAMS_FILE);
  const activeCount = streams.filter(s => s.status === "active").length;
  const totalViewers = streams.reduce((sum, s) => sum + s.viewers, 0);
  
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    stats: {
      total_streams: streams.length,
      active_streams: activeCount,
      total_viewers: totalViewers,
      uptime: process.uptime()
    },
    services: {
      api: "running",
      rtmp: "checking...",
      hls: "checking...",
      websocket: "connected"
    }
  });
});

app.get("/api/stats", (req, res) => {
  const streams = readJSON(STREAMS_FILE);
  const stats = {
    total: streams.length,
    active: streams.filter(s => s.status === "active").length,
    total_viewers: streams.reduce((sum, s) => sum + s.viewers, 0),
    streams: streams.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      viewers: s.viewers,
      bitrate: s.bitrate,
      created_at: s.created_at
    }))
  };
  res.json(stats);
});

// Stream preview endpoint
app.get("/api/streams/:key/preview", (req, res) => {
  const { key } = req.params;
  res.json({
    hls_url: `http://localhost:8001/live/${key}/index.m3u8`,
    rtmp_url: `rtmp://localhost:1936/live/${key}`,
    status: "available"
  });
});

// WebSocket connections
io.on("connection", (socket) => {
  console.log(`🔌 WebSocket client connected: ${socket.id}`);
  
  // Send initial data
  socket.emit("init", {
    streams: readJSON(STREAMS_FILE),
    destinations: readJSON(DESTINATIONS_FILE),
    server_time: new Date().toISOString()
  });
  
  socket.on("disconnect", () => {
    console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
  });
  
  socket.on("get_streams", () => {
    socket.emit("streams_update", readJSON(STREAMS_FILE));
  });
  
  socket.on("get_destinations", () => {
    socket.emit("destinations_update", readJSON(DESTINATIONS_FILE));
  });
});

// Start server
const PORT = 3100;
httpServer.listen(PORT, () => {
  console.log("=======================================");
  console.log("   IORELAY888 - API Server");
  console.log("=======================================");
  console.log("");
  console.log(`✅ API Server: http://localhost:${PORT}`);
  console.log(`✅ WebSocket: ws://localhost:${PORT}`);
  console.log("");
  console.log("📊 Endpoints:");
  console.log(`   GET  /api/ingests      - List all streams`);
  console.log(`   POST /api/ingests      - Create new stream`);
  console.log(`   GET  /api/destinations - List destinations`);
  console.log(`   GET  /health           - System health`);
  console.log(`   GET  /api/stats        - Statistics`);
  console.log("");
  console.log("=======================================");
});
