import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
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

    return {
      pagination,
      ...value,
      isArchived: value.isArchived === "true",
    };
  }
}
