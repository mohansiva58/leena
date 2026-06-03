import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { connectDatabase } from "./config/database";
import { connectRedis } from "./config/redis";
import { initializeFirebase } from "./config/firebase";
import { initializeEmailService } from "./config/email";
import { initializeRazorpay } from "./config/razorpay";
import { initIO } from "./socket";
import { validateProductionEnv } from "./config/env";
import { StockReservationService } from "./services/StockReservationService";

async function bootstrap() {
  validateProductionEnv();

  await connectDatabase();
  await connectRedis();
  initializeFirebase();
  try { initializeEmailService(); } catch { /* optional */ }
  try { initializeRazorpay(); } catch { /* optional */ }

  const rawPort = process.env["PORT"];
  if (!rawPort) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
  const port = Number(rawPort);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const server = createServer(app);
  initIO(server);

  // Start reservation cleanup job (every 60 seconds)
  setInterval(() => {
    StockReservationService.cleanupExpiredReservations().catch((err) => {
      logger.error({ err }, "Reservation cleanup failed");
    });
  }, 60_000);

  // Run cleanup immediately on startup
  StockReservationService.cleanupExpiredReservations().catch(() => {});

  server.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Bootstrap failed");
  process.exit(1);
});
