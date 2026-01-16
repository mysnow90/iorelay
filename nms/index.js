import NodeMediaServer from "node-media-server";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mediaDir = join(__dirname, "media");

// Create media directory if it doesn't exist
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

const config = {
  rtmp: {
    port: 1936,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8001,
    allow_origin: "*",
    mediaroot: mediaDir
  }
};

console.log("=======================================");
console.log("   IORELAY888 - RTMP/HLS Server");
console.log("=======================================");
console.log("");
console.log("Starting Node Media Server...");
console.log("");

// Start Node Media Server
const nms = new NodeMediaServer(config);

nms.on("preConnect", (id, args) => {
  console.log(`[RTMP] Client connecting: ${id}`);
});

nms.on("postConnect", (id, args) => {
  console.log(`[RTMP] Client connected: ${id}`);
});

nms.on("doneConnect", (id, args) => {
  console.log(`[RTMP] Client disconnected: ${id}`);
});

nms.on("prePublish", (id, StreamPath, args) => {
  console.log(`[RTMP] 📺 Stream starting: ${StreamPath}`);
  console.log(`       Stream Key: ${StreamPath.split("/")[2]}`);
});

nms.on("postPublish", (id, StreamPath, args) => {
  console.log(`[RTMP] ✅ Stream published: ${StreamPath}`);
  console.log(`       HLS URL: http://localhost:8001${StreamPath}/index.m3u8`);
});

nms.on("donePublish", (id, StreamPath, args) => {
  console.log(`[RTMP] ❌ Stream stopped: ${StreamPath}`);
});

nms.run();

console.log("");
console.log("✅ SERVER STARTED SUCCESSFULLY!");
console.log("");
console.log("📹 RTMP Endpoint: rtmp://localhost:1936/live");
console.log("📺 HLS Endpoint:  http://localhost:8001/live");
console.log("📁 Media directory: " + mediaDir);
console.log("");
console.log("=======================================");
console.log("   STREAMING INSTRUCTIONS");
console.log("=======================================");
console.log("");
console.log("To stream using OBS:");
console.log("1. Open OBS Studio");
console.log("2. Go to Settings > Stream");
console.log("3. Service: Custom");
console.log("4. Server: rtmp://localhost:1936/live");
console.log("5. Stream Key: main (or your custom key)");
console.log("");
console.log("To watch the stream:");
console.log("1. VLC: Media > Open Network Stream");
console.log("2. URL: http://localhost:8001/live/main/index.m3u8");
console.log("3. Or use: http://localhost:3001");
console.log("");
console.log("Press Ctrl+C to stop the server");
console.log("=======================================");
