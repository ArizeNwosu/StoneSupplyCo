<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Callmate

## Run Locally

Prerequisites: Node.js

1. Install dependencies: `npm install`
2. Set local env values in `.env`
3. Start the API: `npm run api`
4. Run the app: `npm run dev`

## iOS Release Build

Do not ship the app with a localhost or ngrok API URL. Release builds should use a stable HTTPS backend.

1. Create `.env.production` from `.env.production.example`
2. Set `VITE_API_URL` to your production API host
3. Set the production Supabase values
4. Run `npm run ios:release`
5. In Xcode, choose the `App` target and `Release` configuration
6. Archive via `Product > Archive`

The release build guard will fail if `VITE_API_URL` is missing, non-HTTPS, or still points at localhost/ngrok.

## Railway API Deploy

If Railway keeps detecting the repo as a Vite static site, use the included [Dockerfile](/Users/riz/Downloads/callmate/Dockerfile). It runs the Express API from [server/index.mjs](/Users/riz/Downloads/callmate/server/index.mjs) on port `8080`.

Recommended Railway settings:

1. Root directory: the folder that contains `package.json`
2. Builder: Dockerfile
3. Start command: leave blank so Docker uses its own `CMD`
4. Required env vars: `OPENAI_API_KEY`
