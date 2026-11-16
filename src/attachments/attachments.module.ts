import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotesModule } from "../notes/notes.module";
import { AttachmentEntity } from "./attachment.entity";
import { AttachmentsController } from "./attachments.controller";
import { AttachmentsService } from "./attachments.service";

@Module({
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  imports: [TypeOrmModule.forFeature([AttachmentEntity]), NotesModule],
})
export class AttachmentsModule {}
