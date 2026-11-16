import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { AttachmentsService } from "./attachments.service";
import {
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
        } catch {
          return cb(new UnsupportedMediaTypeException(), false);
        }
      },
    }),
  )
  @Post("notes/:id/attachment")
  postAttachment(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id") noteId: string,
    @UploadedFile("file") file: Express.Multer.File,
  ) {
    return this.attachmentsService.uploadAttachment(userId, noteId, file);
  }

  @Get("attachments/:id")
  getOneAttachment(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id") attachmentId: string,
  ) {
    return this.attachmentsService.getAttachmentById(userId, attachmentId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("attachments/:id")
  deleteOneAttachment(
    @CurrentUser("id") userId: ICurrentUser["id"],
    @Param("id") attachmentId: string,
  ) {
    return this.attachmentsService.deleteAttachmentById(userId, attachmentId);
  }
}
