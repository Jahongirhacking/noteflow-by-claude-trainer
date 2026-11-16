import { IPagination } from "../interfaces/pagination.interface";

const DEFAULT_PAGE = 1,
  DEFAULT_LIMIT = 10;

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
) => {
  page = page || DEFAULT_PAGE;
  limit = limit || DEFAULT_LIMIT;
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getPagination = (
  pagination: Partial<Pick<IPagination, "page" | "limit">>,
) => {
  const page = pagination.page || DEFAULT_PAGE;
  const limit = pagination.limit || DEFAULT_LIMIT;
  return {
    page: page || DEFAULT_PAGE,
    limit: limit || DEFAULT_LIMIT,
    skip: (page - 1) * limit,
  };
};
