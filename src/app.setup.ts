import { INestApplication } from '@nestjs/common';

/**
 * Ilovaning global sozlamalari. Bu funksiyani HAM main.ts, HAM e2e testlar chaqiradi,
 * shuning uchun testlar ham xuddi haqiqiy ilovadagidek ishlaydi.
 *
 * TODO (student): bu yerga qo'shing:
 *  - global ValidationPipe (whitelist, forbidNonWhitelisted, transform)
 *  - global TimingInterceptor
 *  (Middleware esa AppModule ichida `configure()` orqali ulanadi.)
 */
export function setupApp(app: INestApplication): void {
  void app;
}
