// server.js
import dotenv from "dotenv";
dotenv.config(); // ✅ load .env first

import express from "express";
import cors from "cors";
import multer from "multer";
import { supabase } from "./supabaseClient.js";

const app = express();

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "http://127.0.0.1:5500",
      "http://localhost:8080",
      "https://velangroceryshop.netlify.app" // your frontend Netlify URL
    ],
    credentials: false,
  })
);

app.use(express.json());

// Multer for file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

const BUCKET = process.env.STORAGE_BUCKET || "images";

// --- Upload helper ---
async function uploadToStorage(file, folder) {
  const timestamp = Date.now();
  const cleanName = file.originalname.replace(/\s+/g, "_");
  const path = `${folder}/${timestamp}_${cleanName}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

// --- Categories ---
app.get("/categories", async (req, res) => {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/categories", upload.single("image"), async (req, res) => {
  try {
    if (!req.body?.name) return res.status(400).json({ success: false, error: "Category name required" });

    const { name } = req.body;
    let imageUrl = null;

    if (req.file) imageUrl = await uploadToStorage(req.file, "categories");

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, image: imageUrl }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete("/categories/by-name/:name", async (req, res) => {
  try {
    const { error } = await supabase.from("categories").delete().eq("name", req.params.name);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- Products ---
app.get("/products", async (req, res) => {
  try {
    let query = supabase.from("products").select("*").order("id", { ascending: true });
    if (req.query.category) query = query.eq("category", req.query.category);
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/products", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    if (!name || !price || !category) return res.status(400).json({ success: false, error: "name, price, category required" });

    let imageUrl = null;
    if (req.file) imageUrl = await uploadToStorage(req.file, "products");

    const { data, error } = await supabase
      .from("products")
      .insert([{ name, description, price: Number(price), image: imageUrl, category }])
      .select()
      .single();

    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete("/products/by-name/:name", async (req, res) => {
  try {
    const { error } = await supabase.from("products").delete().eq("name", req.params.name);
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- Orders ---
app.get("/orders", async (req, res) => {
  try {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true });
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const { items, details } = req.body;
    const payload = {
      items: typeof items === "string" ? items : JSON.stringify(items || []),
      details: typeof details === "string" ? details : JSON.stringify(details || {})
    };

    const { data, error } = await supabase.from("orders").insert([payload]).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// --- Status ---
app.get("/status/leave", async (req, res) => {
  try {
    const { data, error } = await supabase.from("status").select("*").eq("key", "leave").maybeSingle();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, status: data ? data.value : "none" });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/status/leave", async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase.from("status").upsert([{ key: "leave", value: status }]).select().single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Health check
app.get("/", (req, res) => res.json({ ok: true, msg: "Backend running!", time: new Date().toISOString() }));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
