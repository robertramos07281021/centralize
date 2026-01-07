import mongoose from "mongoose";
import "dotenv/config.js";

let atlasConn = null;

const getAtlasConnection = async () => {
  if (atlasConn && atlasConn.readyState === 1) return atlasConn;

  const uri =
    process.env.MONGO_ATLAS_URL ||
    process.env.MONGO_URL_ATLAS ||
    process.env.MONGO_ATLAS ||
    "";

  if (!uri) {
    throw new Error("Atlas connection string is missing (MONGO_ATLAS_URL)");
  }

  const dbName = process.env.MONGO_ATLAS_DB || undefined;

  try {
    atlasConn = await mongoose.createConnection(uri, {
      dbName,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      retryWrites: true,
      w: "majority",
      tls: true,
      ssl: true,
      // Relax TLS to cope with SSL inspection / custom CA; tighten once allowlisted.
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      tlsInsecure: true,
    });

    return atlasConn;
  } catch (err) {
    console.error("Atlas connection failed", err);
    return null;
  }
};

const getAtlasModel = async (name, schema) => {
  const conn = await getAtlasConnection();
  if (!conn) return null;
  return conn.models[name] || conn.model(name, schema);
};

export { getAtlasConnection, getAtlasModel };
