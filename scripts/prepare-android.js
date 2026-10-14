const fs = require("fs");
const path = require("path");

const root = process.cwd();
const out = path.join(root, "www");
fs.mkdirSync(out, { recursive: true });

for (const file of [
  "index.html",
  "admin.html",
  "about.html",
  "manifest.json",
  "service-worker.js",
  "icon-512.png",
  "file_000000008f7c8210abe65a5d06837183.png"
]) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, path.join(out, file));
  }
}

if (!fs.existsSync(path.join(out, "index.html"))) {
  throw new Error("Root index.html was not found.");
}
if (!fs.existsSync(path.join(out, "admin.html"))) {
  throw new Error("admin.html was not found. The Android app must include the Admin Panel.");
}

console.log("Rubel Telecom website and Admin Panel copied into www/.");
