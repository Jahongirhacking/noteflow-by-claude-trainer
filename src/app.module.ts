import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { CategoriesModule } from "./categories/categories.module";
import { databaseConfig } from "./database/database.config";
import { UsersModule } from "./users/users.module";

// TODO (student): ConfigModule, TypeOrmModule va boshqa modullarni shu yerga ulang.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({ ...databaseConfig, autoLoadEntities: true }),
    AuthModule,
    UsersModule,
    CategoriesModule,
  ],
})
export class AppModule {}
