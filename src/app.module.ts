import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { CategoriesModule } from "./categories/categories.module";
import { CommonModule } from "./common/common.module";
import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { databaseConfig } from "./database/database.config";
import { NotesModule } from "./notes/notes.module";
import { RbacModule } from "./rbac/rbac.module";
import { UsersModule } from "./users/users.module";
import { AttachmentsModule } from './attachments/attachments.module';

// TODO (student): ConfigModule, TypeOrmModule va boshqa modullarni shu yerga ulang.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({ ...databaseConfig, autoLoadEntities: true }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    RbacModule,
    NotesModule,
    CommonModule,
    AttachmentsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("/");
  }
}
