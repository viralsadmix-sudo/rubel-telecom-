const fs = require("fs");
const path = require("path");

const root = process.cwd();
const out = path.join(root, "www");
fs.mkdirSync(out, { recursive: true });

for (const file of ["index.html", "manifest.json", "service-worker.js", "icon-512.png"]) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, path.join(out, file));
  }
}
if (!fs.existsSync(path.join(out, "index.html"))) {
  throw new Error("Root index.html was not found.");
}
console.log("Rubel Telecom web files copied into www/.");
