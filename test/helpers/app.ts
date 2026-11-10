import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { setupApp } from '../../src/app.setup';
import { assertConnectedToTestDatabase } from '../setup/safety';

/**
 * Haqiqiy AppModule'dan to'liq ilova yaratadi (main.ts dagidek setupApp bilan).
 * Ulanishdan keyin darhol server aynan test database'ga ulanganini tekshiradi.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  setupApp(app);
  await app.init();

  let dataSource: DataSource;
  try {
    dataSource = app.get(DataSource);
  } catch {
    await app.close();
    throw new Error(
      "AppModule ichida TypeOrmModule.forRoot/forRootAsync ulanmagan (DataSource topilmadi). 1-milestone'ni bajaring.",
    );
  }
  try {
    await assertConnectedToTestDatabase(dataSource);
  } catch (err) {
    await app.close();
    throw err;
  }
  return app;
}
