const fs = require("fs");
const path = require("path");

const root = process.cwd();
const out = path.join(root, "www");

// Recreate the bundled web directory so deleted/old files cannot remain in an APK.
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

// Copy web pages and their local assets, preserving subfolders and relative URLs.
// Never bundle build folders, source-control metadata, dependencies, server code, or secrets.
const ignoredDirs = new Set([
  ".git", ".github", "node_modules", "android", "www", "dist", "build",
  "coverage", "scripts", "functions", "server", "vendor"
]);
const allowedExtensions = new Set([
  ".html", ".htm", ".css", ".js", ".mjs", ".json", ".webmanifest",
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico", ".avif",
  ".woff", ".woff2", ".ttf", ".otf", ".mp4", ".webm", ".mp3", ".wav"
]);
const blockedName = /(^\.env($|\.)|secret|credential|private[-_]?key|\.pem$|\.p12$|\.keystore$|\.jks$)/i;
const blockedFiles = new Set(["package.json", "package-lock.json", "capacitor.config.json", "README.md", "LICENSE"]);

function copyWebFiles(sourceDir, relativeDir = "") {
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const name = entry.name;
    const relativePath = path.join(relativeDir, name);
    const sourcePath = path.join(sourceDir, name);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(name) && !name.startsWith(".")) {
        copyWebFiles(sourcePath, relativePath);
      }
      continue;
    }

    if (!entry.isFile() || blockedName.test(name) || blockedFiles.has(name)) continue;
    if (!allowedExtensions.has(path.extname(name).toLowerCase())) continue;

    const destinationPath = path.join(out, relativePath);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

copyWebFiles(root);

for (const requiredFile of ["index.html", "admin.html"]) {
  if (!fs.existsSync(path.join(out, requiredFile))) {
    throw new Error(`Required file ${requiredFile} was not included in the Android bundle.`);
  }
}

const htmlFiles = [];
function countHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) countHtml(fullPath);
    else if (/\.html?$/i.test(entry.name)) htmlFiles.push(fullPath);
  }
}
countHtml(out);

console.log(`Rubel Telecom web bundle prepared: ${htmlFiles.length} HTML page(s), including index.html and admin.html.`);
