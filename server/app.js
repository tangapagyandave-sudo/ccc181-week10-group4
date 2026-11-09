import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_BODY = { error: "Email and password are required." };
const INVALID_LOGIN = { error: "Invalid email or password." };
const NOT_LOGGED_IN = { error: "Not logged in." };

// Only the published classroom demo password is used here. The user list stores a hash.
const users = [
  {
    id: 1,
    name: "Demo Student",
    email: "student@campusconnect.test",
    passwordHash: bcrypt.hashSync("Campus26", 10),
  },

  {
    id: 2,
    name: "2nd Demo Student",
    email: "gervy1234@gmail.com",
    passwordHash: bcrypt.hashSync("gervy1234", 10),
  },
];

function publicUser(user) {
  // Explicitly select safe fields: never serialize passwordHash.
  return { id: user.id, name: user.name, email: user.email };
}

export function createApp({ jwtSecret, clientOrigin }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/api/v1/sessions", async (req, res) => {
    const body = req.body;
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return res.status(400).json(INVALID_BODY);
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password; // Do not trim or lowercase passwords.
    if (
      !EMAIL_PATTERN.test(email) ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json(INVALID_BODY);
    }

    const user = users.find((item) => item.email === email);
    // Compare a hash even for an unknown email; both failures have the same response.
    const passwordMatches = await bcrypt.compare(
      password,
      (user ?? users[0]).passwordHash,
    );
    if (!user || !passwordMatches) {
      return res.status(401).json(INVALID_LOGIN);
    }

    const token = jwt.sign({}, jwtSecret, {
      algorithm: "HS256",
      subject: String(user.id),
      expiresIn: "1h",
    });
    return res.status(200).json({ token, user: publicUser(user) });
  });

  function requireUser(req, res, next) {
    const match = /^Bearer ([^\s]+)$/i.exec(req.get("Authorization") ?? "");
    if (!match) return res.status(401).json(NOT_LOGGED_IN);

    try {
      const payload = jwt.verify(match[1], jwtSecret, {
        algorithms: ["HS256"],
      });
      const user =
        typeof payload === "object"
          ? users.find((item) => String(item.id) === payload.sub)
          : undefined;
      if (!user) return res.status(401).json(NOT_LOGGED_IN);
      req.user = user;
    } catch {
      return res.status(401).json(NOT_LOGGED_IN);
    }
    return next();
  }

  app.get("/api/v1/users/me", requireUser, (req, res) => {
    res.status(200).json(publicUser(req.user));
  });

  app.use((_req, res) => res.status(404).json({ error: "Not found." }));

  // Four parameters identify Express error middleware. Keep it after the routes.
  app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed")
      return res.status(400).json(INVALID_BODY);
    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body is too large." });
    }
    return res.status(500).json({ error: "Something went wrong." });
  });

  return app;
}
