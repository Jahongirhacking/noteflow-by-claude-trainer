import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCategoryDescriptionNullable1794576206542 implements MigrationInterface {
    name = 'MakeCategoryDescriptionNullable1794576206542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "description" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "description" SET NOT NULL`);
    }

}
