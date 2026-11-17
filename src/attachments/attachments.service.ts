import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { mkdir, unlink, writeFile } from "fs/promises";
import { Repository } from "typeorm";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { NotesService } from "../notes/notes.service";
import { AttachmentEntity } from "./attachment.entity";
import { baseAttachmentDir, generateStorageName } from "./file-validation.util";

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    private readonly notesService: NotesService,
  ) {}

  async uploadAttachment(
    userId: string,
    noteId: string,
    file: Express.Multer.File,
  ) {
    await this.notesService.getNoteById(userId, noteId);
    await mkdir(baseAttachmentDir, { recursive: true });
    const storageName = generateStorageName(file.originalname);
    const filePath = `${baseAttachmentDir}/${storageName}`;
    await writeFile(filePath, file.buffer);
    try {
      const attachment = this.attachmentRepository.create({
        noteId,
        mimeType: file.mimetype,
        originalName: file.originalname,
        size: file.size,
        storageName,
      });
      const { storageName: _omit, ...saved } =
        await this.attachmentRepository.save(attachment);
      return saved;
    } catch {
      await unlink(filePath).catch(() => undefined);
      throw new InternalServerErrorException();
    }
  }

  async getAttachmentsByNote(userId: string, noteId: string) {
    await this.notesService.getNoteById(userId, noteId);
    return this.attachmentRepository.find({ where: { noteId } });
  }

  async getAttachmentById(userId: ICurrentUser["id"], attachmentId: string) {
    const attachment = await this.attachmentRepository.findOne({
      where: { id: attachmentId },
      relations: { note: true },
    });
    if (attachment?.note?.userId !== userId) throw new NotFoundException();
    return attachment;
  }

  async deleteAttachmentById(userId: ICurrentUser["id"], attachmentId: string) {
    const attachment = await this.getAttachmentById(userId, attachmentId);
    try {
      await unlink(`${baseAttachmentDir}/${attachment.storageName}`);
    } catch (err: any) {
      if (err?.code !== "ENOENT") throw err;
    }
    await this.attachmentRepository.remove(attachment);
  }
}
