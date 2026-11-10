# HINTS — NoteFlow API uchun qisqa maslahatlar

Bu yerda tayyor yechim **yo'q** — faqat qayerdan boshlash va qayerda xato qilinishi. Avval o'zing urinib ko'r, qotib qolsang tegishli bo'limni och.

Har bir maslahat: **Muammo → Nima qilish kerak → Qayerga qarash kerak → Ko'p uchraydigan xato.**

Mundarija: 1 PostgreSQL · 2 `.env` · 3 TypeORM sozlash · 4 Birinchi Entity · 5 Bog'lanishlar · 6 Migration · 7 Repository · 8 DTO · 9 Parol · 10 JWT · 11 Guard/Roles · 12 Egalik · 13 Pagination · 14 Middleware · 15 Interceptor · 16 FileInterceptor · 17 Memory vs Disk · 18 Fayl validatsiyasi · 19 Lokal saqlash · 20 E2E testlar

---

## 1. PostgreSQL o'rnatish va ulanish

### `ECONNREFUSED 127.0.0.1:5432`

**Muammo:** ilova PostgreSQL'ga ulana olmayapti.

**Nima qilish kerak:**
1. `sudo systemctl status postgresql` — ishlayaptimi? Yo'q bo'lsa `sudo systemctl start postgresql`.
2. `.env` dagi `DB_HOST` va `DB_PORT` ni tekshir.
3. `pg_isready -h localhost -p 5432` — `accepting connections` chiqishi kerak.
4. Qayta ulanishga urin.

**Qayerga qarash kerak:** ASSIGNMENT.md → 7.6.

**Ko'p uchraydigan xato:** PostgreSQL o'rnatilgan bo'lsa ham, uning service'i ishga tushmagan bo'lishi mumkin. Yoki `DB_HOST=localhost` IPv6 (`::1`) ga o'tib ketgan — `127.0.0.1` yoz.

### `password authentication failed for user "noteflow"`

**Muammo:** user yoki parol mos emas.

**Nima qilish kerak:**
1. Avval qo'lda sina: `psql -h localhost -U noteflow -d noteflow_dev`.
2. Ishlamasa parolni qayta o'rnat: `sudo -u postgres psql -c "ALTER USER noteflow WITH PASSWORD 'noteflow_pass';"`.
3. `.env` dagi `DB_USERNAME`/`DB_PASSWORD` ni shunga moslab, ilovani qayta ishga tushir.

**Ko'p uchraydigan xato:** `-h localhost` yozmasdan `psql` ishlatish — u parolsiz «peer» orqali kiradi va parol xatosini yashiradi.

### `database "..." does not exist` / `permission denied`

**Muammo:** database yo'q yoki user'da huquq yo'q.

**Nima qilish kerak:**
1. `sudo -u postgres psql -c "\l"` — ro'yxatda bormi?
2. Yo'q bo'lsa: `CREATE DATABASE noteflow_dev OWNER noteflow;`.
3. `permission denied` bo'lsa, superuser bilan **tegishli database ichida** `GRANT ALL ON SCHEMA public TO noteflow;` va `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` bajar.

**Ko'p uchraydigan xato:** `GRANT ... ON SCHEMA public` ni `postgres` database'ida bajarish — `\c noteflow_dev` bilan kerakli database'ga o'tish kerak.

---

## 2. `.env` sozlamalari

**Muammo:** `.env` yozilgan, lekin NestJS qiymatlarni ko'rmayapti yoki `undefined` keladi.

**Nima qilish kerak:**
1. Fayl nomi aynan `.env` (`.env.txt` emas) va `package.json` bilan bir papkada ekanini tekshir.
2. `AppModule` da `ConfigModule.forRoot({ isGlobal: true })` borligini tekshir.
3. Qiymatni olish uchun `configService.getOrThrow('DB_HOST')` ishlat — yo'q bo'lsa aniq xato beradi.
4. `.env` ni o'zgartirgandan keyin ilovani **qayta ishga tushir**.

**Qayerga qarash kerak:** NestJS docs → *Configuration*.

**Ko'p uchraydigan xato:** `=` atrofida bo'sh joy yoki qo'shtirnoq yozish (`DB_PORT = "5432"`). Va yana: `.env` dagi hamma narsa **matn** — `DB_PORT` ni songa aylantirmasang, ulanish xato berishi mumkin.

---

## 3. TypeORM konfiguratsiyasi

**Muammo:** `TypeOrmModule` ga `ConfigService` qiymatlarini qanday berish kerak?

**Nima qilish kerak:**
1. `TypeOrmModule.forRoot(...)` emas, `forRootAsync({ inject: [ConfigService], useFactory: (config) => ({ ... }) })` ishlat.
2. `useFactory` ichida `type: 'postgres'`, host, port (`Number(...)`), username, password, database, `autoLoadEntities: true`, `synchronize: false` qaytar.
3. **Alohida** `src/database/data-source.ts` yarat: `export default new DataSource({...})`. U migration CLI va testlar uchun kerak, chunki ular NestJS'siz ishlaydi.
4. Ikkala joyda sozlamalar bir xil bo'lsin.

**Qayerga qarash kerak:** NestJS docs → *Database (TypeORM)*; TypeORM docs → *Data Source Options*.

**Ko'p uchraydigan xato:** `data-source.ts` da `export default` o'rniga `export const` yozish — testlar default export kutadi. Va `entities` glob'i (`**/*.entity{.ts,.js}`) fayl nomlariga mos kelmasligi.

---

## 4. Birinchi Entity

**Muammo:** Entity yozdim, lekin jadval paydo bo'lmayapti.

**Nima qilish kerak:**
1. Fayl `user.entity.ts` deb nomlangan, klass `@Entity('users')` bilan belgilangan.
2. PK: `@PrimaryGeneratedColumn('uuid')`. Sanalar: `@CreateDateColumn()`, `@UpdateDateColumn()`.
3. `email` uchun `@Column({ unique: true })`.
4. `role` uchun `@Column({ type: 'enum', enum: UserRole, default: UserRole.USER })`.
5. Entity **o'zi jadval yaratmaydi** — migration kerak (6-bo'lim).

**Qayerga qarash kerak:** TypeORM docs → *Entities*.

**Ko'p uchraydigan xato:** `synchronize: true` ni yoqib qo'yish — taqiqlangan. Yoki entity'ni `forFeature([...])` ga qo'shishni unutish.

---

## 5. Entity bog'lanishlari

**Muammo:** `@ManyToOne` yozdim, lekin `where: { userId }` ishlamayapti yoki ustun nomi chalkash.

**Nima qilish kerak:**
1. «Ko'p» tomonda: `@ManyToOne(() => User, { onDelete: ... })` + `@JoinColumn({ name: 'userId' })`.
2. Xuddi shu nomli ustunni alohida e'lon qil: `@Column() userId: string;`. Shunda `where: { userId }` oddiy ishlaydi.
3. Nullable bog'lanish (`Note.categoryId`): `@Column({ nullable: true }) categoryId: string | null;` va `@ManyToOne(..., { nullable: true, onDelete: 'SET NULL' })`.
4. `@OneToMany` ni faqat kerak bo'lsa yoz.

**Qayerga qarash kerak:** TypeORM docs → *Many-to-one / one-to-many relations*.

**Ko'p uchraydigan xato:** `onDelete` ni entity'da yozib, migration yaratishni unutish. Yoki nullable ustunga `type` bermaslik (`string | null` uchun TypeORM tipni aniqlay olmaydi — `type: 'uuid'` yoz).

---

## 6. Migration

**Muammo:** `migration:generate` hech narsa yaratmayapti yoki xato beryapti.

**Nima qilish kerak:**
1. `npm run migration:generate -- src/database/migrations/CreateUsers` (yo'l **`--` dan keyin**).
2. `No changes in database schema were found` — entity topilmayapti. `data-source.ts` dagi `entities` va fayl nomini (`*.entity.ts`) tekshir.
3. Yaratilgan faylni **o'qi**: `up()` va `down()`.
4. `npm run migration:run`, keyin `npm run migration:show`.
5. Xato qilsang: `npm run migration:revert`.

**Qayerga qarash kerak:** TypeORM docs → *Migrations*.

**Ko'p uchraydigan xato:** qo'llangan migration faylini tahrirlash. Yangi o'zgarish uchun **yangi** migration yarat. Yana: test database'ga migration qo'llanmagani uchun `relation "..." does not exist` — e2e testlar buni o'zi qiladi, lekin faqat migration fayli bo'lsa.

---

## 7. Repository

**Muammo:** service ichida database bilan qanday ishlayman?

**Nima qilish kerak:**
1. Modulda `TypeOrmModule.forFeature([Note, Category])`.
2. Service konstruktorida `@InjectRepository(Note) private notes: Repository<Note>`.
3. Asosiy metodlar: `findOne({ where })`, `find`, `findAndCount`, `create`, `save`, `remove`, `count`.
4. `findOne` topmasa `null` qaytaradi — o'zing `NotFoundException` tashla.

**Qayerga qarash kerak:** TypeORM docs → *Repository API / Find Options*.

**Ko'p uchraydigan xato:** `findOne({ where: { id } })` ni `userId`siz yozish — boshqa user ma'lumotini ochib qo'yadi. Yana: `findOne({ where: { id: undefined } })` **birinchi qatorni** qaytaradi!

---

## 8. DTO validatsiya

**Muammo:** DTO tekshirilmayapti yoki ortiqcha maydon o'tib ketyapti.

**Nima qilish kerak:**
1. `src/app.setup.ts` da `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`.
2. Har bir maydonga dekorator: `@IsEmail()`, `@IsString()`, `@MinLength`, `@MaxLength`, `@IsOptional()`, `@IsUUID()`.
3. Parol: `@MinLength(8)` + `@Matches(/[A-Za-z]/)` + `@Matches(/\d/)`.
4. Bo'sh joydan iborat nom (`"   "`) uchun: `@Transform(({ value }) => typeof value === 'string' ? value.trim() : value)` + `@IsNotEmpty()`.
5. `UpdateXDto` uchun maydonlarni `@IsOptional()` bilan qayta yozish mumkin (yoki `@nestjs/mapped-types` dagi `PartialType` ni o'rnatib ishlat).

**Qayerga qarash kerak:** NestJS docs → *Validation*; class-validator README.

**Ko'p uchraydigan xato:** DTO'ni `interface` qilib yozish (ishlamaydi — klass bo'lishi kerak). Yoki DTO'da e'lon qilinmagan maydon yuborilganda 400 kutish o'rniga `forbidNonWhitelisted` ni qo'yishni unutish.

---

## 9. Parolni hash qilish

**Muammo:** parolni xavfsiz saqlash va javobdan yashirish.

**Nima qilish kerak:**
1. `bcrypt.hash(plain, 10)` va `bcrypt.compare(plain, hash)` — ikkalasi `Promise`.
2. Ularni `src/common/utils/password.util.ts` ga `hashPassword`/`comparePassword` qilib o'ra.
3. Hash'ni javobdan olib tashlash uchun ikki yo'l: (a) ustunga `@Column({ select: false })` — login'da `addSelect('user.passwordHash')` kerak bo'ladi; yoki (b) javob qaytarishdan oldin `const { passwordHash, ...safe } = user`.

**Qayerga qarash kerak:** `bcrypt` README; TypeORM docs → *select: false*.

**Ko'p uchraydigan xato:** `await` qo'ymaslik (`compare` doim «truthy» Promise qaytaradi → har qanday parol o'tadi!). Yoki `users` ro'yxatida hash chiqib ketishi (`GET /users` da ham tekshir).

---

## 10. JWT autentifikatsiya

**Muammo:** token yaratildi, lekin himoyalangan endpoint 401 beryapti.

**Nima qilish kerak:**
1. `JwtModule.registerAsync` — `secret` (`JWT_SECRET`), `signOptions: { expiresIn: ... }` ni `ConfigService`dan ol.
2. `JwtStrategy extends PassportStrategy(Strategy)`: `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`, `secretOrKey`, `ignoreExpiration: false`.
3. `validate(payload)` ichida userni `payload.sub` bo'yicha bazadan ol; topilmasa `UnauthorizedException`. Qaytgan qiymat `request.user` bo'ladi.
4. `JwtStrategy` ni `AuthModule` `providers` ga qo'sh.
5. `JwtAuthGuard extends AuthGuard('jwt')`.
6. Tokenni `jwt.io` ga qo'yib payload'ni ko'r.

**Qayerga qarash kerak:** NestJS docs → *Authentication*; `passport-jwt` README.

**Ko'p uchraydigan xato:** `Bearer` va token orasida bo'sh joy yo'qligi; strategiyani provider qilmaslik; `secretOrKey` `undefined` bo'lishi (`.env` o'qilmagan). Login `201` qaytarishi — `@HttpCode(200)` kerak.

---

## 11. Guard va Roles

**Muammo:** `@Roles(ADMIN)` yozdim, lekin guard rolni ko'rmayapti.

**Nima qilish kerak:**
1. `roles.decorator.ts`: `export const ROLES_KEY = 'roles'; export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);`
2. `RolesGuard` konstruktorida `Reflector`; `canActivate` ichida `reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()])`.
3. Metadata yo'q → `true`. Bor bo'lsa `request.user?.role` ro'yxatda bormi.
4. Ishlatish: `@UseGuards(JwtAuthGuard, RolesGuard)` — **shu tartibda**.
5. Avval unit test: `npm run test:m3`.

**Qayerga qarash kerak:** NestJS docs → *Authorization* (RBAC) va *Guards*.

**Ko'p uchraydigan xato:** `RolesGuard` ni `JwtAuthGuard` dan oldin qo'yish — `request.user` hali yo'q. Yoki `getHandler()` ni ishlatib, klass darajasidagi `@Roles` ni o'tkazib yuborish.

---

## 12. Egalik (ownership)

**Muammo:** boshqa userning note'iga kirib bo'lmasligini qanday ta'minlayman?

**Nima qilish kerak:**
1. Controller'da `@CurrentUser()` bilan userni ol, `user.id` ni service'ga ber.
2. Service'dagi **har bir** so'rovda `where: { id, userId: user.id }`.
3. Topilmasa `NotFoundException` — «yo'q» va «boshqaniki» bir xil 404.
4. Note'ga `categoryId` berilganda: `categoryRepo.findOne({ where: { id: categoryId, userId } })`, topilmasa 404.
5. Attachment uchun: attachment → note → `note.userId === user.id`. `relations: { note: true }` yoki `where: { id, note: { userId } }` ishlat.
6. Users uchun qoida boshqa: `user.id !== id && user.role !== ADMIN` → `ForbiddenException`.

**Qayerga qarash kerak:** TypeORM docs → *Find Options → where (nested relations)*.

**Ko'p uchraydigan xato:** egalikni faqat `GET`da tekshirib, `PATCH`/`DELETE`da unutish. Yoki `userId` ni body'dan olish.

---

## 13. Pagination, filtr, qidiruv

**Muammo:** query parametrlari matn bo'lib keladi va filtrlar noto'g'ri ishlaydi.

**Nima qilish kerak:**
1. Query DTO: `page`/`limit` — `@Type(() => Number) @IsInt() @Min(1)`, limit uchun `@Max(50)`; ikkalasi `@IsOptional()`.
2. `isArchived`: `@Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)` + `@IsBoolean()`.
3. `findAndCount({ where, order: { createdAt: 'DESC' }, skip, take })` → `[data, total]`.
4. Qidiruv: `title: ILike('%...%')` (TypeORM'dan `ILike`). `%`, `_`, `\` oldiga `\` qo'y: `s.replace(/[\\%_]/g, '\\$&')`.
5. Avval unit testlar: `npm run test:m6`.

**Qayerga qarash kerak:** TypeORM docs → *FindOperators (ILike), findAndCount*; NestJS docs → *Transform*.

**Ko'p uchraydigan xato:** `@Type(() => Boolean)` ishlatish — `"false"` ham `true` bo'lib qoladi! Yana: `if (isArchived)` deb tekshirish (`false` tashlab yuboriladi — `!== undefined` ishlat). `page=1.5` va `limit=51` ham 400 berishi kerak.

---

## 14. Middleware

**Muammo:** log yozilmayapti yoki parol/token logga tushib ketyapti.

**Nima qilish kerak:**
1. `@Injectable() class LoggerMiddleware implements NestMiddleware` — `use(req, res, next)`.
2. Vaqtni eslab qol, `res.on('finish', () => { ...log... })`, `next()`.
3. Bitta qator: `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`. `new Logger('HTTP').log(...)` ishlat.
4. Body/header'larni **umuman yozma**. Kerak bo'lsa `redactSensitive` dan o't.
5. `AppModule implements NestModule` + `configure(consumer) { consumer.apply(LoggerMiddleware).forRoutes('*') }`. Ogohlantirish chiqsa Nest 11 uchun `'{*splat}'` ni sinab ko'r.
6. Avval `redactSensitive` unit testini yoz: rekursiv, **nusxa** qaytaradi, kalitlar katta-kichik harfga e'tiborsiz.

**Qayerga qarash kerak:** NestJS docs → *Middleware*.

**Ko'p uchraydigan xato:** `next()` ni chaqirmaslik (so'rov osilib qoladi). Yoki loglashni `use()` ichida darhol qilib, status hali noma'lum bo'lishi — `finish` hodisasini kut.

---

## 15. Interceptor

**Muammo:** `X-Response-Time` xato javoblarda chiqmayapti.

**Nima qilish kerak:**
1. `intercept(context, next)` boshida vaqtni ol; `res = context.switchToHttp().getResponse()`.
2. Muvaffaqiyatda: `next.handle().pipe(tap(() => res.setHeader(...)))`.
3. Xatoda: `catchError(err => { res.setHeader(...); return throwError(() => err); })`.
4. Format: `${Math.round(ms)}ms`.
5. `setupApp` ichida `app.useGlobalInterceptors(new TimingInterceptor())`.

**Qayerga qarash kerak:** NestJS docs → *Interceptors*; RxJS: `tap`, `catchError`.

**Ko'p uchraydigan xato:** faqat `tap(() => ...)` ishlatish — xatoda u chaqirilmaydi. Yana: 401 da header **bo'lmaydi** — Guard Interceptor'dan oldin ishlaydi, bu normal.

---

## 16. FileInterceptor va Multer

**Muammo:** `@UploadedFile()` `undefined` qaytaryapti yoki 413 chiqmayapti.

**Nima qilish kerak:**
1. `@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))`.
2. Parametr: `@UploadedFile() file: Express.Multer.File | undefined`. `@types/multer` o'rnatilgan.
3. So'rovda maydon nomi **aynan `file`** (Postman → form-data → turi *File*).
4. Fayl yo'q bo'lsa `file === undefined` — `validateUploadedFile` 400 tashlasin.
5. Mijoz `Content-Type` ni qo'lda `application/json` qilib qo'ymasin — Postman/curl `multipart/form-data` ni o'zi qo'yadi.

**Qayerga qarash kerak:** NestJS docs → *File upload*; Multer README (*limits*).

**Ko'p uchraydigan xato:** maydon nomi mos emas (`'file'` vs `'image'`) → 400. Yana: interceptor Pipe'lardan **oldin** ishlaydi, shuning uchun noto'g'ri `:noteId` bilan ham Multer avval fayl qabul qiladi (Memory storage bo'lsa zarari yo'q).

---

## 17. MemoryStorage va DiskStorage

**Muammo:** qaysi birini tanlayman?

**Nima qilish kerak:**
1. Tavsiya: **MemoryStorage** (default, `storage` bermasang shu). Fayl `file.buffer` da keladi.
2. Service tartibi: note egaligini tekshir (404) → validatsiya (415/413) → diskka yoz → DB'ga yoz.
3. DB yozuvi xato bersa, yozilgan faylni `unlink` qil.
4. DiskStorage tanlasang: fayl controller'ga yetmasdan yoziladi. 404/415 holatida uni o'zing o'chirishing shart (testlar «hech narsa saqlanmadi» deb tekshiradi).

**Qayerga qarash kerak:** Multer README → *DiskStorage / MemoryStorage*.

**Ko'p uchraydigan xato:** DiskStorage + egalik tekshiruvi keyin → ruxsatsiz so'rovda ham diskda fayl qoladi. Memory'da `file.path` yo'q — uni o'qishga urinish `undefined` beradi.

---

## 18. Fayl validatsiyasi

**Muammo:** turli xatolar uchun to'g'ri status kodini qaytarish.

**Nima qilish kerak:**
1. `validateUploadedFile(file)`: tartib — yo'q → `BadRequestException`; tur → `UnsupportedMediaTypeException`; hajm → `PayloadTooLargeException`.
2. `ALLOWED_MIME_TYPES.includes(file.mimetype)`.
3. `generateStorageName(original)`: `randomUUID()` + `path.extname(original).toLowerCase()`. Asl nomdan **faqat** kengaytma olinadi.
4. Kengaytma ichida g'alati belgilar bo'lsa (`.p/ng`) tashlab yubor: `/^\.[a-z0-9]{1,10}$/` ga mosligini tekshir.
5. Unit test: `npm run test:m8`.

**Qayerga qarash kerak:** NestJS docs → *Built-in HTTP exceptions*; Node docs → `path.extname`, `crypto.randomUUID`.

**Ko'p uchraydigan xato:** `originalname` ni to'g'ridan-to'g'ri yo'lga qo'shish (`../../x`). Yoki `size > MAX` o'rniga `>=` yozish — aynan 5 MB ruxsat.

---

## 19. Lokal saqlash

**Muammo:** fayl yozilmayapti yoki test «yo'l sizdi» deydi.

**Nima qilish kerak:**
1. Papka: `process.env.UPLOAD_DIR` yoki `ConfigService` orqali — **har so'rovda** o'qi (testlar uni o'zgartiradi).
2. Yozishdan oldin `await fs.promises.mkdir(dir, { recursive: true })`.
3. `await fs.promises.writeFile(path.join(dir, storageName), file.buffer)`.
4. `try/catch`: xatoda `new InternalServerErrorException('Failed to store file')` — **umumiy** xabar, yo'lsiz. DB'ga yozma.
5. O'chirishda: `fs.promises.unlink(...)`; `err.code === 'ENOENT'` bo'lsa e'tibor berma.
6. Yuklab olish: `res.download(fullPath, originalName)` yoki `StreamableFile` + `Content-Type`/`Content-Disposition`.
7. Note o'chirishdan **oldin** uning attachment'larini ro'yxatga ol va fayllarini o'chir.

**Qayerga qarash kerak:** Node docs → `fs/promises`; NestJS docs → *Streaming files*.

**Ko'p uchraydigan xato:** javobga butun entity'ni qaytarish (`storageName` sizib chiqadi) — alohida javob obyekti yasa. Yoki xato xabariga `err.message` ni qo'shish (u yo'lni o'z ichiga oladi). Yoki `UPLOAD_DIR` ni modul yuklanayotganda bir marta o'qib, `const` ga saqlash.

---

## 20. E2E testlarni ishga tushirish

**Muammo:** testlar boshlanmayapti yoki qizil.

**Nima qilish kerak:**
1. `.env.test` bor-yo'qligini tekshir (`cp .env.test.example .env.test`), `DB_DATABASE=noteflow_test`.
2. Test database mavjudligini tekshir: `sudo -u postgres psql -c "\l"`.
3. Milestone bo'yicha yur: `npm run test:m1`, keyin `m2`, ...
4. Bitta testni: `npx jest -c test/jest.config.js --runInBand -t "test nomidan bo'lak"`.
5. Qizil testda: kutilgan va kelgan **status kodini** o'qi, keyin shu so'rovni Postman/`curl` bilan takrorla.
6. `Cannot find module '../../src/...'` — ASSIGNMENT.md 9.1 jadvalidagi fayl yo'qligini bildiradi.

**Qayerga qarash kerak:** ASSIGNMENT.md → 19-bo'lim; Jest docs → *CLI options*.

**Ko'p uchraydigan xato:** testni `noteflow_dev` ga yo'naltirishga urinish (infratuzilma rad etadi — bu to'g'ri!). Yoki `data-source.ts` ni `test` rejimida boshqa `.env` bilan o'qishga urinish — `.env.test` allaqachon yuklangan, `dotenv/config` uni ustidan yozmaydi.
