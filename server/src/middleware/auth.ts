import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase';
import User from '../models/User';
import { cacheGet, cacheSet, cacheDel, CACHE_TTL } from '../utils/cache';
import { isAdminEmail } from '../utils/admin';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string;
        displayName?: string;
    };
}

interface UserAuthData {
    _id?: string;
    firebaseUid: string;
    email: string;
    displayName: string;
    role: string;
    picture?: string;
}

export const authenticateUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        console.log(`[AuthMiddleware] Entering for ${req.method} ${req.originalUrl}, Authorization header:`, req.headers.authorization ? 'Present' : 'Not present');
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized - No token provided' });
            return;
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken: { uid: string; email?: string; name?: string; picture?: string };

        try {
            decodedToken = await verifyFirebaseToken(token);
        } catch (error) {
            console.warn('Token verification failed:', (error as Error).message);
            res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
            return;
        }

        // ============ AUTH CACHING ============
        const userCacheKey = `auth:user:${decodedToken.uid}`;
        let user = (await cacheGet(userCacheKey)) as UserAuthData | null;

        if (!user) {
            try {
                // Generate email with fallback to ensure it's always unique
                let email = decodedToken.email;
                if (!email) {
                    // Create a unique email based on Firebase UID
                    email = `user_${decodedToken.uid.slice(0, 8)}@firebase.local`;
                }
                email = email.toLowerCase().trim();

                const shouldBeAdmin = isAdminEmail(email);

                // Use findOneAndUpdate with upsert to ensure user always exists in database
                const upsertedUser = await User.findOneAndUpdate(
                    { firebaseUid: decodedToken.uid },
                    {
                        $setOnInsert: {
                            firebaseUid: decodedToken.uid,
                            email,
                            displayName: decodedToken.name || email.split('@')[0] || 'User',
                            picture: decodedToken.picture || '',
                            role: shouldBeAdmin ? 'admin' : 'user',
                        },
                        $set: {
                            email, // Always update email from token
                            role: shouldBeAdmin ? 'admin' : 'user', // Update role if should be admin
                        },
                    },
                    { upsert: true, new: true }
                );

                if (!upsertedUser) {
                    throw new Error('Failed to create or retrieve user');
                }

                user = upsertedUser.toObject() as unknown as UserAuthData;
                await cacheSet(userCacheKey, user, CACHE_TTL.USER_AUTH);
            } catch (dbError) {
                console.error('Auth middleware database error:', dbError);
                res.status(500).json({ error: 'Failed to authenticate user' });
                return;
            }
        }

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || user?.email || '',
            displayName: decodedToken.name || user?.displayName || '',
        };
        console.log('[AuthMiddleware] req.user successfully set:', req.user);

        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];

            try {
                const decodedToken = await verifyFirebaseToken(token);
                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email || '',
                    displayName: decodedToken.name,
                };
            } catch (error) {
                console.warn('Invalid token in optional auth:', error);
            }
        }

        next();
    } catch (error) {
        next();
    }
};
