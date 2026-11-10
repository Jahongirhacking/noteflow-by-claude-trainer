import { comparePassword, hashPassword } from '../../src/common/utils/password.util';

describe('[M2] password.util', () => {
  const plain = 'Passw0rd!123';

  it('hash asl parolga teng emas va bcrypt formatida', async () => {
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('bir xil parol har safar boshqa hash beradi (salt)', async () => {
    const [a, b] = await Promise.all([hashPassword(plain), hashPassword(plain)]);
    expect(a).not.toBe(b);
  });

  it("to'g'ri parol uchun comparePassword true qaytaradi", async () => {
    const hash = await hashPassword(plain);
    await expect(comparePassword(plain, hash)).resolves.toBe(true);
  });

  it("noto'g'ri parol uchun comparePassword false qaytaradi", async () => {
    const hash = await hashPassword(plain);
    await expect(comparePassword('boshqa-parol1', hash)).resolves.toBe(false);
  });
});
