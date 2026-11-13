import { Module } from "@nestjs/common";
import { ParsePaginationPipe } from "./pipes/parse-pagination.pipe";

@Module({
  providers: [ParsePaginationPipe],
  exports: [ParsePaginationPipe],
})
export class CommonModule {}
