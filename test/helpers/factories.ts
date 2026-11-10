import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bearer } from './auth';

let n = 0;

/** API orqali category yaratadi. Kutilgan status 201 bo'lmasa — aniq xabar bilan yiqiladi. */
export async function createCategory(
  app: INestApplication,
  token: string,
  body: Record<string, unknown> = {},
) {
  n += 1;
  const res = await request(app.getHttpServer())
    .post('/categories')
    .set(bearer(token))
    .send({ name: `Category ${n}`, description: 'Test category', ...body });
  if (res.status !== 201) {
    throw new Error(`Test yordamchisi: POST /categories 201 qaytarishi kerak edi, ${res.status} keldi.`);
  }
  return res.body as { id: string; name: string };
}

/** API orqali note yaratadi. */
export async function createNote(
  app: INestApplication,
  token: string,
  body: Record<string, unknown> = {},
) {
  n += 1;
  const res = await request(app.getHttpServer())
    .post('/notes')
    .set(bearer(token))
    .send({ title: `Note ${n}`, content: 'Test content', ...body });
  if (res.status !== 201) {
    throw new Error(`Test yordamchisi: POST /notes 201 qaytarishi kerak edi, ${res.status} keldi.`);
  }
  return res.body as { id: string; title: string; categoryId: string | null; isArchived: boolean };
}
