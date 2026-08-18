import request from 'supertest';
import type { Express } from 'express';
import { TEST_PASSWORD } from './fixtures';

/** Log in via the real API and return the issued JWT. */
export async function login(app: Express, email: string, password = TEST_PASSWORD): Promise<string> {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password })
        .set('Content-Type', 'application/json');
    const token = res.body?.user?.token || res.body?.token;
    if (!token) {
        throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
    }
    return token;
}

export const bearer = (token: string) => `Bearer ${token}`;
