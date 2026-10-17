# Rubel Telecom AI Function

This folder contains the Node.js Appwrite Function used by the Rubel Telecom website to request Gemini image enhancement.

## Appwrite Function configuration

- Runtime: Node.js (use a supported current Node runtime)
- Root directory: `functions/rubel-telecom-ai`
- Entrypoint: `src/main.js`
- Build command: `npm install`
- Environment variable: `GEMINI_API_KEY` (store only in Appwrite Variables; never commit it)
- Current function domain used by the website: `https://starter-function-bs1o.nyc.appwrite.run`

## Deploy

Connect the GitHub repository containing this folder to the existing Appwrite Function, and set the root directory and entrypoint above. Deploy the code before expecting the website AI button to work.

## Safety notes

The endpoint accepts JPG, PNG, or WEBP images up to about 6 MB and uses a fixed enhancement prompt. Public access can consume Gemini API quota. Do not enable public execution unless you understand the quota/billing impact and have suitable usage controls. The function does not store submitted image files; it returns the generated image to the browser.
