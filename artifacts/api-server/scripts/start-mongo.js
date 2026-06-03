#!/usr/bin/env node
import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, rmSync } from "fs";
import net from "net";

const MONGO_DATA_DIR = "/tmp/mongodb_data";
const MONGO_LOG = "/tmp/mongodb_data/mongod.log";
const MONGO_PORT = 27017;

function isMongoRunning() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.connect(MONGO_PORT, "127.0.0.1", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
  });
}

async function startMongo() {
  if (await isMongoRunning()) {
    console.log("[start-mongo] MongoDB already running on port 27017");
    return;
  }

  try {
    execSync("which mongod", { stdio: "ignore" });
  } catch {
    console.log("[start-mongo] mongod not found — skipping MongoDB start");
    return;
  }

  if (!existsSync(MONGO_DATA_DIR)) {
    mkdirSync(MONGO_DATA_DIR, { recursive: true });
  }

  const child = spawn(
    "mongod",
    [
      "--dbpath", MONGO_DATA_DIR,
      "--port", String(MONGO_PORT),
      "--bind_ip", "127.0.0.1",
      "--noauth",
      "--wiredTigerCacheSizeGB", "0.5",
      "--logpath", MONGO_LOG,
      "--fork"
    ],
    { stdio: "inherit", detached: true }
  );
  child.unref();

  for (let i = 0; i < 20; i++) {
    if (await isMongoRunning()) {
      console.log("[start-mongo] MongoDB started successfully");
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.error("[start-mongo] MongoDB failed to start within 10s");
  process.exit(1);
}

startMongo();
