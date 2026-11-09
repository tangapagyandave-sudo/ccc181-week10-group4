import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

dotenv.config({
  path: fileURLToPath(new URL("./.env", import.meta.url)),
  quiet: true,
});
const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET;
const clientOrigin = process.env.CLIENT_ORIGIN;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(
    "PORT must be an integer from 1 to 65535. Check server/.env.",
  );
}
if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.startsWith("replace-")) {
  throw new Error(
    "Set JWT_SECRET in server/.env to at least 32 random characters.",
  );
}
if (!clientOrigin || new URL(clientOrigin).origin !== clientOrigin) {
  throw new Error(
    "Set CLIENT_ORIGIN in server/.env to http://localhost:5173 (no final slash).",
  );
}

const app = createApp({ jwtSecret, clientOrigin });
const server = app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} is already in use. Stop the other API terminal and retry.`
      : "The API could not start. Check your settings.",
  );
  process.exitCode = 1;
});
