import { ILike } from "typeorm";
import { ICurrentUser } from "../auth/interfaces/current-user.interface";
import { INotesQuery } from "./interfaces/notes-query.interface";

export const buildNotesWhere = (
  userId: ICurrentUser["id"],
  args: Partial<
    Pick<INotesQuery, "categoryId" | "search"> & { isArchived: boolean }
  >,
) => {
  let { search, ...rest } = args;
  search = search && search.trim();
  return {
    userId,
    ...rest,
    ...(search && {
      title: ILike(`%${escapeLike(search)}%`),
    }),
    ...(search ? {} : { title: undefined }),
  };
};

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
