import { MongoClient } from "mongodb";
import Papr from "papr";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = { appName: "your-app-name" };

// Create the Papr instance
const papr = new Papr();

// Handle client instantiation differently based on environment
let client: MongoClient;

if (process.env.NODE_ENV === "development") {
  // In development, use a global variable to preserve across HMR
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
    _paprInitialized?: boolean;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
    globalWithMongo._paprInitialized = false;
  }

  client = globalWithMongo._mongoClient;

  // Only initialize Papr once
  if (!globalWithMongo._paprInitialized) {
    const initializePapr = async () => {
      await client.connect();
      papr.initialize(client.db("your-db-name"));
      await papr.updateSchemas();
      globalWithMongo._paprInitialized = true;
    };

    initializePapr().catch(console.error);
  }
} else {
  // In production mode
  client = new MongoClient(uri, options);

  // Initialize Papr immediately for production
  const initializePapr = async () => {
    await client.connect();
    papr.initialize(client.db("your-db-name"));
    await papr.updateSchemas();
  };

  initializePapr().catch(console.error);
}

// Helper functions for connecting/disconnecting
export async function connect() {
  try {
    // A more modern way to check if we need to connect
    await client.db().command({ ping: 1 });
  } catch (error) {
    console.log("error", error);
    await client.connect();
  }
}

export async function disconnect() {
  await client.close();
}

// Export both client and papr
export { client, papr };
export default papr;
