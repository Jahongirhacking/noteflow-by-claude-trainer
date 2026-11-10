import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';

export const VALID_PASSWORD = 'Passw0rd!123';

let counter = 0;

export interface Credentials {
  fullName: string;
  email: string;
  password: string;
}

/** Har safar noyob email bilan to'g'ri ro'yxatdan o'tish ma'lumoti. */
export function buildUser(overrides: Partial<Credentials> = {}): Credentials {
  counter += 1;
  return {
    fullName: `Test User ${counter}`,
    email: `user${counter}-${Date.now()}@example.com`,
    password: VALID_PASSWORD,
    ...overrides,
  };
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
}

export async function registerUser(app: INestApplication, creds: Credentials = buildUser()) {
  const res = await request(app.getHttpServer()).post('/auth/register').send(creds);
  return { res, creds };
}

export async function loginUser(app: INestApplication, email: string, password: string) {
  const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
  return res;
}

/** Ro'yxatdan o'tadi, login qiladi va token qaytaradi. */
export async function createUser(
  app: INestApplication,
  overrides: Partial<Credentials> = {},
): Promise<TestUser> {
  const creds = buildUser(overrides);
  const reg = await registerUser(app, creds);
  if (reg.res.status !== 201) {
    throw new Error(`Test yordamchisi: register 201 qaytarishi kerak edi, ${reg.res.status} keldi.`);
  }
  const login = await loginUser(app, creds.email, creds.password);
  if (login.status !== 200 || !login.body.accessToken) {
    throw new Error(`Test yordamchisi: login 200 + accessToken qaytarishi kerak edi, ${login.status} keldi.`);
  }
  return { id: reg.res.body.id, email: creds.email, password: creds.password, token: login.body.accessToken };
}

/**
 * API orqali ADMIN yaratib bo'lmaydi (register har doim USER beradi).
 * Shuning uchun test database'da role'ni to'g'ridan-to'g'ri o'zgartiramiz, keyin qayta login qilamiz.
 */
export async function createAdmin(app: INestApplication): Promise<TestUser> {
  const user = await createUser(app, { fullName: 'Admin User' });
  await app.get(DataSource).query(`UPDATE users SET role = 'ADMIN' WHERE email = $1`, [user.email]);
  const login = await loginUser(app, user.email, user.password);
  return { ...user, token: login.body.accessToken };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
