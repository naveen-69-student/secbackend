// backend/supabaseClient.js
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// ✅ Explicitly load .env from backend folder
dotenv.config({ path: "./.env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("❌ SUPABASE_URL is missing in environment variables");
}
if (!supabaseKey) {
  throw new Error("❌ SUPABASE_KEY is missing in environment variables");
}

// ✅ Create supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase client initialized with URL:", supabaseUrl);
