// backend/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { supabase } from "./supabaseClient.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allow Netlify frontend + local testing
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://127.0.0.1:5500",
    "http://localhost:8080",
    "https://velan-grocery.netlify.app" // 🔥 change this after deploy
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(bodyParser.json());

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "✅ Backend is running on Render!" });
});

// -------- Categories --------
app.get("/categories", async (req, res) => {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/categories", async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase.from("categories").insert([{ name }]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// -------- Products --------
app.get("/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/products", async (req, res) => {
  const { name, price, category_id } = req.body;
  const { data, error } = await supabase.from("products").insert([
    { name, price, category_id }
  ]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// -------- Orders --------
app.post("/orders", async (req, res) => {
  const { customer, product_id, quantity } = req.body;
  const { data, error } = await supabase.from("orders").insert([
    { customer, product_id, quantity }
  ]);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
