#!/usr/bin/env node

/**
 * Clear ALL data from ALL Convex app tables
 * For component tables (persistent text streaming streams/chunks), use: npx convex dev --reset
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvFile() {
  const envPath = path.join(__dirname, "../.env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
}

loadEnvFile();

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL environment variable is required");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function clearAllTables() {
  try {
    console.log("🧹 Clearing ALL app tables...");
    console.log(`📡 ${CONVEX_URL}\n`);

    const result = await client.mutation("admin:clearAllTables");

    console.log("📊 Results:");
    for (const [table, count] of Object.entries(result.results)) {
      console.log(`   ${table}: ${count} deleted`);
    }
    console.log(`\n🎉 Total: ${result.total} records deleted`);
    console.log("\n💡 For component tables (streams/chunks): npx convex dev --reset");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

clearAllTables();
