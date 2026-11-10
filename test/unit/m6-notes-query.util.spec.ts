import { FindOperator } from 'typeorm';
import { buildNotesWhere } from '../../src/notes/notes-query.util';

describe('[M6] buildNotesWhere', () => {
  it('filtrsiz holatda faqat userId bo`yicha cheklaydi', () => {
    expect(buildNotesWhere('user-1', {})).toEqual({ userId: 'user-1' });
  });

  it('categoryId berilsa qo`shadi', () => {
    expect(buildNotesWhere('user-1', { categoryId: 'cat-1' })).toEqual({
      userId: 'user-1',
      categoryId: 'cat-1',
    });
  });

  it('isArchived=false ham filtr hisoblanadi (falsy qiymatni tashlab yubormaydi)', () => {
    expect(buildNotesWhere('user-1', { isArchived: false })).toEqual({
      userId: 'user-1',
      isArchived: false,
    });
    expect(buildNotesWhere('user-1', { isArchived: true })).toEqual({
      userId: 'user-1',
      isArchived: true,
    });
  });

  it('search — title bo`yicha katta-kichik harfga e`tiborsiz (ILIKE) qidiradi', () => {
    const where = buildNotesWhere('user-1', { search: 'meeting' }) as { title: FindOperator<string> };
    expect(where.title).toBeInstanceOf(FindOperator);
    expect(where.title.type).toBe('ilike');
    expect(where.title.value).toBe('%meeting%');
  });

  it('search atrofidagi bo`sh joylarni olib tashlaydi, faqat bo`sh joydan iborat search e`tiborga olinmaydi', () => {
    const trimmed = buildNotesWhere('user-1', { search: '  plan  ' }) as { title: FindOperator<string> };
    expect(trimmed.title.value).toBe('%plan%');
    expect(buildNotesWhere('user-1', { search: '   ' })).toEqual({ userId: 'user-1' });
  });

  it('search ichidagi % va _ belgilari oddiy harf sifatida qidiriladi (escape)', () => {
    const where = buildNotesWhere('user-1', { search: '100%_x' }) as { title: FindOperator<string> };
    expect(where.title.value).toBe('%100\\%\\_x%');
  });

  it('userId har doim bor — boshqa filtrlar uni olib tashlay olmaydi', () => {
    const where = buildNotesWhere('user-1', { categoryId: 'c', isArchived: true, search: 's' });
    expect(where).toMatchObject({ userId: 'user-1', categoryId: 'c', isArchived: true });
  });
});
