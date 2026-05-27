import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load repo-level defaults first, then let server/.env override them.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

// Import configurations
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { initializeFirebase } from './config/firebase';
import { initializeRazorpay } from './config/razorpay';
import { initializeEmailService } from './config/email';

// Import routes
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payment';
import userRoutes from './routes/users';
import adminRoutes from './routes/admin';
import salesRoutes from './routes/sales';
import couponRoutes from './routes/coupons';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { razorpayWebhook } from './controllers/paymentWebhookController';

const PORT = Number(process.env.PORT || 5000);

const parseOrigins = (...values: Array<string | undefined>): string[] =>
    values
        .flatMap((value) => value?.split(',') || [])
        .map((origin) => origin.trim())
        .filter(Boolean);

function createApp(): Application {
    const app: Application = express();

    // CORS - MUST BE BEFORE OTHER MIDDLEWARE
    app.use(
      cors({
        origin: [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3000",
          "http://localhost:8080",
          "http://localhost:8081",
          "http://localhost:8082",
          "https://leena-mu.vercel.app",
          "https://www.leenabyalekhya.in",
          ...parseOrigins(process.env.FRONTEND_URL, process.env.CORS_ORIGIN),
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    // Security middleware
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // ============ RATE LIMITING (per-route) ============
    // Separate limits prevent product browsing from blocking checkout/payment
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: 'Too many authentication attempts, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    const paymentLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 30,
        message: 'Too many payment attempts, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });

    const webhookLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 500,
        message: 'Too many webhook requests',
        standardHeaders: true,
        legacyHeaders: false,
    });

    // Razorpay webhook — raw body (must be before express.json)
    app.post('/api/payment/webhook', webhookLimiter, express.raw({ type: 'application/json' }), razorpayWebhook);

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    app.use('/api/payment', paymentLimiter);

    // Compression middleware
    app.use(compression());

    // Request timeout — prevents hanging requests from consuming connections
    app.use((req: Request, _res: Response, next: NextFunction) => {
        req.setTimeout(30000); // 30 seconds
        next();
    });

    // Logging middleware
    if (process.env.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined'));
    }

    // Health check endpoint
    app.get('/health', async (_req, res) => {
        const { getRedisClient } = await import('./config/redis');
        const redis = getRedisClient();
        res.json({
            status: 'OK',
            version: '2.1.0',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            pid: process.pid,
            redis: redis ? 'connected' : 'disabled_or_down',
            env: process.env.NODE_ENV || 'development',
        });
    });

    // ============ API ROUTES (with /api prefix) ============
    const apiRouter = express.Router();
    
    // Apply limiters to the apiRouter
    apiRouter.use('/users', authLimiter);
    apiRouter.use(generalLimiter);

    // Register routes on the apiRouter
    apiRouter.use('/coupons', couponRoutes);
    apiRouter.use('/products', productRoutes);
    apiRouter.use('/cart', cartRoutes);
    apiRouter.use('/orders', orderRoutes);
    apiRouter.use('/payment', paymentRoutes);
    apiRouter.use('/users', userRoutes);
    apiRouter.use('/admin', adminRoutes);
    apiRouter.use('/sales', salesRoutes);

    // Mount the apiRouter at /api
    app.use('/api', apiRouter);

    // ============ LEGACY ROUTES (without /api prefix) ============
    app.use('/products', productRoutes);
    app.use('/cart', cartRoutes);
    app.use('/orders', orderRoutes);
    app.use('/payment', paymentRoutes);
    app.use('/users', userRoutes);
    app.use('/admin', adminRoutes);
    app.use('/sales', salesRoutes);
    app.use('/coupons', couponRoutes);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

async function startWorker() {
    const { validateProductionEnv } = await import('./config/env');
    validateProductionEnv();

    const app = createApp();

    try {
        console.log(`🚀 Starting Leena Backend Server (PID: ${process.pid})...\n`);

        // Connect to MongoDB (required — server can't work without DB)
        await connectDatabase();

        // Connect to Redis (optional — server works without cache, just slower)
        await connectRedis();

        // Initialize Firebase Admin (optional)
        try {
            initializeFirebase();
        } catch (error) {
            console.warn('⚠️  Firebase Admin initialization failed (optional service)');
        }

        // Initialize Razorpay (optional — fails gracefully)
        try {
            initializeRazorpay();
        } catch (error) {
            console.warn('⚠️  Razorpay initialization failed:', (error as Error).message);
        }

        // Initialize Email Service (optional — fails gracefully)
        try {
            initializeEmailService();
        } catch (error) {
            console.warn('⚠️  Email service initialization failed:', (error as Error).message);
        }

        // Start Express server
        const server = app.listen(PORT, () => {
            console.log(`\n✅ Server running on port ${PORT}`);
            console.log(`📱 API Base URL: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health\n`);
        });

        server.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`\nPort ${PORT} is already in use.`);
                console.error(`Stop the other process using port ${PORT}, or set PORT to another value in server/.env.`);
                console.error('If you change the backend port, update VITE_API_URL in the root .env to match.\n');
                process.exit(1);
            }

            throw error;
        });

        // Server-level timeout (safety net)
        server.timeout = 30000;
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000;

        // ============ GRACEFUL SHUTDOWN ============
        const gracefulShutdown = async (signal: string) => {
            console.log(`\n${signal} received. Shutting down gracefully...`);

            server.close(async () => {
                console.log('HTTP server closed');
                try {
                    await disconnectDatabase();
                    await disconnectRedis();
                } catch (err) {
                    console.error('Error during cleanup:', err);
                }
                process.exit(0);
            });

            setTimeout(() => {
                console.error('Forced shutdown after 10s timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startWorker();

export default createApp;
