import { MongoClient } from "mongodb";
import Papr from "papr";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = { appName: "your-app-name" };

// Create the Papr instance
const papr = new Papr();

// In serverless environments, we need to handle connections differently
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve connection across hot-reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log("Creating new MongoDB client in development");
    const client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }

  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, create a new client for each request
  console.log("Creating new MongoDB client in production");
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Track initialization state
let isPaprInitialized = false;

// Initialize Papr with the database
export async function initializePapr() {
  try {
    const client = await clientPromise;
    const db = client.db("your-db-name");

    // Only initialize if not already initialized
    if (!isPaprInitialized) {
      console.log("Initializing Papr");
      papr.initialize(db);
      isPaprInitialized = true;
    }

    // Always update schemas
    await papr.updateSchemas();
    return { client, papr };
  } catch (error) {
    console.error("Error initializing Papr:", error);
    throw error;
  }
}

// Export both client promise and papr
export { clientPromise, papr };
export default papr;
