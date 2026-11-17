import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import path from "path";
import { cwd } from "process";

export const ALLOWED_MIME_TYPES: string[] = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "text/plain",
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const generateStorageName = (filename: string) => {
  const extension = filename.split(".").slice(-1).join("");
  return `${randomUUID()}.${extension.toLowerCase()}`;
};

export const baseAttachmentDir = path.resolve(
  cwd(),
  process.env.UPLOAD_DIR || "uploads",
);

export const validateUploadedFile = (file?: Partial<Express.Multer.File>) => {
  if (!file || !file.originalname) {
    throw new BadRequestException("File is required");
  }

  if (file.size && file?.size > MAX_FILE_SIZE_BYTES) {
    throw new PayloadTooLargeException("File is too large");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype ? file.mimetype : "")) {
    throw new UnsupportedMediaTypeException("Unsupported file type");
  }
};
