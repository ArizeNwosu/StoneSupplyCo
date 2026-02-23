<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1OVyFMAv6K7XEDrTHDVp2K7YhqMQlIydL

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`

## Important Security Notice: GEMINI_API_KEY and Backend Proxy

The `GEMINI_API_KEY` should **NEVER** be exposed on the client-side in a production environment due to severe security risks. To address this, the client-side `geminiService` has been updated to use a **mock implementation**.

For actual AI functionality, you **must** set up a secure backend service that will:

1.  Securely store your `GEMINI_API_KEY`.
2.  Receive requests from this frontend application.
3.  Make calls to the Google Gemini API using your `GEMINI_API_KEY`.
4.  Return the AI-generated results to the frontend.

This project currently *does not* include a backend service. You will need to implement one yourself if you wish to deploy this application with real Gemini AI capabilities.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
