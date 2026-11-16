import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAttachmentEntity1794832445333 implements MigrationInterface {
    name = 'CreateAttachmentEntity1794832445333'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalName" character varying NOT NULL, "storageName" character varying NOT NULL, "size" integer NOT NULL, "mimeType" character varying NOT NULL, "noteId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_5e99dcc33d5eec449f7cc2d94c9" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_5e99dcc33d5eec449f7cc2d94c9"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
    }

}
