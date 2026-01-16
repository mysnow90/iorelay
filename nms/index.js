const NodeMediaServer = require("node-media-server");
const config = {
  rtmp: { port: 1935, chunk_size: 60000, gop_cache: true, ping: 30 },
  http: { port: 8000, allow_origin: "*", mediaroot: "./media" }
};
const nms = new NodeMediaServer(config);
nms.run();
console.log("RTMP Server running on port 1935");
console.log("HTTP Server running on port 8000");
