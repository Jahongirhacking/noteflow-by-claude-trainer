import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNoteArchived1794578718771 implements MigrationInterface {
    name = 'AddNoteArchived1794578718771'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notes" ADD "isArchived" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notes" DROP COLUMN "isArchived"`);
    }

}
