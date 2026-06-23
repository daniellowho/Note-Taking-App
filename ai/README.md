# AI layer

`gemini.ts` owns Gemini client configuration and API-key validation. The Express AI routes live in `backend/server.ts` and use this client, so keys stay server-side.
