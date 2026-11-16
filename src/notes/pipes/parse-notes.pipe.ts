import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { isUUID } from "class-validator";
import { ParsePaginationPipe } from "../../common/pipes/parse-pagination.pipe";
import {
  INotesQuery,
  INotesTransformed,
} from "../interfaces/notes-query.interface";

@Injectable()
export class ParseNotesPipe implements PipeTransform {
  transform(value: INotesQuery, metadata: ArgumentMetadata): INotesTransformed {
    const allowedParams = [
      "page",
      "limit",
      "categoryId",
      "isArchived",
      "search",
    ];

    if (Object.keys(value).some((k) => !allowedParams.includes(k)))
      throw new BadRequestException();

    const pagination = new ParsePaginationPipe().transform({
      page: value.page,
      limit: value.limit,
    });

    if (
      value.isArchived !== undefined &&
      value.isArchived !== "true" &&
      value.isArchived !== "false"
    ) {
      throw new BadRequestException("isArchived must be true or false");
    }

    if (value.categoryId && !isUUID(value.categoryId))
      throw new BadRequestException();

    const { page: _, limit: __, ...properties } = value;

    return {
      pagination,
      ...properties,
      isArchived:
        value.isArchived === "true"
          ? true
          : value.isArchived === "false"
            ? false
            : undefined,
    };
  }
}
