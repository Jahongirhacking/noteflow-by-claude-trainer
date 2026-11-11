import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { setupApp } from "./app.setup";

async function bootstrap() {
  const logger = new Logger("Server");
  const app = await NestFactory.create(AppModule);
  setupApp(app); // global pipe, interceptor, ... (src/app.setup.ts)
  const PORT = process.env.PORT ?? 3000;
  await app.listen(PORT);
  logger.log(`Server is running on http://localhost:${PORT}`);
}
bootstrap();
