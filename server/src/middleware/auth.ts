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
            const dbUser = await User.findOne({ firebaseUid: decodedToken.uid });

            if (!dbUser) {
                try {
                    const email = decodedToken.email || `user_${decodedToken.uid}@example.com`;
                    const newUser = await User.create({
                        firebaseUid: decodedToken.uid,
                        email,
                        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
                        picture: decodedToken.picture || '',
                        role: isAdminEmail(email) ? 'admin' : 'user',
                    });
                    user = newUser.toObject() as unknown as UserAuthData;
                } catch (dbError) {
                    const retryUser = await User.findOne({ firebaseUid: decodedToken.uid });
                    if (retryUser) {
                        user = retryUser.toObject() as unknown as UserAuthData;
                    } else {
                        user = {
                            firebaseUid: decodedToken.uid,
                            email: decodedToken.email || '',
                            displayName: decodedToken.name || decodedToken.email || 'User',
                            role: 'user',
                        };
                    }
                }
            } else {
                user = dbUser.toObject() as unknown as UserAuthData;
            }

            if (user) {
                const tokenEmail = decodedToken.email || user.email;
                const shouldBeAdmin = isAdminEmail(tokenEmail);
                const updates: Partial<Pick<UserAuthData, 'email' | 'role'>> = {};

                if (tokenEmail && user.email !== tokenEmail) {
                    updates.email = tokenEmail;
                    user.email = tokenEmail;
                }

                if (shouldBeAdmin && user.role !== 'admin') {
                    updates.role = 'admin';
                    user.role = 'admin';
                }

                if (Object.keys(updates).length > 0) {
                    await User.updateOne({ firebaseUid: decodedToken.uid }, { $set: updates });
                    await cacheDel(userCacheKey);
                }

                await cacheSet(userCacheKey, user, CACHE_TTL.USER_AUTH);
            }
        }

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || user?.email || '',
            displayName: decodedToken.name || user?.displayName || '',
        };

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
