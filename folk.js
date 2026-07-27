import http from "node:http";
import fs from "fs";
import path from "path";

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:6969");
  const pathname = url.pathname;
  const parts = pathname.split("/");
  let filepath = path.join("web", pathname === "/" ? "index.html" : pathname);
  console.log(`[folk] url: ${url} pathname: ${pathname}`);

  try {
    let data = fs.readFileSync(filepath);
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
    try {
      const rurl = `http://playvortex.io${pathname}${url.search}`;
      console.log("[folk] directing request to " + rurl);
      let resp = await fetch(rurl);
      if (!resp.ok) {
        res.writeHead(resp.status);
        return res.end(await resp.text());
      }
      res.writeHead(resp.status, {
        "Content-Type": resp.headers.get("content-type") ?? "application/octet-stream",
      });
      const buffer = Buffer.from(await resp.arrayBuffer());
      res.end(buffer);
    } catch (err) {
      console.error(`[folk] error: ${err.message}`);
      res.writeHead(404);
      return res.end("error message: " + err.message);
    }
  }
});

server.listen(6969, () => {
  console.log("[folk] web server listening: http://127.0.0.1:6969");
});
