import { IPagination } from "../../common/interfaces/pagination.interface";

type IPaginationWithoutSkip = Omit<IPagination, "skip">;
export interface INotesQuery extends IPaginationWithoutSkip {
  categoryId: string;
  isArchived: string;
  search: string;
}

type INotesWithoutPagination = Omit<
  INotesQuery,
  "page" | "limit" | "isArchived"
>;
export interface INotesTransformed extends INotesWithoutPagination {
  pagination: IPagination;
  isArchived: boolean;
}
