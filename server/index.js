require("dotenv").config();

const path = require("path");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

// Middleware
const allowedOrigins = IS_PROD
  ? [process.env.FRONTEND_URL, "https://kylesuda.com", "https://www.kylesuda.com"].filter(Boolean)
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Health checks — do NOT mount on "/" in production (SPA lives there)
function health(_req, res) {
  res.json({ status: "API is running" });
}
app.get("/health", health);
app.get("/api/health", health);
if (!IS_PROD) {
  app.get("/", health);
}

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: { id: true, email: true, name: true },
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create a user
app.post("/users", async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "email is required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) {
      return res.status(400).json({ error: "email must be valid" });
    }

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: typeof name === "string" && name.trim() ? name.trim() : null,
      },
      select: { id: true, email: true, name: true },
    });

    res.status(201).json(user);
  } catch (err) {
    if (err && err.code === "P2002") {
      return res.status(409).json({ error: "email already exists" });
    }

    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Serve React frontend in production
if (IS_PROD) {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  // Catch-all: return the React app for any non-API route
  // Express 5 requires a regex or named param — bare "*" throws on startup
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
async function shutdown(signal) {
  try {
    console.log(`Received ${signal}. Shutting down...`);
    await prisma.$disconnect();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
