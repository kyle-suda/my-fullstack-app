require("dotenv").config();

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "API is running" });
});

// Get all users
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: "asc" },
      select: { id: true, email: true, name: true }, // keep payload clean
    });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create a user (so your "Add user" form can work)
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
    // Prisma unique constraint violation for email
    if (err && err.code === "P2002") {
      return res.status(409).json({ error: "email already exists" });
    }

    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

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
