import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { IPagination } from "../interfaces/pagination.interface";

@Injectable()
export class ParsePaginationPipe implements PipeTransform<
  unknown,
  IPagination
> {
  transform(value: Omit<IPagination, "skip">): IPagination {
    const page = Number(value.page ?? 1);
    const limit = Number(value.limit ?? 10);

    if (!Number.isInteger(page) || page < 1) throw new BadRequestException();
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
      throw new BadRequestException();

    return {
      page,
      limit,
      skip: (page - 1) * limit,
    };
  }
}
