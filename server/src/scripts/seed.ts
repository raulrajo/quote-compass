import mongoose from 'mongoose'
import { connectDb } from '../config/db.js'
import { seedSession } from '../services/seed.js'

/** CLI helper: seed the sample dataset into a "demo" session for local testing. */
async function main(): Promise<void> {
  await connectDb()
  await seedSession('demo')
  console.log('[seed] sample data loaded into session "demo"')
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('[seed] failed', err)
  process.exit(1)
})
