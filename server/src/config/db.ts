import mongoose from 'mongoose'
import { env } from './env.js'

/** Connect to MongoDB. Throws if the connection cannot be established. */
export async function connectDb(): Promise<void> {
  mongoose.set('strictQuery', true)
  await mongoose.connect(env.mongoUri)
  console.log('[db] connected to MongoDB')
}
