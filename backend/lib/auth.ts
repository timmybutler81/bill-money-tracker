import { adminAuth } from './firebase-admin';
import { prisma } from './prisma';

type RequireAppUserResult =
  | { user: { id: string; firebaseUid: string } }
  | { error: Response };

function unauthorized(message: string, status = 401) {
  return Response.json({ error: message }, { status });
}

export async function requireAppUser(request: Request): Promise<RequireAppUserResult> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { error: unauthorized('Missing bearer token') };
  }

  const idToken = authHeader.slice('Bearer '.length).trim();

  if (!idToken) {
    return { error: unauthorized('Missing Firebase ID token') };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);

    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: {},
      create: {
        firebaseUid: decoded.uid,
      },
      select: {
        id: true,
        firebaseUid: true,
      },
    });

    return { user };
  } catch (error) {
    console.error('Failed to verify Firebase token', error);
    return { error: unauthorized('Invalid or expired token') };
  }
}