/**
 * Script to check environment variables during development
 * Run with: npx ts-node scripts/check-env.ts
 */

import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log("✅ Loaded environment variables from .env.local")
} else {
  console.warn("⚠️ No .env.local file found")
}

// Required environment variables
const requiredVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "BLOB_READ_WRITE_TOKEN",
]

// Optional environment variables
const optionalVars = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_HOST",
  "POSTGRES_DATABASE",
  "SITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_VERCEL_ENV",
]

// Check required variables
const missingRequired = requiredVars.filter((key) => !process.env[key])
if (missingRequired.length > 0) {
  console.error("❌ Missing required environment variables:")
  missingRequired.forEach((key) => console.error(`   - ${key}`))
} else {
  console.log("✅ All required environment variables are set")
}

// Check optional variables
const missingOptional = optionalVars.filter((key) => !process.env[key])
if (missingOptional.length > 0) {
  console.warn("⚠️ Missing optional environment variables:")
  missingOptional.forEach((key) => console.warn(`   - ${key}`))
} else {
  console.log("✅ All optional environment variables are set")
}

// Summary
console.log("\n📊 Environment Variables Summary:")
console.log(`   - Required: ${requiredVars.length - missingRequired.length}/${requiredVars.length} set`)
console.log(`   - Optional: ${optionalVars.length - missingOptional.length}/${optionalVars.length} set`)

// Exit with error code if required variables are missing
if (missingRequired.length > 0) {
  process.exit(1)
}
