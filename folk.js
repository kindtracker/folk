import http from "node:http";
import fs from "fs";
import path from "path";

const server = http.createServer(async (req, res) => {
  const parts = req.url.split("/");
  
  if (parts.length === 3 && parts[1] === "map") {
    const map_id = parts[2];
    const resp = await fetch(`https://playvortex.io/api/maps/${map_id}`);
    const map = await resp.json();
    
    res.writeHead(200, {
      "Content-Type": "application/json"
    });
    return res.end(JSON.stringify(map));
  } else if (parts[1] === "assets") {
    const filename = parts[2];
    const filepath = path.join("web", "assets", filename);

    try {
      const data = fs.readFileSync(filepath);
      const ext = path.extname(filename);
      const mime_type = ext === ".glb" ? "model/gltf-binary" : "application/octet-stream";
      
      res.writeHead(200, {
        "Content-Type": mime_type
      });
      return res.end(data);
    } catch (err) {
      res.writeHead(404);
      return res.end("asset not found");
    }
  } else {
    let filepath = path.join("web", req.url === "/" ? "index.html" : req.url);
    
    try {
      const data = fs.readFileSync(filepath);
      const ext = path.extname(filepath);
      const mime_types = {
        ".html": "text/html",
        ".js": "application/javascript"
      };
      
      const mime_type = mime_types[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": mime_type });
      return res.end(data);
    } catch (err) {
      res.writeHead(404);
      return res.end("file not found");
    }
  }
});

server.listen(80, () => {
  console.log("server listening: http://127.0.0.1:80");
});
