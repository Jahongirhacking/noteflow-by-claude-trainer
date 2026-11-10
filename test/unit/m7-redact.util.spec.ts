import { redactSensitive } from '../../src/common/utils/redact.util';

describe('[M7] redactSensitive (log uchun maxfiy ma`lumotlarni yashirish)', () => {
  const R = '[REDACTED]';

  it('password, passwordHash, token, authorization kalitlarini yashiradi', () => {
    const out = redactSensitive({
      email: 'a@b.com',
      password: 'Secret123',
      passwordHash: '$2b$10$abc',
      accessToken: 'eyJ.x.y',
      authorization: 'Bearer eyJ.x.y',
    });
    expect(out).toEqual({
      email: 'a@b.com',
      password: R,
      passwordHash: R,
      accessToken: R,
      authorization: R,
    });
  });

  it('kalit nomidagi katta-kichik harfga e`tibor bermaydi (Authorization, PASSWORD)', () => {
    expect(redactSensitive({ Authorization: 'Bearer x', PASSWORD: 'p' })).toEqual({
      Authorization: R,
      PASSWORD: R,
    });
  });

  it('ichma-ich obyekt va massivlarni ham tozalaydi', () => {
    const out = redactSensitive({
      headers: { authorization: 'Bearer x', accept: 'json' },
      users: [{ name: 'Ali', password: 'p1' }],
    });
    expect(out).toEqual({
      headers: { authorization: R, accept: 'json' },
      users: [{ name: 'Ali', password: R }],
    });
  });

  it('asl obyektni o`zgartirmaydi (mutatsiya yo`q)', () => {
    const input = { password: 'p', nested: { token: 't' } };
    redactSensitive(input);
    expect(input).toEqual({ password: 'p', nested: { token: 't' } });
  });

  it('primitiv qiymatlar va null/undefined bilan xato bermaydi', () => {
    expect(redactSensitive('matn')).toBe('matn');
    expect(redactSensitive(42)).toBe(42);
    expect(redactSensitive(null)).toBeNull();
    expect(redactSensitive(undefined)).toBeUndefined();
  });
});
