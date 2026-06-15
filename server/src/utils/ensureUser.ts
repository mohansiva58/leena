import User from '../models/User';
import { isAdminEmail } from './admin';

interface EnsureUserInput {
    firebaseUid: string;
    email?: string;
    displayName?: string;
    picture?: string;
}

export async function ensureUserRecord(input: EnsureUserInput) {
    let email = input.email;
    if (!email) {
        email = `user_${input.firebaseUid.slice(0, 8)}@firebase.local`;
    }
    email = email.toLowerCase().trim();

    const shouldBeAdmin = isAdminEmail(email);
    const displayName = input.displayName || email.split('@')[0] || 'User';
    const photoURL = input.picture || '';

    try {
        return await User.findOneAndUpdate(
            { firebaseUid: input.firebaseUid },
            {
                $setOnInsert: {
                    firebaseUid: input.firebaseUid,
                },
                $set: {
                    email,
                    displayName,
                    photoURL,
                    role: shouldBeAdmin ? 'admin' : 'user',
                },
            },
            { upsert: true, new: true, runValidators: true }
        );
    } catch (dbError: unknown) {
        const err = dbError as { code?: number; keyPattern?: { email?: boolean } };
        if (err.code === 11000 && err.keyPattern?.email) {
            const linked = await User.findOneAndUpdate(
                {
                    email,
                    $or: [
                        { firebaseUid: { $exists: false } },
                        { firebaseUid: null },
                        { firebaseUid: '' },
                        { firebaseUid: input.firebaseUid },
                    ],
                },
                {
                    $set: {
                        firebaseUid: input.firebaseUid,
                        displayName,
                        photoURL,
                        role: shouldBeAdmin ? 'admin' : 'user',
                    },
                },
                { new: true, runValidators: true }
            );

            if (linked) {
                return linked;
            }

            const existing = await User.findOne({ email }).select('firebaseUid').lean();
            if (existing?.firebaseUid && existing.firebaseUid !== input.firebaseUid) {
                throw new Error(
                    'This email is already associated with a different account. Please sign in with the original login method or contact support.'
                );
            }

            throw dbError;
        }
        throw dbError;
    }
}
