import { buildPaginationMeta, getPagination } from '../../src/common/utils/pagination.util';

describe('[M6] pagination.util', () => {
  describe('getPagination', () => {
    it('standart qiymatlar: page=1, limit=10, skip=0', () => {
      expect(getPagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
    });

    it('skip = (page - 1) * limit', () => {
      expect(getPagination({ page: 3, limit: 5 })).toEqual({ page: 3, limit: 5, skip: 10 });
    });
  });

  describe('buildPaginationMeta', () => {
    it('totalPages ni yuqoriga yaxlitlaydi', () => {
      expect(buildPaginationMeta(23, 1, 10)).toEqual({ total: 23, page: 1, limit: 10, totalPages: 3 });
    });

    it('bo`sh natija uchun totalPages = 0', () => {
      expect(buildPaginationMeta(0, 1, 10)).toEqual({ total: 0, page: 1, limit: 10, totalPages: 0 });
    });
  });
});
