import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { AttachmentsService } from "./attachments.service";
import {
  baseAttachmentDir,
  MAX_FILE_SIZE_BYTES,
  validateUploadedFile,
} from "./file-validation.util";

@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
      },
      fileFilter: async (req, file, cb) => {
        try {
          validateUploadedFile(file);
          cb(null, true);
        } catch (err: any) {
          return cb(err, false);
        }
      },
    }),
  )
  @Post("notes/:id/attachments")
  postAttachment(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id", ParseUUIDPipe) noteId: string,
    @UploadedFile("file") file: Express.Multer.File,
  ) {
    validateUploadedFile(file);
    return this.attachmentsService.uploadAttachment(userId, noteId, file);
  }

  @Get("notes/:id/attachments")
  getAttachmentByNote(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id", ParseUUIDPipe) noteId: string,
  ) {
    return this.attachmentsService.getAttachmentsByNote(userId, noteId);
  }

  @Get("attachments/:id")
  async getOneAttachment(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id", ParseUUIDPipe) attachmentId: string,
    @Res() res: Response,
  ) {
    const attachment = await this.attachmentsService.getAttachmentById(
      userId,
      attachmentId,
    );
    res.setHeader("Content-Type", attachment.mimeType);
    res.download(
      `${baseAttachmentDir}/${attachment.storageName}`,
      attachment.originalName,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("attachments/:id")
  deleteOneAttachment(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id", ParseUUIDPipe) attachmentId: string,
  ) {
    return this.attachmentsService.deleteAttachmentById(userId, attachmentId);
  }
}
