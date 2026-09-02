import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma, { connectDB } from "./Config/db.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Verify database connection when server starts
connectDB();

app.get("/", (req, res) => {
  res.json({
    message: "Ticketing System Backend is running",
    status: "Healthy",
  });
});

// GET /api/users - Fetch all users with their roles from Supabase
app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        is_active: true,
        created_at: true,
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/roles - Fetch all roles from Supabase
app.get("/api/roles", async (req, res) => {
  try {
    const roles = await prisma.roles.findMany();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});