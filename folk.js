import http from "node:http";
import fs from "fs";
import path from "path";

const server = http.createServer(async (req, res) => {
  const parts = req.url.split("/");
  let filepath = path.join("web", req.url === "/" ? "index.html" : req.url);
    
  try {
    const data = fs.readFileSync(filepath);
    const ext = path.extname(filepath);
    const mime_types = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".json": "application/json",
      ".glb": "model/gltf-binary"
    };
      
    const mime_type = mime_types[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime_type });
    return res.end(data);
  } catch (err) {
    res.writeHead(404);
    return res.end("file not found");
  }
});

server.listen(80, () => {
  console.log("server listening: http://127.0.0.1:80");
});
