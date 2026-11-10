# NoteFlow API — NestJS topshirig'i

> **Daraja:** boshlang'ich-o'rta (beginner-friendly Middle)
> **Vaqt:** taxminan 2–3 hafta (har bir milestone uchun 1–2 kun)
> **Qo'shimcha hujjat:** `HINTS.md` — qiyin joylar uchun qisqa maslahatlar.

---

## Mundarija

1. [Loyiha haqida](#1-loyiha-haqida)
2. [Nima quramiz?](#2-nima-quramiz)
3. [Ishlatiladigan texnologiyalar](#3-ishlatiladigan-texnologiyalar)
4. [Loyiha ishlash jarayoni](#4-loyiha-ishlash-jarayoni)

- [PostgreSQL'ni NestJS bilan ulash — noldan](#postgresqlni-nestjs-bilan-ulash--noldan)

5. [Database bilan tanishish](#5-database-bilan-tanishish)
6. [PostgreSQL o'rnatish va database yaratish](#6-postgresql-ornatish-va-database-yaratish)
7. [NestJS va PostgreSQL ulanishi](#7-nestjs-va-postgresql-ulanishi)
8. [TypeORM va birinchi Migration](#8-typeorm-va-birinchi-migration)
9. [Loyihaning papkalar tuzilishi](#9-loyihaning-papkalar-tuzilishi)
10. [Har bir modulning vazifasi](#10-har-bir-modulning-vazifasi)
11. [Entity va ular orasidagi bog'lanishlar](#11-entity-va-ular-orasidagi-bog-lanishlar)
12. [API endpointlar ro'yxati](#12-api-endpointlar-royxati)
13. [Har bir endpoint batafsil](#13-har-bir-endpoint-batafsil)
14. [Authentication va JWT ishlash jarayoni](#14-authentication-va-jwt-ishlash-jarayoni)
15. [Guard va RBAC ishlash jarayoni](#15-guard-va-rbac-ishlash-jarayoni)
16. [Category va Note CRUD](#16-category-va-note-crud)
17. [Middleware va Interceptor](#17-middleware-va-interceptor)
18. [File Upload ishlash jarayoni](#18-file-upload-ishlash-jarayoni)
19. [Testlarni ishga tushirish](#19-testlarni-ishga-tushirish)
20. [Definition of Done](#20-definition-of-done)

---

## 1. Loyiha haqida

**NoteFlow** — shaxsiy yozuvlar (note) bilan ishlash uchun oddiy backend. Frontend yo'q — faqat **HTTP API**.
Sen uni **noldan**, bo'sh `src/` papkadan boshlab qurasan.

Foydalanuvchi:

- ro'yxatdan o'tadi va login qiladi;
- kategoriyalar (masalan «Ish», «O'qish») yaratadi;
- note yozadi va uni kategoriyaga joylaydi;
- note'larni qidiradi, filtrlaydi, arxivlaydi;
- note'ga fayl (rasm, PDF, matn) biriktiradi va yuklab oladi.

**ADMIN** esa foydalanuvchilar ro'yxatini ko'ra oladi.

### Bu topshiriqdan nimani o'rganasan?

Sen allaqachon alohida mashqlarda modul, controller, service, DTO, TypeORM, JWT, guard, middleware, interceptor va Multer'ni ko'rgansan. Bu yerda ularni **bitta ishlaydigan backend**ga birlashtirasan. Eng muhim yangi ko'nikma — **NestJS'ni PostgreSQL bilan noldan ulash** (5–8-bo'limlar).

### Muhim qoidalar

1. **Test-first.** Testlar tayyor. Sen ularni o'zgartirmaysan — kodni testlarga moslab yozasan.
2. **Milestone'lar ketma-ket.** Bitta milestone'ni yopmasdan keyingisiga o'tma.
3. `synchronize: true` **ishlatish taqiqlanadi**. Jadvallar faqat **migration** orqali yaratiladi.
4. Testlar uchun alohida database (`noteflow_test`) ishlatiladi. Uni **hech qachon** `noteflow_dev` bilan almashtirma — testlar jadvallarni tozalaydi.
5. Docker **shart emas**. Hammasi oddiy Ubuntu/Linux terminalida bajariladi.

---

## 2. Nima quramiz?

### Funksiyalar

| Modul       | Nima qila oladi                                                |
| ----------- | -------------------------------------------------------------- |
| Auth        | ro'yxatdan o'tish, login (JWT), joriy user                     |
| Users       | ADMIN hammani ko'radi; USER faqat o'zini ko'radi va yangilaydi |
| Categories  | har bir user o'z kategoriyalarini boshqaradi                   |
| Notes       | CRUD, arxivlash, pagination, filtr, qidiruv                    |
| Attachments | note'ga fayl yuklash, yuklab olish, o'chirish                  |
| Umumiy      | logging middleware, timing interceptor, bir xil xato formati   |

### 8 ta milestone

Har bir milestone alohida ishga tushiriladigan testlarga ega. **Ketma-ket bajar.**

| #   | Milestone                              | Test buyrug'i     | Qaysi bo'limlar |
| --- | -------------------------------------- | ----------------- | --------------- |
| M1  | Database ulanishi va dastlabki sozlama | `npm run test:m1` | 5–8             |
| M2  | Ro'yxatdan o'tish va autentifikatsiya  | `npm run test:m2` | 13, 14          |
| M3  | Users va RBAC                          | `npm run test:m3` | 13, 15          |
| M4  | Categories                             | `npm run test:m4` | 13, 16          |
| M5  | Notes                                  | `npm run test:m5` | 13, 16          |
| M6  | Qidiruv, filtr, pagination             | `npm run test:m6` | 13, 16          |
| M7  | Middleware, interceptor, xatolar       | `npm run test:m7` | 17              |
| M8  | Fayl yuklash va attachment             | `npm run test:m8` | 18              |

> Bu milestone'lar **alohida loyihalar emas**. Hammasi bitta NoteFlow API'ning bosqichlari.

### Nima QILINMAYDI

Microservices, Redis, WebSocket, Kubernetes, S3/R2, murakkab permission tizimi, CQRS — bularning hech biri kerak emas. Maqsad: oddiy, lekin to'liq ishlaydigan backend.

---

## 3. Ishlatiladigan texnologiyalar

| Texnologiya                                | Nima uchun                                     |
| ------------------------------------------ | ---------------------------------------------- |
| Node.js **>=24 <25**                       | ishga tushirish muhiti (`node -v` → `v24.x.x`) |
| NestJS 11                                  | backend framework                              |
| TypeScript                                 | til                                            |
| PostgreSQL                                 | ma'lumotlar bazasi                             |
| TypeORM 0.3                                | Entity, Repository, Migration                  |
| Passport + `@nestjs/jwt` + `passport-jwt`  | autentifikatsiya                               |
| bcrypt                                     | parolni hash qilish                            |
| class-validator, class-transformer         | DTO validatsiyasi                              |
| Multer (`@nestjs/platform-express` ichida) | fayl yuklash                                   |
| Jest + Supertest                           | unit va e2e testlar                            |

Barcha paketlar `package.json` da tayyor. Node 24 bilan mosligi tekshirilgan (shu jumladan `bcrypt` — u Node 24 uchun tayyor binary beradi).

### Birinchi qadamlar (boshlashdan oldin)

```bash
node -v                      # v24.x.x bo'lishi shart. Aks holda: nvm install 24 && nvm use 24
npm install                  # barcha paketlarni o'rnatadi
cp .env.example .env         # development sozlamalari (keyinroq to'ldirasan)
cp .env.test.example .env.test   # test sozlamalari
npm run build                # bo'sh skelet xatosiz kompilyatsiya bo'lishi kerak
```

> `npm install` paytida `bcrypt` haqida «install-scripts» ogohlantirishi chiqishi mumkin — bu xato emas.
> Agar `bcrypt` import qilganda xato chiqsa: `npm rebuild bcrypt`.

Repoda tayyor turgan fayllar (ularni o'chirma):

```
package.json, tsconfig*.json, nest-cli.json     ← sozlamalar
.env.example, .env.test.example                 ← sozlama namunalari
src/main.ts, src/app.module.ts, src/app.setup.ts ← bo'sh skelet (TODO'lar bor)
test/                                            ← BARCHA testlar va test infratuzilmasi
ASSIGNMENT.md, HINTS.md
```

---

## 4. Loyiha ishlash jarayoni

### 4.1. Bitta so'rov qanday o'tadi

Mijoz (masalan Postman yoki test) `POST /notes` yuboradi. NestJS ichida so'rov quyidagi **tartibda** o'tadi:

```
HTTP so'rov
   │
   ▼
1. Middleware        ← log yozadi (method, url, status, davomiylik)
   ▼
2. Guard             ← JWT to'g'rimi? (JwtAuthGuard) Roli mos keladimi? (RolesGuard)
   ▼
3. Interceptor       ← (oldin) vaqtni o'lchashni boshlaydi
   ▼
4. Pipe              ← DTO'ni tekshiradi va o'zgartiradi (ValidationPipe, ParseUUIDPipe)
   ▼
5. Controller        ← so'rovni qabul qiladi, Service'ni chaqiradi
   ▼
6. Service           ← biznes qoidalar (egasi kimligini tekshirish, ...)
   ▼
7. Repository        ← TypeORM orqali PostgreSQL bilan gaplashadi
   ▼
PostgreSQL
   ▲
   │ javob qaytadi: Interceptor (keyin) → X-Response-Time header → mijozga
```

Xato bo'lsa (masalan `NotFoundException`), u yuqoriga ko'tariladi va NestJS uni JSON javobga aylantiradi: `{ "statusCode": 404, "message": "...", "error": "Not Found" }`.

> **Eslatma:** Guard'lar Interceptor'dan **oldin** ishlaydi. Shuning uchun JWT'siz (401) so'rovda interceptor umuman ishga tushmaydi.

### 4.2. Sening ish tartibing (har bir milestone uchun)

1. Shu hujjatning tegishli bo'limini o'qi.
2. Testni och (`test/e2e/mN-*.e2e-spec.ts`) va nima kutilayotganini o'qi.
3. Kodni yoz.
4. `npm run test:mN` ni ishga tushir.
5. Qizil testni o'qi: u qaysi status kodi kutilganini va nima kelganini aytadi.
6. Hammasi yashil bo'lsa — `git commit`, keyingi milestone.

---

## PostgreSQL'ni NestJS bilan ulash — noldan

Bu eng muhim qism. Agar hozirgacha NestJS'ni PostgreSQL'ga ulamagan bo'lsang — xavotir olma, hammasini qadam-baqadam qilamiz.

### Umumiy yo'l xaritasi (12 qadam)

| #   | Nima qilasan                                                        | Qaysi bo'limda |
| --- | ------------------------------------------------------------------- | -------------- |
| 1   | PostgreSQL o'rnatilganini tekshir                                   | 6.1            |
| 2   | `psql --version` buyrug'ini bajar                                   | 6.1            |
| 3   | PostgreSQL terminaliga (`psql`) kir                                 | 6.3            |
| 4   | `noteflow` nomli database user yarat                                | 6.4            |
| 5   | `noteflow_dev` va `noteflow_test` database'larini yarat             | 6.5            |
| 6   | Database uchun kerakli permissionlarni ber                          | 6.6            |
| 7   | Loyiha ildizida `.env` fayl yarat                                   | 7.1            |
| 8   | PostgreSQL ma'lumotlarini `.env` ichiga yoz                         | 7.1            |
| 9   | NestJS'da environment variables yuklanishini sozla (`ConfigModule`) | 7.2            |
| 10  | TypeORM konfiguratsiyasini yarat (`TypeOrmModule`)                  | 7.3            |
| 11  | Database connection ishlayotganini tekshir                          | 7.5            |
| 12  | Birinchi Entity va Migration bilan jadval yarat                     | 8              |

### Tushunchalar xaritasi (15 mavzu qayerda tushuntirilgan)

| Mavzu                                              | Bo'lim    |
| -------------------------------------------------- | --------- |
| PostgreSQL nima, database nima, database user nima | 5.1       |
| host va port                                       | 5.2       |
| username va password                               | 5.3       |
| connection string                                  | 5.4       |
| `.env` nima qiladi                                 | 5.5       |
| NestJS environment variables'ni qanday o'qiydi     | 5.6 / 7.2 |
| TypeORM nima qiladi                                | 5.7       |
| Entity                                             | 5.8       |
| Repository                                         | 5.9       |
| Migration                                          | 5.10      |
| Ilova PostgreSQL'ga qanday ulanadi                 | 5.11      |
| Ulanishni qanday tekshirish                        | 7.5       |
| Ulanish xatolarini qanday aniqlash                 | 7.6       |

---

## 5. Database bilan tanishish

### 5.1. PostgreSQL, database va database user

- **Database (ma'lumotlar bazasi)** — ma'lumotlarni jadvallarda (table) saqlaydigan joy. Jadval Excel varag'iga o'xshaydi: ustunlar (column) va qatorlar (row) bor.
- **PostgreSQL** — database'larni boshqaradigan **dastur (server)**. U kompyuterda fonda ishlab turadi va so'rovlarni kutadi. Bitta PostgreSQL ichida bir nechta database bo'lishi mumkin (bizda `noteflow_dev` va `noteflow_test`).
- **Database user (role)** — PostgreSQL ichidagi «hisob». Kim ulanayotganini va nima qila olishini belgilaydi. U Linux'dagi userdan **alohida**. Biz `noteflow` nomli user yaratamiz.

Oddiy o'xshatish: PostgreSQL — **bino**, database — **bino ichidagi ofis**, database user — **ofisga kirish kartasi egasi**.

### 5.2. Host va port

- **Host** — PostgreSQL ishlayotgan kompyuterning manzili. Sening kompyuteringda ishlasa: `localhost` (yoki `127.0.0.1`).
- **Port** — kompyuter ichidagi «eshik raqami». PostgreSQL standart holatda **5432** portda tinglaydi.

`localhost:5432` = «shu kompyuterdagi 5432-eshik».

### 5.3. Username va password

PostgreSQL'ga ulanish uchun user nomi (**username**) va uning paroli (**password**) kerak. Biz: `noteflow` / `noteflow_pass`.

> Haqiqiy loyihada parol murakkab bo'ladi. Bu yerda o'quv uchun oddiy parol ishlatamiz. Parolni kodga **yozma** — `.env` ga yoz.

### 5.4. Connection string

Barcha ulanish ma'lumotlarini bitta qatorga yig'ish mumkin:

```
postgresql://noteflow:noteflow_pass@localhost:5432/noteflow_dev
   │           │          │          │        │        │
   protokol   user      parol      host     port   database nomi
```

Biz bu qatorni emas, har bir qiymatni alohida o'zgaruvchida (`DB_HOST`, `DB_PORT`, ...) saqlaymiz — o'qish va o'zgartirish osonroq. Lekin ular aynan shu ma'lumotlar.

### 5.5. `.env` fayl nima qiladi

`.env` — sozlamalar va maxfiy qiymatlar (parol, JWT kaliti) yoziladigan oddiy matn fayl. Format: `KALIT=qiymat`, har qatorda bittadan.

Nima uchun kodga emas, `.env` ga?

1. Parol git'ga tushib ketmaydi (`.env` `.gitignore` da).
2. Development, test va production uchun turli qiymatlar berish mumkin — kodni o'zgartirmasdan.

Repoda `.env.example` bor — u **namuna** (parolsiz yoki soxta parol bilan), git'ga qo'shiladi. Haqiqiy `.env` esa faqat sening kompyuteringda.

### 5.6. NestJS `.env` ni qanday o'qiydi

Node.js `.env` faylini o'zi o'qimaydi. `@nestjs/config` paketidagi `ConfigModule` uni o'qiydi va qiymatlarni `process.env` ga joylaydi. Keyin `ConfigService` orqali ularni olasan:

```
.env  ──(ConfigModule.forRoot)──►  process.env  ──(ConfigService.get('DB_HOST'))──►  kodingiz
```

Muhim: `process.env` dagi qiymatlar **doim matn (string)**. `DB_PORT=5432` kodda `"5432"` bo'ladi — uni songa aylantirish kerak (`Number(...)` yoki `getOrThrow<number>` + konvertatsiya).

### 5.7. TypeORM nima qiladi

TypeORM — **ORM**. U sen yozgan TypeScript klass/obyektlarni SQL so'rovlarga aylantiradi va aksincha. Shunda `INSERT INTO users ...` yozish o'rniga `userRepository.save(user)` deysan.

### 5.8. Entity nima

**Entity** — jadvalga mos keladigan TypeScript klass. Klass = jadval, klass maydoni = ustun, klass nusxasi (obyekt) = qator. U `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn()` kabi dekoratorlar bilan belgilanadi.

### 5.9. Repository nima

**Repository** — bitta Entity bilan ishlash uchun tayyor vosita: `find`, `findOne`, `save`, `remove`, `count`... Service ichida `@InjectRepository(User)` orqali olinadi (modulda `TypeOrmModule.forFeature([User])` kerak).

### 5.10. Migration nima

**Migration** — database tuzilmasini (jadval, ustun) o'zgartiradigan **versiyalangan fayl**. U ikki funksiyadan iborat: `up()` — o'zgarishni qo'llaydi, `down()` — qaytaradi.

Nima uchun `synchronize: true` emas? U ilova ishga tushganda jadvallarni **avtomatik** o'zgartiradi — bu ma'lumotni yo'qotishi mumkin va o'zgarishlar tarixi qolmaydi. Migration'da esa har bir o'zgarish fayl sifatida saqlanadi, tekshiriladi va jamoa bilan bir xil qo'llanadi.

TypeORM qaysi migration'lar qo'llanganini database'dagi `migrations` jadvalida eslab qoladi.

### 5.11. Ilova PostgreSQL'ga qanday ulanadi (hammasi birga)

```
npm run start:dev
   │
   ▼
ConfigModule  ── .env ni o'qiydi ──► process.env
   │
   ▼
TypeOrmModule.forRootAsync ── ConfigService'dan DB_HOST, DB_PORT, ... oladi
   │
   ▼
TypeORM ── pg drayveri orqali ──► PostgreSQL (localhost:5432) ── noteflow_dev
   │
   ▼
Entity'lar ro'yxatdan o'tadi → Repository'lar tayyor
```

Jadvallarni esa **migration** yaratadi (alohida buyruq bilan, 8-bo'lim).

---

## 6. PostgreSQL o'rnatish va database yaratish

> Quyidagi buyruqlar **Ubuntu/Linux** uchun. `$` belgisini yozma — u faqat terminal buyrug'i ekanini bildiradi.

### 6.1. PostgreSQL o'rnatilganini tekshir

```bash
psql --version
```

- `psql (PostgreSQL) 16.x` kabi javob chiqsa — o'rnatilgan (14 yoki undan yuqori versiya yetarli). 6.2 ni o'tkazib yuborib, 6.3 ga o't.
- `command not found` chiqsa — 6.2 ga o't.

### 6.2. O'rnatish (agar o'rnatilmagan bo'lsa)

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
psql --version
```

Server ishlayotganini tekshir va ishga tushir:

```bash
sudo systemctl status postgresql      # "active" bo'lishi kerak (chiqish uchun q bosing)
sudo systemctl start postgresql       # ishlamayotgan bo'lsa ishga tushiradi
sudo systemctl enable postgresql      # kompyuter yoqilganda avtomatik ishga tushadi
```

PostgreSQL 5432-portda tinglayotganini tekshir:

```bash
sudo ss -ltnp | grep 5432
# 127.0.0.1:5432 ... LISTEN   ← shunday qator chiqishi kerak
pg_isready -h localhost -p 5432
# localhost:5432 - accepting connections   ← kutilgan javob
```

### 6.3. PostgreSQL terminaliga (`psql`) kir

O'rnatilganda PostgreSQL `postgres` nomli **superuser** yaratadi. Unga Linux'dagi `postgres` foydalanuvchisi nomidan kiramiz:

```bash
sudo -u postgres psql
```

Prompt shunday ko'rinadi: `postgres=#`. Bu yerda SQL buyruqlari **`;` bilan tugaydi**. `\` bilan boshlanadigan buyruqlar esa psql'ning o'z buyruqlari (oxirida `;` shart emas).

Chiqish: `\q`

Foydali psql buyruqlari:

| Buyruq      | Nima qiladi                     |
| ----------- | ------------------------------- |
| `\l`        | database'lar ro'yxati           |
| `\du`       | database user'lar ro'yxati      |
| `\c nom`    | `nom` database'iga o'tish       |
| `\dt`       | joriy database'dagi jadvallar   |
| `\d jadval` | jadval tuzilmasi                |
| `\conninfo` | hozirgi ulanish haqida ma'lumot |
| `\q`        | chiqish                         |

### 6.4. Database user yarat

`postgres=#` promptida:

```sql
CREATE USER noteflow WITH PASSWORD 'noteflow_pass';
```

Natija: `CREATE ROLE`. Tekshir: `\du` — ro'yxatda `noteflow` ko'rinishi kerak.

### 6.5. Ikkita database yarat

Bizga ikkita **alohida** database kerak:

| Database        | Nima uchun                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| `noteflow_dev`  | sen ishlab chiqish paytida ishlatadigan database (haqiqiy ma'lumotlaring shu yerda) |
| `noteflow_test` | **faqat testlar uchun**. Testlar har safar uni tozalaydi                            |

```sql
CREATE DATABASE noteflow_dev OWNER noteflow;
CREATE DATABASE noteflow_test OWNER noteflow;
```

Tekshir: `\l` — ikkalasi ham ro'yxatda va `Owner` ustunida `noteflow` bo'lishi kerak.

> **Nima uchun test database alohida bo'lishi shart?**
> Har bir e2e test oldidan barcha jadvallar `TRUNCATE` qilinadi (hamma qatorlar o'chadi). Agar test `noteflow_dev` ga ulansa — sening hamma ma'lumotlaring yo'qoladi.
> Shu sababli test infratuzilmasi database nomi `_test` bilan tugamasa, ishlashni **rad etadi**.

### 6.6. Permissionlarni ber

`OWNER noteflow` bergan bo'lsak ham, aniqlik uchun va PostgreSQL 15+ dagi `public` schema qoidalari tufayli quyidagilarni bajar:

```sql
GRANT ALL PRIVILEGES ON DATABASE noteflow_dev TO noteflow;
GRANT ALL PRIVILEGES ON DATABASE noteflow_test TO noteflow;
```

Har bir database ichida `public` schema huquqi va UUID kengaytmasi (`\c` bilan database'ga o'tib):

```sql
\c noteflow_dev
GRANT ALL ON SCHEMA public TO noteflow;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c noteflow_test
GRANT ALL ON SCHEMA public TO noteflow;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

> `uuid-ossp` — UUID (masalan `3f2b...-...`) yaratish uchun kengaytma. TypeORM `@PrimaryGeneratedColumn('uuid')` uchun uni ishlatadi. Uni oddiy user yarata olmasligi mumkin («permission denied to create extension»), shuning uchun superuser bilan oldindan yaratib qo'yamiz.

### 6.7. Yaratilganini tekshir

Ro'yxat va mavjudlikni tekshirish (terminaldan, `psql` ga kirmasdan):

```bash
sudo -u postgres psql -c "\l"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='noteflow_dev'"
# "1" chiqsa — database mavjud, hech narsa chiqmasa — yo'q
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='noteflow_test'"
```

### 6.8. Yangi user bilan ulanib ko'r (juda muhim!)

NestJS ulanishidan oldin, xuddi shu ma'lumotlar bilan **qo'lda** ulanib ko'r. Agar bu ishlasa — NestJS ham ishlaydi:

```bash
psql -h localhost -p 5432 -U noteflow -d noteflow_dev
# Password: noteflow_pass   (yozganingda ekranda ko'rinmaydi, Enter bos)
```

Muvaffaqiyatli bo'lsa `noteflow_dev=>` prompti chiqadi. Tekshir:

```sql
\conninfo
SELECT current_database(), current_user;
\q
```

Test database uchun ham xuddi shunday: `psql -h localhost -U noteflow -d noteflow_test`.

> `-h localhost` ni yozishni unutma. Usiz `psql` Unix socket orqali «peer» autentifikatsiyasini ishlatadi va parol so'ramaydi — NestJS esa TCP orqali (host+port) ulanadi.

### 6.9. (Ixtiyoriy) Docker bilan

Docker o'rnatilgan va qulay bo'lsa, PostgreSQL'ni konteynerda ishga tushirish mumkin. **Bu shart emas** — yuqoridagi oddiy yo'l yetarli.

```bash
docker run --name noteflow-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
docker exec -it noteflow-pg psql -U postgres     # keyin 6.4–6.6 dagi SQL'larni shu yerda bajar
```

---

## 7. NestJS va PostgreSQL ulanishi

**Maqsad (M1 ning birinchi yarmi):** `npm run start:dev` ishlaganda ilova PostgreSQL'ga ulanadi va xatosiz ishga tushadi.

### 7.1. `.env` faylini to'ldir (7–8-qadamlar)

Loyiha ildizida (`package.json` yonida) `.env` fayl bor (3-bo'limda `cp .env.example .env` qilgansan). Uni och va 6-bo'limda yaratgan ma'lumotlaringni yoz:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=noteflow
DB_PASSWORD=noteflow_pass
DB_DATABASE=noteflow_dev
JWT_SECRET=biror_uzun_tasodifiy_matn
JWT_EXPIRES_IN=1h
UPLOAD_DIR=./uploads
PORT=3000
```

| O'zgaruvchi      | Ma'nosi                                                       |
| ---------------- | ------------------------------------------------------------- |
| `DB_HOST`        | PostgreSQL serveri manzili. Lokal bo'lsa `localhost`          |
| `DB_PORT`        | PostgreSQL porti. Standart `5432`                             |
| `DB_USERNAME`    | 6.4 da yaratgan database user: `noteflow`                     |
| `DB_PASSWORD`    | shu user paroli                                               |
| `DB_DATABASE`    | ulanilayotgan database. **Development: `noteflow_dev`**       |
| `JWT_SECRET`     | JWT'ni imzolash uchun maxfiy kalit. Uzun va tasodifiy bo'lsin |
| `JWT_EXPIRES_IN` | token muddati, masalan `1h`                                   |
| `UPLOAD_DIR`     | yuklangan fayllar saqlanadigan papka                          |
| `PORT`           | ilova tinglaydigan port                                       |

**Test uchun alohida fayl:** `.env.test` (3-bo'limda yaratgansan). Unda **faqat** `DB_DATABASE=noteflow_test` va `UPLOAD_DIR=./uploads-test` farq qiladi. Qolgan DB ma'lumotlari bir xil bo'lishi mumkin. Test infratuzilmasi bu faylni o'zi o'qiydi — sen `src/` ichida `.env.test` ni tanlashing shart emas.

> `.env` va `.env.test` `.gitignore` da — ularni git'ga **qo'shma**.

### 7.2. Environment variables yuklanishini sozla (9-qadam)

`src/app.module.ts` da `ConfigModule` ni **global** qilib ulash kerak:

```ts
ConfigModule.forRoot({ isGlobal: true });
```

`isGlobal: true` bo'lsa, `ConfigService` ni har bir modulda alohida import qilmaysan. Default holatda `ConfigModule` loyiha ildizidagi `.env` ni o'qiydi. (Test paytida `.env.test` qiymatlari allaqachon `process.env` ga yuklangan bo'ladi va `ConfigModule` ularni **ustidan yozmaydi** — shuning uchun testlar `.env.test` ni ishlatadi.)

### 7.3. TypeORM konfiguratsiyasini yarat (10-qadam)

`TypeOrmModule.forRootAsync(...)` dan foydalan — chunki qiymatlarni `ConfigService` dan olish kerak (u `ConfigModule` yuklangandan keyingina tayyor bo'ladi). Kerakli parametrlar:

| Parametr           | Qiymat                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `type`             | `'postgres'`                                                                             |
| `host`             | `.env` dagi `DB_HOST`                                                                    |
| `port`             | `DB_PORT` — **songa aylantir**! (`.env` dan matn keladi)                                 |
| `username`         | `DB_USERNAME`                                                                            |
| `password`         | `DB_PASSWORD`                                                                            |
| `database`         | `DB_DATABASE`                                                                            |
| `autoLoadEntities` | `true` (modullardagi `TypeOrmModule.forFeature([...])` entity'lari avtomatik qo'shiladi) |
| `synchronize`      | **`false`** (hech qachon `true` emas)                                                    |

Qiymat topilmasa jim turmasin: `configService.getOrThrow('DB_HOST')` ishlat — `.env` da xato bo'lsa, ilova darrov aniq xabar bilan to'xtaydi.

Joylashuvi: konfiguratsiyani `src/database/` papkasida alohida modul/fayl qilishing mumkin yoki to'g'ridan-to'g'ri `AppModule` ga yozish ham mumkin. Qaysi biri — o'zing tanla, lekin sodda qil.

### 7.4. `src/database/data-source.ts` ni yarat (migration va testlar uchun MAJBURIY)

NestJS ilovasi ishlamayotgan paytda ham (masalan `npm run migration:run` buyrug'ida va testlarning boshlang'ich sozlamasida) TypeORM'ga database haqida ma'lumot kerak. Buning uchun alohida **`DataSource`** fayli yoziladi:

- Fayl yo'li **aynan**: `src/database/data-source.ts`
- U **`export default new DataSource({...})`** qilishi shart (default export!). Testlar va `npm run migration:*` buyruqlari shu faylni ishlatadi.
- Fayl boshida `.env` ni o'qi: `import 'dotenv/config';` (dotenv o'rnatilgan). Dotenv mavjud `process.env` qiymatlarini **ustidan yozmaydi** — test paytida bu aynan kerakli xatti-harakat.
- Parametrlar 7.3 dagidek (`type`, `host`, `port`, `username`, `password`, `database`, `synchronize: false`), qo'shimcha ravishda:
  - `entities`: entity fayllarini topish uchun glob, masalan `__dirname + '/../**/*.entity{.ts,.js}'` — shuning uchun **barcha entity fayllari `*.entity.ts` deb nomlansin**;
  - `migrations`: `__dirname + '/migrations/*{.ts,.js}'` — migration'lar `src/database/migrations/` papkasida turadi.

`package.json` da tayyor skriptlar bor:

| Buyruq                                                      | Nima qiladi                                                         |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `npm run migration:generate -- src/database/migrations/Nom` | Entity'lar va database farqidan migration **yaratadi**              |
| `npm run migration:run`                                     | qo'llanmagan migration'larni **qo'llaydi**                          |
| `npm run migration:revert`                                  | oxirgi migration'ni **qaytaradi**                                   |
| `npm run migration:show`                                    | qaysi migration qo'llangan/qo'llanmaganini ko'rsatadi               |
| `npm run migration:run:test`                                | migration'larni **test** database'iga qo'llaydi (`.env.test` bilan) |

### 7.5. Ulanish ishlayotganini tekshir (11-qadam)

1. PostgreSQL ishlayotganini tekshir: `pg_isready -h localhost -p 5432`.
2. Ilovani ishga tushir:
   ```bash
   npm run start:dev
   ```
3. Muvaffaqiyatli bo'lsa terminalda `Nest application successfully started` chiqadi va **xato yo'q**. `TypeOrmModule dependencies initialized` qatori ulanish o'rnatilganini bildiradi.
4. Ilovani to'xtatib (`Ctrl+C`), yana bir tekshiruv: `npm run migration:show` — xato bermay ishlashi kerak (hozircha `No migrations are pending` yoki bo'sh ro'yxat).
5. Eng yaxshi tekshiruv — M1 testi (8-bo'limdan keyin): `npm run test:m1`.

### 7.6. Ulanish xatolarini aniqlash

Ulanish xatolari — eng ko'p uchraydigan boshlang'ich muammo. Tartib bilan tekshir:

**Umumiy diagnostika (xato qanday bo'lmasin, shundan boshla):**

```bash
pg_isready -h localhost -p 5432                              # server javob beryaptimi?
psql -h localhost -p 5432 -U noteflow -d noteflow_dev        # .env dagi ma'lumotlar bilan qo'lda ulanib ko'r
```

Agar `psql` ulanmasa — muammo PostgreSQL yoki ma'lumotlarda, NestJS'da emas. Agar `psql` ulansa-yu NestJS ulanmasa — muammo `.env` yoki konfiguratsiyada.

| Xato                                                                                                                           | Sababi                                            | Nima qilish kerak                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ECONNREFUSED 127.0.0.1:5432`                                                                                                  | PostgreSQL ishlamayapti yoki boshqa portda        | 1) `sudo systemctl status postgresql`, kerak bo'lsa `sudo systemctl start postgresql`. 2) `sudo ss -ltnp \| grep 5432` — port tinglanyaptimi? 3) `.env` dagi `DB_HOST`/`DB_PORT` ni tekshir. |
| `ECONNREFUSED ::1:5432`                                                                                                        | `localhost` IPv6 ga o'zgargan, server esa IPv4 da | `.env` da `DB_HOST=127.0.0.1` yoz.                                                                                                                                                           |
| `password authentication failed for user "noteflow"`                                                                           | parol noto'g'ri yoki user boshqa                  | `.env` dagi `DB_USERNAME`/`DB_PASSWORD` ni tekshir. Parolni yangilash: `sudo -u postgres psql -c "ALTER USER noteflow WITH PASSWORD 'noteflow_pass';"`                                       |
| `database "noteflow_dev" does not exist`                                                                                       | database yaratilmagan yoki nomi boshqacha         | `sudo -u postgres psql -c "\l"` — ro'yxatda bormi? Yo'q bo'lsa 6.5 ni bajar. `.env` dagi `DB_DATABASE` imlosini tekshir.                                                                     |
| `role "noteflow" does not exist`                                                                                               | user yaratilmagan                                 | 6.4 ni bajar. `\du` bilan tekshir.                                                                                                                                                           |
| `permission denied for schema public` / `permission denied for database` / `permission denied to create extension "uuid-ossp"` | user'ga huquq berilmagan                          | 6.6 dagi `GRANT` va `CREATE EXTENSION` buyruqlarini superuser (`sudo -u postgres psql`) bilan, **tegishli database ichida** (`\c noteflow_dev`) bajar.                                       |
| `Connection terminated due to connection timeout` / `ETIMEDOUT`                                                                | host noto'g'ri yoki firewall                      | `DB_HOST` to'g'ri ekanini tekshir (lokal bo'lsa `localhost`). Masofaviy serverga ulansang — firewall/port ochiqligini tekshir.                                                               |
| `Cannot read properties of undefined` / `client password must be a string`                                                     | `.env` o'qilmagan yoki `DB_PASSWORD` bo'sh        | `.env` fayli `package.json` bilan bir papkada ekanini, `ConfigModule.forRoot()` chaqirilganini va `DB_PORT` ni songa aylantirganingni tekshir.                                               |

> `.env` ni o'zgartirgandan keyin ilovani **qayta ishga tushir** — `start:dev` rejimi `.env` o'zgarishini kuzatmaydi.

---

## 8. TypeORM va birinchi Migration

**Maqsad (M1 ning ikkinchi yarmi):** `users` jadvalini migration orqali yaratish va test database'iga qo'llash.

### 8.1. Birinchi Entity: `User` (12-qadam)

1. `src/users/user-role.enum.ts` yarat: `UserRole` enum, qiymatlari `ADMIN` va `USER` (**qiymat matnlari ham aynan `'ADMIN'` va `'USER'`**).
2. `src/users/user.entity.ts` yarat (`*.entity.ts` nomi shart). `@Entity('users')` — jadval nomi aynan **`users`**. Ustunlar (11-bo'limga qara):
   `id` (UUID), `fullName`, `email` (unique), `passwordHash`, `role` (default `USER`), `createdAt`, `updatedAt`.
3. Ustun nomlarini o'zgartirma: TypeORM'ning standart nomlash qoidasi qoladi (`fullName` ustuni database'da ham `"fullName"`).
4. `UsersModule` yarat, ichida `TypeOrmModule.forFeature([User])`, va uni `AppModule` ga import qil (hozircha controller/service shart emas).

### 8.2. Migration yarat

```bash
npm run migration:generate -- src/database/migrations/CreateUsers
```

TypeORM `src/database/migrations/<vaqt>-CreateUsers.ts` fayl yaratadi. Uni **ochib o'qi**:

- `up()` ichida `CREATE TABLE "users" (...)` borligini ko'r;
- `down()` ichida `DROP TABLE "users"` borligini ko'r.

Migration'ni qo'lda o'zgartirishing shart emas, lekin nima qilayotganini tushunishing shart.

> Agar `No changes in database schema were found` chiqsa — entity topilmayapti. `data-source.ts` dagi `entities` glob'ini va fayl nomi `*.entity.ts` ekanini tekshir.

### 8.3. Migration'ni development database'iga qo'lla

```bash
npm run migration:run
npm run migration:show      # [X] CreateUsers... — belgilangan bo'lishi kerak
```

`psql` bilan natijani ko'r:

```bash
psql -h localhost -U noteflow -d noteflow_dev
```

```sql
\dt                       -- users va migrations jadvallari
\d users                  -- ustunlar
SELECT * FROM migrations; -- qo'llangan migration yozuvi
\q
```

### 8.4. Test database'iga qo'llash

E2E testlar o'zi migration'larni test database'iga qo'llaydi (`test/setup/global-setup.ts`). Lekin qo'lda ham qilib ko'rish mumkin:

```bash
npm run migration:run:test
sudo -u postgres psql -d noteflow_test -c "\dt"
```

### 8.5. M1 testini ishga tushir

```bash
npm run test:m1
```

Hammasi yashil bo'lishi kerak. Testlar quyidagilarni tekshiradi: test database nomi `_test` bilan tugaydi, ulanish bor, `synchronize` o'chiq, migration qo'llangan, `users` jadvali kerakli ustunlar bilan mavjud.

### 8.6. Keyingi migration'lar

Har safar yangi entity qo'shsang (`Category`, `Note`, `Attachment`) yoki mavjudini o'zgartirsang — **yangi** migration generate qil (`CreateCategories`, `CreateNotes`, `CreateAttachments`) va `npm run migration:run` qil. **Eski migration fayllarini tahrirlama** (ular allaqachon qo'llangan). Xato qilsang: `npm run migration:revert`, entity'ni tuzat, migration faylini o'chirib, qayta generate qil.

---

## 9. Loyihaning papkalar tuzilishi

```
noteflow-by-claude-trainer/
├── src/
│   ├── main.ts                  ← ilovani ishga tushiradi (setupApp'ni chaqiradi)
│   ├── app.module.ts            ← asosiy modul: barcha modullarni birlashtiradi
│   ├── app.setup.ts             ← global pipe va interceptor'lar (main.ts VA testlar ishlatadi)
│   ├── database/
│   │   ├── data-source.ts       ← CLI va testlar uchun DataSource (default export)
│   │   └── migrations/          ← migration fayllari
│   ├── auth/                    ← register, login, me, JWT strategy, JwtAuthGuard
│   ├── users/                   ← User entity, UserRole enum, users endpointlari
│   ├── categories/              ← Category entity, CRUD
│   ├── notes/                   ← Note entity, CRUD, archive, notes-query.util.ts
│   ├── attachments/             ← Attachment entity, upload/download/delete, file-validation.util.ts
│   └── common/                  ← bir nechta modul ishlatadigan umumiy kod
│       ├── decorators/          ← @Roles(), @CurrentUser()
│       ├── guards/              ← RolesGuard
│       ├── interceptors/        ← TimingInterceptor
│       ├── middleware/          ← LoggerMiddleware
│       ├── filters/             ← (ixtiyoriy) exception filter — Nest'ning standart xato formati yetarli
│       ├── pipes/               ← (ixtiyoriy) custom pipe
│       └── utils/               ← password.util, pagination.util, redact.util
├── test/                        ← TAYYOR. O'zgartirma! (setup/, helpers/, unit/, e2e/)
├── uploads/                     ← yuklangan fayllar (git'ga qo'shilmaydi, ilova o'zi yaratadi)
├── .env, .env.test              ← sening sozlamalaring (git'ga qo'shilmaydi)
└── .env.example, .env.test.example
```

Har bir papka bitta vazifani bajaradi. **Ortiqcha abstraksiya (repository klasslari, factory'lar, interfeys qatlamlari) yaratma** — TypeORM `Repository` o'zi yetarli.

### 9.1. Testlar kutadigan fayllar va nomlar ("shartnoma")

Unit testlar va test yordamchilari sening kodingni aynan shu fayllardan import qiladi. **Yo'l va nomlarni o'zgartirma**, aks holda test «Cannot find module» xatosini beradi.

| Fayl                                       | Eksport                                                                                                        | Qaysi test               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `src/app.module.ts`                        | `AppModule`                                                                                                    | barcha e2e               |
| `src/app.setup.ts`                         | `setupApp(app)`                                                                                                | barcha e2e               |
| `src/database/data-source.ts`              | `export default new DataSource(...)`                                                                           | e2e boshlang'ich sozlama |
| `src/users/user-role.enum.ts`              | `UserRole` (`ADMIN`, `USER`)                                                                                   | M3 unit                  |
| `src/common/decorators/roles.decorator.ts` | `Roles(...roles)`                                                                                              | M3 unit                  |
| `src/common/guards/roles.guard.ts`         | `RolesGuard` (konstruktor: `Reflector`)                                                                        | M3 unit                  |
| `src/common/utils/password.util.ts`        | `hashPassword(plain)`, `comparePassword(plain, hash)`                                                          | M2 unit                  |
| `src/common/utils/pagination.util.ts`      | `getPagination({page?, limit?})`, `buildPaginationMeta(total, page, limit)`                                    | M6 unit                  |
| `src/notes/notes-query.util.ts`            | `buildNotesWhere(userId, {categoryId?, isArchived?, search?})`                                                 | M6 unit                  |
| `src/common/utils/redact.util.ts`          | `redactSensitive(value)`                                                                                       | M7 unit                  |
| `src/attachments/file-validation.util.ts`  | `ALLOWED_MIME_TYPES`, `MAX_FILE_SIZE_BYTES`, `validateUploadedFile(file)`, `generateStorageName(originalName)` | M8 unit                  |

Jadval nomlari (e2e testlar to'g'ridan-to'g'ri SQL bilan tekshiradi): **`users`, `categories`, `notes`, `attachments`**. Primary key'lar — **UUID**.

Muhit o'zgaruvchilari (kodingda shu nomlarni o'qi): `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `UPLOAD_DIR`, `PORT`.

### 9.2. `src/app.setup.ts` nima uchun kerak

`main.ts` ham, e2e testlar ham ilovani yaratganda `setupApp(app)` ni chaqiradi. Shuning uchun global `ValidationPipe` va `TimingInterceptor` shu yerda ulanadi — test ham haqiqiy ilova bilan **bir xil** sharoitda ishlaydi. (Middleware esa `AppModule` ichida `configure(consumer)` orqali ulanadi.)

---

## 10. Har bir modulning vazifasi

| Modul               | Vazifasi                            | Nimalarni o'z ichiga oladi                                                                                                      |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `AppModule`         | hamma narsani birlashtiradi         | `ConfigModule`, `TypeOrmModule`, feature modullar, middleware ulanishi                                                          |
| `AuthModule`        | ro'yxatdan o'tish, login, JWT       | `AuthController`, `AuthService`, `JwtStrategy`, `JwtAuthGuard`, `JwtModule`, DTO'lar (`RegisterDto`, `LoginDto`)                |
| `UsersModule`       | userlarni boshqarish                | `User` entity, `UsersController`, `UsersService`, `UpdateUserDto`. `AuthModule` ham `UsersService` dan foydalanadi (export qil) |
| `CategoriesModule`  | kategoriyalar CRUD                  | `Category` entity, controller, service, DTO'lar                                                                                 |
| `NotesModule`       | note CRUD, arxivlash, qidiruv       | `Note` entity, controller, service, DTO'lar (`CreateNoteDto`, `UpdateNoteDto`, `ListNotesQueryDto`), `notes-query.util.ts`      |
| `AttachmentsModule` | fayl yuklash/yuklab olish/o'chirish | `Attachment` entity, controller(lar), service, `file-validation.util.ts`                                                        |
| `common/`           | umumiy vositalar                    | `@Roles()`, `@CurrentUser()`, `RolesGuard`, `TimingInterceptor`, `LoggerMiddleware`, util funksiyalar                           |

**Qatlam qoidasi:**

- **Controller** — faqat HTTP: URL, DTO, status kod. Mantiq yo'q.
- **Service** — biznes qoidalari: egalik tekshiruvi, 404/409 tashlash.
- **Repository** — faqat database bilan ishlash (TypeORM tayyor beradi).

---

## 11. Entity va ular orasidagi bog'lanishlar

### 11.1. Umumiy rasm

```
User (1) ────────< Category (ko'p)
  │                    │
  │                    │ 1 ta category'da ko'p note
  │                    ▼
  └────────────────< Note (ko'p) ────────< Attachment (ko'p)
        1 ta userda ko'p note        1 ta note'da ko'p fayl
```

`1 ──< ko'p` — «bittaning ko'plari bor».

### 11.2. Oddiy misollar

- **User ↔ Category.** Ali «Ish» va «O'qish» kategoriyalarini yaratdi. Vali esa «Sport» kategoriyasini yaratdi. Ali faqat o'zining 2 ta kategoriyasini ko'radi. _Bitta user — ko'p category; har bir category aynan bitta userga tegishli._
- **User ↔ Note.** Alining 10 ta note'i bor, Valining 3 ta. Har bir note bitta egasiga tegishli.
- **Category ↔ Note.** «Ish» kategoriyasida 4 ta note bor. Lekin note kategoriyasiz ham bo'lishi mumkin («Inbox» kabi) — shuning uchun `categoryId` **nullable**.
- **Note ↔ Attachment.** «Shartnoma» note'iga `shartnoma.pdf` va `skrin.png` biriktirilgan. Har bir fayl aynan bitta note'ga tegishli.

### 11.3. Ustunlar

Hammasida `id` — **UUID** (`@PrimaryGeneratedColumn('uuid')`).

**users**

| Ustun                | Tur                 | Izoh                                                 |
| -------------------- | ------------------- | ---------------------------------------------------- |
| id                   | uuid                | PK                                                   |
| fullName             | varchar             | majburiy                                             |
| email                | varchar             | **unique**                                           |
| passwordHash         | varchar             | bcrypt hash. API javobida **hech qachon** chiqmaydi  |
| role                 | enum `ADMIN`/`USER` | default `USER`                                       |
| createdAt, updatedAt | timestamp           | avtomatik (`@CreateDateColumn`, `@UpdateDateColumn`) |

**categories**

| Ustun                | Tur            | Izoh                  |
| -------------------- | -------------- | --------------------- |
| id                   | uuid           | PK                    |
| name                 | varchar        | majburiy              |
| description          | varchar / text | ixtiyoriy (nullable)  |
| userId               | uuid           | FK → users.id (egasi) |
| createdAt, updatedAt | timestamp      |                       |

**notes**

| Ustun                | Tur                | Izoh                  |
| -------------------- | ------------------ | --------------------- |
| id                   | uuid               | PK                    |
| title                | varchar            | majburiy              |
| content              | text               | default `''`          |
| isArchived           | boolean            | default `false`       |
| userId               | uuid               | FK → users.id (egasi) |
| categoryId           | uuid, **nullable** | FK → categories.id    |
| createdAt, updatedAt | timestamp          |                       |

**attachments**

| Ustun        | Tur       | Izoh                                                    |
| ------------ | --------- | ------------------------------------------------------- |
| id           | uuid      | PK                                                      |
| originalName | varchar   | foydalanuvchi yuklagan asl nom (faqat ko'rsatish uchun) |
| storageName  | varchar   | serverda saqlangan **noyob** nom                        |
| mimeType     | varchar   | masalan `image/png`                                     |
| size         | integer   | bayt                                                    |
| noteId       | uuid      | FK → notes.id                                           |
| createdAt    | timestamp |                                                         |

### 11.4. Bog'lanishlarni TypeORM'da ifodalash

- `@ManyToOne` — «ko'p tomon» (Note → User, Note → Category, Category → User, Attachment → Note).
- `@OneToMany` — «bir tomon» (User → Notes va h.k.). U **majburiy emas** — kerak bo'lmasa yozma. Faqat `@ManyToOne` yetarli bo'lishi ham mumkin.
- Tashqi kalit ustuni (`userId`, `categoryId`, `noteId`) ni entity'da alohida `@Column()` sifatida ham e'lon qil — shunda `where: { userId }` yozish oson bo'ladi. (`HINTS.md` → «Entity bog'lanishlari».)

### 11.5. O'chirish siyosati (`onDelete`) — hammasi shu jadvalda

| Nima o'chirildi | Nima bo'ladi                                                                        | `onDelete`                                                     |
| --------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Category**    | Ichidagi note'lar **o'chmaydi**. Ularning `categoryId` si `null` bo'ladi            | `SET NULL` (Note → Category)                                   |
| **Note**        | Uning attachment yozuvlari ham o'chadi **va fizik fayllar ham diskdan o'chiriladi** | `CASCADE` (Attachment → Note) + service'da fayllarni o'chirish |
| **Attachment**  | DB yozuvi va fizik fayl o'chadi                                                     | —                                                              |

Nima uchun note'larni o'chirmaymiz? Foydalanuvchi kategoriyani tartibsizlik uchun o'chirishi mumkin, lekin yozuvlari yo'qolishini **xohlamaydi**. Bu siyosat sodda va oldindan aytib bo'ladigan.

> User o'chirish endpoint'i yo'q, shuning uchun user o'chirilganda nima bo'lishi bu topshiriqda kerak emas.

---

## 12. API endpointlar ro'yxati

| #   | Method | URL                          | Auth | Kim foydalanadi | Muvaffaqiyat | Milestone |
| --- | ------ | ---------------------------- | ---- | --------------- | ------------ | --------- |
| 1   | POST   | `/auth/register`             | yo'q | hamma           | 201          | M2        |
| 2   | POST   | `/auth/login`                | yo'q | hamma           | 200          | M2        |
| 3   | GET    | `/auth/me`                   | ha   | har qanday user | 200          | M2        |
| 4   | GET    | `/users`                     | ha   | **faqat ADMIN** | 200          | M3        |
| 5   | GET    | `/users/:id`                 | ha   | o'zi yoki ADMIN | 200          | M3        |
| 6   | PATCH  | `/users/:id`                 | ha   | o'zi yoki ADMIN | 200          | M3        |
| 7   | POST   | `/categories`                | ha   | user (o'ziga)   | 201          | M4        |
| 8   | GET    | `/categories`                | ha   | user (o'zining) | 200          | M4        |
| 9   | GET    | `/categories/:id`            | ha   | egasi           | 200          | M4        |
| 10  | PATCH  | `/categories/:id`            | ha   | egasi           | 200          | M4        |
| 11  | DELETE | `/categories/:id`            | ha   | egasi           | 204          | M4        |
| 12  | POST   | `/notes`                     | ha   | user (o'ziga)   | 201          | M5        |
| 13  | GET    | `/notes`                     | ha   | user (o'zining) | 200          | M5, M6    |
| 14  | GET    | `/notes/:id`                 | ha   | egasi           | 200          | M5        |
| 15  | PATCH  | `/notes/:id`                 | ha   | egasi           | 200          | M5        |
| 16  | DELETE | `/notes/:id`                 | ha   | egasi           | 204          | M5        |
| 17  | PATCH  | `/notes/:id/archive`         | ha   | egasi           | 200          | M5        |
| 18  | POST   | `/notes/:noteId/attachments` | ha   | note egasi      | 201          | M8        |
| 19  | GET    | `/attachments/:id`           | ha   | note egasi      | 200          | M8        |
| 20  | DELETE | `/attachments/:id`           | ha   | note egasi      | 204          | M8        |

---

## 13. Har bir endpoint batafsil

### 13.0. Hamma endpointlarga tegishli umumiy qoidalar

**Authentication:** «Auth: ha» bo'lgan endpointlarda `Authorization: Bearer <accessToken>` header kerak. Token yo'q, noto'g'ri yoki muddati o'tgan bo'lsa → **401**.

**Xato javobi formati** (NestJS standarti, o'zgartirma):

```json
{ "statusCode": 404, "message": "Note not found", "error": "Not Found" }
```

Validatsiya xatosida `message` — **massiv** bo'ladi (har bir muammo alohida qator):

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

Xabarlarda stack trace, fayl yo'li, SQL yoki `passwordHash` bo'lmasligi shart.

**Global ValidationPipe** (`src/app.setup.ts` da): `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
Demak DTO'da **e'lon qilinmagan har qanday maydon** (body'da ham, query'da ham) → **400**. Bu xavfsizlik uchun: masalan `{"role":"ADMIN"}` yuborib admin bo'lib bo'lmaydi.

**`:id` parametrlari** UUID bo'lishi shart (`ParseUUIDPipe`). UUID bo'lmasa → **400**. UUID bo'lib, lekin mavjud bo'lmasa → **404**.

**Egalik (ownership) siyosati — shu jadvalga qat'iy amal qil:**

| Holat                                                         | Status  | Nima uchun                             |
| ------------------------------------------------------------- | ------- | -------------------------------------- |
| Token yo'q/yaroqsiz                                           | 401     | kimligi noma'lum                       |
| Rolga mos emas (USER `GET /users` ga kirdi)                   | 403     | kim ekanligi ma'lum, lekin ruxsat yo'q |
| USER boshqa **user**ning profilini ko'rdi/o'zgartirdi         | 403     |                                        |
| Boshqa userning **category / note / attachment**'iga murojaat | **404** | resurs mavjudligi ham sezdirilmaydi    |
| Resurs haqiqatan yo'q                                         | 404     |                                        |
| Noto'g'ri body/query/UUID                                     | 400     |                                        |
| Email band                                                    | 409     |                                        |

> ADMIN **faqat** userlarni boshqara oladi. Boshqa userlarning note/category/attachment'lariga ADMIN ham kira **olmaydi** (404).

**Parol qoidasi:** kamida 8 belgi, kamida bitta **harf** va bitta **raqam**.

---

### 13.1. `POST /auth/register`

|                  |                                   |
| ---------------- | --------------------------------- |
| Auth kerakmi?    | Yo'q                              |
| Kim foydalanadi? | Hamma                             |
| Natija           | Yangi user (role har doim `USER`) |

**Body:**

```json
{
  "fullName": "Ali Valiyev",
  "email": "ali@example.com",
  "password": "Passw0rd!123"
}
```

| Maydon     | Qoida                   |
| ---------- | ----------------------- |
| `fullName` | matn, 1–100 belgi       |
| `email`    | to'g'ri email formati   |
| `password` | 8+ belgi, harf va raqam |

**Javob 201:**

```json
{
  "id": "3f0c6f3e-8c4b-4a8e-9d7b-2a1b0c9d8e7f",
  "fullName": "Ali Valiyev",
  "email": "ali@example.com",
  "role": "USER",
  "createdAt": "2026-01-15T09:30:00.000Z",
  "updatedAt": "2026-01-15T09:30:00.000Z"
}
```

`password` va `passwordHash` javobda **bo'lmaydi**.

| Status | Qachon                                                                         |
| ------ | ------------------------------------------------------------------------------ |
| 201    | muvaffaqiyatli                                                                 |
| 400    | noto'g'ri email, zaif parol, `fullName` yo'q, ortiqcha maydon (masalan `role`) |
| 409    | bu email bilan user allaqachon bor                                             |

---

### 13.2. `POST /auth/login`

|                  |       |
| ---------------- | ----- |
| Auth kerakmi?    | Yo'q  |
| Kim foydalanadi? | Hamma |

**Body:** `{ "email": "ali@example.com", "password": "Passw0rd!123" }`

**Javob 200:**

```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...." }
```

> Diqqat: `POST` uchun NestJS standart `201` qaytaradi. Login'da **200** kerak — `@HttpCode(200)`.

| Status | Qachon                                                                                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 200    | muvaffaqiyatli                                                                                                                                                    |
| 400    | `email`/`password` yo'q yoki noto'g'ri formatda                                                                                                                   |
| 401    | email yo'q **yoki** parol noto'g'ri. **Ikkala holatda xabar aynan bir xil bo'lsin** (masalan `"Invalid credentials"`) — email mavjudligini oshkor qilmaslik uchun |

---

### 13.3. `GET /auth/me`

|                  |                        |
| ---------------- | ---------------------- |
| Auth kerakmi?    | Ha                     |
| Kim foydalanadi? | Har qanday kirgan user |

**Javob 200:** 13.1 dagi kabi user obyekti (`id`, `fullName`, `email`, `role`, `createdAt`, `updatedAt`), `passwordHash`siz.

| Status | Qachon                                                       |
| ------ | ------------------------------------------------------------ |
| 200    | token to'g'ri                                                |
| 401    | token yo'q / noto'g'ri / imzosi buzilgan / `Bearer` so'zisiz |

---

### 13.4. `GET /users`

|                  |                 |
| ---------------- | --------------- |
| Auth kerakmi?    | Ha              |
| Kim foydalanadi? | **Faqat ADMIN** |

**Javob 200:** userlar massivi (hash'siz):

```json
[
  {
    "id": "…",
    "fullName": "Admin",
    "email": "admin@example.com",
    "role": "ADMIN",
    "createdAt": "…",
    "updatedAt": "…"
  },
  {
    "id": "…",
    "fullName": "Ali Valiyev",
    "email": "ali@example.com",
    "role": "USER",
    "createdAt": "…",
    "updatedAt": "…"
  }
]
```

| Status | Qachon     |
| ------ | ---------- |
| 200    | ADMIN      |
| 401    | token yo'q |
| 403    | oddiy USER |

---

### 13.5. `GET /users/:id`

|                  |                                |
| ---------------- | ------------------------------ |
| Auth kerakmi?    | Ha                             |
| Kim foydalanadi? | Profil egasi (o'zi) yoki ADMIN |

**Javob 200:** bitta user obyekti (hash'siz).

| Status | Qachon                                |
| ------ | ------------------------------------- |
| 200    | o'zi yoki ADMIN                       |
| 400    | `:id` UUID emas                       |
| 401    | token yo'q                            |
| 403    | USER boshqa userni so'radi            |
| 404    | ADMIN so'radi, lekin bunday user yo'q |

---

### 13.6. `PATCH /users/:id`

|                  |                         |
| ---------------- | ----------------------- |
| Auth kerakmi?    | Ha                      |
| Kim foydalanadi? | Profil egasi yoki ADMIN |

**Body** (ruxsat etilgan **yagona** maydon):

```json
{ "fullName": "Ali Karimov" }
```

`fullName` — 1–100 belgi (bo'sh bo'lmasin). `email`, `role`, `passwordHash`, `id` va boshqa har qanday maydon yuborilsa → **400** (ADMIN uchun ham). **Hech kim role'ni API orqali o'zgartira olmaydi.**

**Javob 200:** yangilangan user (hash'siz).

| Status | Qachon                                       |
| ------ | -------------------------------------------- |
| 200    | muvaffaqiyatli, o'zgarish saqlanadi          |
| 400    | bo'sh `fullName`, ortiqcha maydon, UUID emas |
| 401    | token yo'q                                   |
| 403    | USER boshqa userni o'zgartirmoqchi           |
| 404    | ADMIN so'radi, user yo'q                     |

---

### 13.7. `POST /categories`

|                  |                                                                  |
| ---------------- | ---------------------------------------------------------------- |
| Auth kerakmi?    | Ha                                                               |
| Kim foydalanadi? | Har qanday user (category **tokendagi** userga tegishli bo'ladi) |

**Body:** `{ "name": "Ish", "description": "Ish bilan bog'liq yozuvlar" }`

| Maydon        | Qoida                                                                             |
| ------------- | --------------------------------------------------------------------------------- |
| `name`        | majburiy, matn, bo'sh joylar olib tashlangandan keyin 1–100 belgi (`"   "` → 400) |
| `description` | ixtiyoriy, matn, 500 belgigacha                                                   |

`userId` ni body'dan **olma** (yuborilsa 400) — u tokendan olinadi.

**Javob 201:**

```json
{
  "id": "…",
  "name": "Ish",
  "description": "Ish bilan bog'liq yozuvlar",
  "userId": "…",
  "createdAt": "…",
  "updatedAt": "…"
}
```

| Status | Qachon                                            |
| ------ | ------------------------------------------------- |
| 201    | yaratildi                                         |
| 400    | `name` yo'q/bo'sh/uzun/matn emas, ortiqcha maydon |
| 401    | token yo'q                                        |

---

### 13.8. `GET /categories`

Auth: ha. Kim: har qanday user — **faqat o'zining** category'lari.
**Javob 200:** massiv (bo'sh bo'lsa `[]`). Status: 200 / 401.

### 13.9. `GET /categories/:id`

Auth: ha. Kim: egasi. **Javob 200:** category obyekti.
Status: 200 / 400 (UUID emas) / 401 / **404** (yo'q **yoki boshqaning**).

### 13.10. `PATCH /categories/:id`

Auth: ha. Kim: egasi. **Body:** `{ "name"?: string, "description"?: string }` (ikkalasi ixtiyoriy, qoidalar 13.7 dagidek).
**Javob 200:** yangilangan category.
Status: 200 / 400 (bo'sh `name`, ortiqcha maydon, masalan `userId`) / 401 / 404.

### 13.11. `DELETE /categories/:id`

Auth: ha. Kim: egasi. **Javob 204** (tana yo'q).
Siyosat: ichidagi note'lar **o'chmaydi**, ularning `categoryId` si `null` bo'ladi (11.5).
Status: 204 / 401 / 404.

---

### 13.12. `POST /notes`

|                  |                 |
| ---------------- | --------------- |
| Auth kerakmi?    | Ha              |
| Kim foydalanadi? | Har qanday user |

**Body:**

```json
{
  "title": "Haftalik reja",
  "content": "Dushanba: ...",
  "categoryId": "3f0c6f3e-8c4b-4a8e-9d7b-2a1b0c9d8e7f"
}
```

| Maydon       | Qoida                                                             |
| ------------ | ----------------------------------------------------------------- |
| `title`      | majburiy, trim'dan keyin 1–200 belgi                              |
| `content`    | ixtiyoriy, matn, 10000 belgigacha. Berilmasa `""` saqlanadi       |
| `categoryId` | ixtiyoriy, UUID. **Faqat o'zingning category'ng** bo'lishi mumkin |

`isArchived`, `userId`, `id` kabi maydonlarni body'da **yuborib bo'lmaydi** (400).

**Javob 201:**

```json
{
  "id": "…",
  "title": "Haftalik reja",
  "content": "Dushanba: ...",
  "isArchived": false,
  "userId": "…",
  "categoryId": "…",
  "createdAt": "…",
  "updatedAt": "…"
}
```

`categoryId` berilmasa javobda `"categoryId": null`.

| Status | Qachon                                                                               |
| ------ | ------------------------------------------------------------------------------------ |
| 201    | yaratildi                                                                            |
| 400    | noto'g'ri DTO (title yo'q/bo'sh/201+ belgi, `categoryId` UUID emas), ortiqcha maydon |
| 401    | token yo'q                                                                           |
| 404    | `categoryId` mavjud emas **yoki boshqa userniki** — note yaratilmaydi                |

### 13.13. `GET /notes`

|                  |                                                |
| ---------------- | ---------------------------------------------- |
| Auth kerakmi?    | Ha                                             |
| Kim foydalanadi? | Har qanday user — faqat **o'zining** note'lari |

**Query parametrlari** (hammasi ixtiyoriy):

| Parametr     | Qoida                                                                             | Standart                                          |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| `page`       | butun son, >= 1                                                                   | 1                                                 |
| `limit`      | butun son, 1–50                                                                   | 10                                                |
| `categoryId` | UUID                                                                              | —                                                 |
| `isArchived` | `true` yoki `false` (boshqa qiymat → 400)                                         | berilmasa: arxivlangan va faol note'lar **birga** |
| `search`     | matn; `title` ichidan qidiradi, **katta-kichik harfga e'tiborsiz**, qisman moslik | —                                                 |

Boshqa har qanday query parametr (masalan `?foo=1`) → **400**.

**Tartib:** eng yangisi birinchi (`createdAt` kamayish tartibida).

**Javob 200:**

```json
{
  "data": [
    {
      "id": "…",
      "title": "Haftalik reja",
      "content": "…",
      "isArchived": false,
      "userId": "…",
      "categoryId": null,
      "createdAt": "…",
      "updatedAt": "…"
    }
  ],
  "meta": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 }
}
```

- `total` — **filtrlarga mos keladigan** jami note'lar soni (faqat shu sahifadagi emas).
- `totalPages` = `Math.ceil(total / limit)` (`total=0` bo'lsa `0`).
- Mavjud bo'lmagan sahifa (`page=99`) → `200` va `"data": []`.
- Boshqa userning `categoryId`'si bilan filtrlansang → `200` va bo'sh natija (404 emas).

| Status | Qachon                                                                                    |
| ------ | ----------------------------------------------------------------------------------------- |
| 200    | muvaffaqiyatli                                                                            |
| 400    | `page=0`, `limit=51`, `page=abc`, `isArchived=maybe`, `categoryId=abc`, noma'lum parametr |
| 401    | token yo'q                                                                                |

### 13.14. `GET /notes/:id`

Auth: ha. Kim: egasi. **Javob 200:** note obyekti (13.12 dagidek).
Status: 200 / 400 / 401 / **404** (yo'q yoki boshqaniki).

### 13.15. `PATCH /notes/:id`

Auth: ha. Kim: egasi.
**Body** (hammasi ixtiyoriy): `{ "title"?: string, "content"?: string, "categoryId"?: uuid }`. Qoidalar 13.12 dagidek. `isArchived` yuborilsa → 400 (buning uchun alohida `/archive` endpoint bor).
**Javob 200:** yangilangan note.
Status: 200 / 400 / 401 / 404 (note yo'q/boshqaniki **yoki** `categoryId` boshqa userniki/yo'q).

### 13.16. `DELETE /notes/:id`

Auth: ha. Kim: egasi. **Javob 204.**
Note'ning attachment'lari ham o'chadi, **fizik fayllar ham** (M8, 18.7).
Status: 204 / 401 / 404.

### 13.17. `PATCH /notes/:id/archive`

|                  |                  |
| ---------------- | ---------------- |
| Auth kerakmi?    | Ha               |
| Kim foydalanadi? | Faqat note egasi |
| Body             | **yo'q**         |

Bu endpoint **almashtiradi (toggle)**: faol note → arxivlanadi (`isArchived: true`); arxivlangan note → tiklanadi (`isArchived: false`).

**Javob 200:** yangilangan note (`isArchived` yangi qiymat bilan).
Status: 200 / 400 (UUID emas) / 401 / 404.

> Diqqat: bu route `PATCH /notes/:id` dan **uzunroq**, shuning uchun ikkalasi ham alohida ishlaydi. Lekin controller ichida `@Patch(':id/archive')` ni yoz.

---

### 13.18. `POST /notes/:noteId/attachments`

|                   |                       |
| ----------------- | --------------------- |
| Auth kerakmi?     | Ha                    |
| Kim foydalanadi?  | Faqat note egasi      |
| Content-Type      | `multipart/form-data` |
| Fayl maydoni nomi | **`file`**            |

Ruxsat etilgan fayl turlari (`mimetype`) va limit — 18.2 da.

Postman'da: Body → form-data → key `file` (turini **File** qil) → faylni tanla. Terminalda:

```bash
curl -X POST http://localhost:3000/notes/<NOTE_ID>/attachments \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@./rasm.png"
```

**Javob 201:**

```json
{
  "id": "…",
  "originalName": "rasm.png",
  "mimeType": "image/png",
  "size": 18234,
  "noteId": "…",
  "createdAt": "…"
}
```

Javobda `storageName`, fayl yo'li yoki `uploads` papkasi haqida **hech narsa bo'lmasligi** kerak.

| Status | Qachon                                                                                                   |
| ------ | -------------------------------------------------------------------------------------------------------- |
| 201    | yuklandi                                                                                                 |
| 400    | fayl yuborilmadi; fayl `file` dan boshqa nomli maydonda yuborildi; `multipart` emas; `:noteId` UUID emas |
| 401    | token yo'q                                                                                               |
| 404    | note yo'q yoki boshqa userniki (fayl **saqlanmaydi**)                                                    |
| 413    | fayl 5 MB dan katta                                                                                      |
| 415    | fayl turi ruxsat etilmagan                                                                               |
| 500    | saqlashda server xatosi (xabar umumiy: yo'l/stack yo'q; DB'da yozuv qolmaydi)                            |

### 13.19. `GET /attachments/:id`

|                  |                                       |
| ---------------- | ------------------------------------- |
| Auth kerakmi?    | Ha                                    |
| Kim foydalanadi? | Faqat note egasi (ADMIN ham **emas**) |

**Javob 200:** faylning o'zi (baytlar). Headerlar:

- `Content-Type: image/png` (saqlangan `mimeType`);
- `Content-Disposition: attachment; filename="rasm.png"` (asl nom).

Status: 200 / 400 (UUID emas) / 401 / 404 (yo'q yoki boshqaniki).

### 13.20. `DELETE /attachments/:id`

Auth: ha. Kim: faqat note egasi. **Javob 204.**
DB yozuvi **va diskdagi fizik fayl** o'chadi. Agar fizik fayl allaqachon yo'q bo'lsa ham — xato bermay 204 qaytar (yozuv baribir o'chadi).
Status: 204 / 401 / 404.

---

## 14. Authentication va JWT ishlash jarayoni

### 14.1. Umumiy oqim

```
REGISTER                          LOGIN                               HIMOYALANGAN SO'ROV
─────────                         ─────                               ───────────────────
DTO tekshiruv                     DTO tekshiruv                       Authorization: Bearer <token>
email band emasmi? (409)          email bo'yicha user topish                │
hashPassword(parol)               comparePassword(parol, hash)              ▼
user saqlash                      to'g'ri bo'lsa JWT yaratish         JwtAuthGuard → JwtStrategy
user qaytarish (hash'siz)           payload: { sub: user.id, role }     token imzosi va muddatini tekshiradi
                                  { accessToken } qaytarish             validate(payload) → user
                                                                        request.user = user
                                                                        │
                                                                        ▼
                                                                      Controller (@CurrentUser())
```

### 14.2. Qadamlar

1. **Parol util (`src/common/utils/password.util.ts`).** `bcrypt` bilan `hashPassword(plain)` va `comparePassword(plain, hash)` yoz (ikkalasi `Promise` qaytaradi). Unit test: `npm run test:m2`.
2. **`AuthModule`.** `JwtModule.registerAsync` — `secret` ni `ConfigService`dan (`JWT_SECRET`), `signOptions.expiresIn` ni `JWT_EXPIRES_IN` dan ol. `PassportModule` ni import qil.
3. **`register`.** Email bo'yicha mavjud user bor bo'lsa → `ConflictException` (409). Parolni hash qil, saqla. Javobga `passwordHash` ni **qo'shma** (HINTS: «Parol hash'ini javobdan olib tashlash»).
4. **`login`.** Userni email bo'yicha top; yo'q bo'lsa **yoki** parol mos kelmasa → `UnauthorizedException` (bir xil xabar bilan). JWT yarat: payload `{ sub: user.id, role: user.role }`.
5. **`JwtStrategy`** (`passport-jwt`): token `Authorization` headerdan `Bearer` sifatida olinadi, `ignoreExpiration: false`, `secretOrKey` — `JWT_SECRET`. `validate(payload)` ichida userni bazadan `payload.sub` bo'yicha yuklab, qaytar (u `request.user` ga tushadi). User topilmasa → `UnauthorizedException`.
6. **`JwtAuthGuard`** — `AuthGuard('jwt')` dan meros.
7. **`@CurrentUser()`** — `request.user` ni qaytaradigan param dekorator (`src/common/decorators/`).
8. **Himoya.** `register` va `login` dan **tashqari** barcha endpointlarga `@UseGuards(JwtAuthGuard)` (controller darajasida qo'yish qulay).
9. `GET /auth/me` — `@CurrentUser()` ni qaytaradi (hash'siz).
10. `npm run test:m2`.

### 14.3. Xavfsizlik qoidalari

- Parol database'da **faqat bcrypt hash** sifatida (test `users` jadvalini tekshiradi).
- `passwordHash` hech qaysi javobda va logda chiqmaydi.
- Login xatosida «email yo'q» va «parol noto'g'ri» ni **ajratma**.
- `JWT_SECRET` ni kodga yozma.

---

## 15. Guard va RBAC ishlash jarayoni

**RBAC** (Role-Based Access Control) — ruxsat **rolga** qarab beriladi. Bizda faqat ikkita rol: `ADMIN` va `USER`.

### 15.1. Qismlar

1. **`@Roles(...roles)` dekorator** (`src/common/decorators/roles.decorator.ts`) — `SetMetadata` yordamida handler/klassga ruxsat etilgan rollar ro'yxatini «yopishtiradi».
2. **`RolesGuard`** (`src/common/guards/roles.guard.ts`) — `Reflector` orqali shu metadata'ni o'qiydi va `request.user.role` bilan solishtiradi.

### 15.2. RolesGuard qoidalari (unit test shularni tekshiradi)

| Holat                                    | Natija                                                                         |
| ---------------------------------------- | ------------------------------------------------------------------------------ |
| Handler yoki klassda `@Roles()` **yo'q** | ruxsat (`true`)                                                                |
| `@Roles(ADMIN)` va user `ADMIN`          | ruxsat                                                                         |
| `@Roles(ADMIN)` va user `USER`           | rad (`false` — Nest buni 403 ga aylantiradi, yoki `ForbiddenException` tashla) |
| `@Roles(ADMIN, USER)` va user `USER`     | ruxsat (ro'yxatdan biri yetarli)                                               |
| `request.user` yo'q                      | rad                                                                            |

Konstruktor: `constructor(private reflector: Reflector)` — test `new RolesGuard(new Reflector())` deb chaqiradi.

### 15.3. Ishlatish

`GET /users` ga: `@UseGuards(JwtAuthGuard, RolesGuard)` va `@Roles(UserRole.ADMIN)`.

> **Tartib muhim:** `JwtAuthGuard` **birinchi** turishi kerak — u `request.user` ni to'ldiradi, `RolesGuard` esa uni o'qiydi.

### 15.4. Rol tekshiruvi ≠ egalik tekshiruvi

Bu ikkisi **alohida** narsa:

- `RolesGuard`: «bu endpointga **ADMIN**lar kira oladimi?» → faqat `GET /users`.
- Egalik: «bu **aynan shu** resurs shu userniki-mi?» → service ichida, **har bir so'rovda**.

Misol: `GET /users/:id` ga USER ham, ADMIN ham kira oladi (rol tekshiruvi yo'q), lekin service ichida `user.id === id || user.role === ADMIN` tekshiriladi.

---

## 16. Category va Note CRUD

### 16.1. Egalik qoidasi (eng muhim qoida)

Category va Note service'laridagi **har bir** database so'rovi `userId` bo'yicha cheklanishi kerak:

```
findOne({ where: { id, userId: currentUser.id } })   ← boshqa userniki bo'lsa, shunchaki "topilmadi"
```

Natija topilmasa → `NotFoundException` (404). Shu bilan «yo'q» va «boshqaniki» holatlari avtomatik bir xil bo'ladi.

> `findOne({ where: { id } })` ni **hech qachon** egalik tekshiruvisiz ishlatma — bu boshqa user ma'lumotlarini ochib qo'yadi.

### 16.2. Category (M4) — qadamlar

1. `Category` entity (`*.entity.ts`, jadval `categories`), `User` bilan `@ManyToOne`.
2. Migration: `npm run migration:generate -- src/database/migrations/CreateCategories`, keyin `npm run migration:run`.
3. DTO'lar: `CreateCategoryDto`, `UpdateCategoryDto` (13.7, 13.10 qoidalari; `name` ni `trim` qil).
4. Service: `create`, `findAll`, `findOne`, `update`, `remove` — hammasi `userId` bilan.
5. Controller: `@Controller('categories')`, `@UseGuards(JwtAuthGuard)`, `:id` uchun `ParseUUIDPipe`, `DELETE` uchun `@HttpCode(204)`.
6. `npm run test:m4`.

### 16.3. Note (M5) — qadamlar

1. `Note` entity (jadval `notes`): `User` va `Category` bilan `@ManyToOne`. Category o'chirilganda `onDelete: 'SET NULL'` (11.5).
2. Migration (`CreateNotes`) + `migration:run`. **Category migration'ini avval qo'llaganingga ishonch hosil qil.**
3. DTO'lar: `CreateNoteDto`, `UpdateNoteDto`.
4. **`categoryId` tekshiruvi:** `categoryId` kelganda `categoryRepo.findOne({ where: { id: categoryId, userId } })` — topilmasa `NotFoundException`. Bu tekshiruvni `create` va `update` ikkalasida ham qil.
5. `archive`: note'ni egalik bilan top, `isArchived = !isArchived`, saqla.
6. Category o'chirilganda note'lar saqlanishini tekshir (M5 testida bor).
7. `npm run test:m5`.

### 16.4. Pagination, filtr va qidiruv (M6) — qadamlar

1. **Unit test funksiyalari (avval shularni yoz, tez yashil bo'ladi):**
   - `src/common/utils/pagination.util.ts`:
     - `getPagination({ page?, limit? })` → `{ page, limit, skip }`; standart `page=1`, `limit=10`; `skip = (page - 1) * limit`.
     - `buildPaginationMeta(total, page, limit)` → `{ total, page, limit, totalPages }`.
   - `src/notes/notes-query.util.ts`: `buildNotesWhere(userId, { categoryId?, isArchived?, search? })` TypeORM `where` obyektini qaytaradi:
     - `userId` **doim** bor;
     - `categoryId` faqat berilsa qo'shiladi;
     - `isArchived` **`false` bo'lsa ham** qo'shiladi (faqat `undefined` bo'lsa qo'shilmaydi!);
     - `search` berilsa: `title: ILike('%matn%')`; atrofdagi bo'sh joylar olib tashlanadi; faqat bo'sh joydan iborat bo'lsa e'tiborga olinmaydi; `%`, `_` va `\` belgilari oddiy harf sifatida qidirilishi uchun ularning oldiga `\` qo'yiladi (`100%` → `100\%`).
   - `npm run test:m6` — unit testlar yashil bo'ladi.
2. **`ListNotesQueryDto`** — query parametrlari DTO'si (13.13 jadvali). Query qiymatlari **matn** bo'lib keladi: `page`/`limit` ni songa aylantir (`@Type(() => Number)` + `@IsInt()`), `isArchived` ni **ehtiyotkor** boolean'ga aylantir (HINTS: «Query'dagi boolean»).
3. Service: `findAndCount({ where: buildNotesWhere(...), order: { createdAt: 'DESC' }, skip, take })` → `{ data, meta }`.
4. E2E: `npm run test:m6`.

---

## 17. Middleware va Interceptor

### 17.1. Request logging middleware (`src/common/middleware/logger.middleware.ts`)

Nima qilishi kerak:

- Har bir so'rov **tugaganda** (`res.on('finish', ...)`) **bitta qator** log yozadi: **method, URL, status kodi va davomiyligi** — masalan `GET /notes?page=1 200 12ms`.
  - Method, URL va status **bir qatorda** bo'lishi shart (test qator bo'yicha qidiradi).
- **Hech qachon** logga yozma: parol, JWT token, `Authorization` header, `passwordHash`.
- Eng xavfsiz yo'l: body yoki header'larni umuman loglama. Agar loglasang, avval `redactSensitive(...)` dan o'tkaz.

`src/common/utils/redact.util.ts`: `redactSensitive(value)` — ichma-ich obyekt/massivni **nusxalab** qaytaradi, quyidagi kalitlarning (katta-kichik harfga e'tiborsiz) qiymatini `'[REDACTED]'` ga almashtiradi: `password`, `passwordHash`, `token`, `accessToken`, `authorization`, `cookie`. Asl obyektni **o'zgartirmaydi**. Primitiv qiymat va `null`/`undefined` bilan xato bermaydi. Unit test: `npm run test:m7`.

`LoggerMiddleware` ni `AppModule` ichida ulash: `AppModule` `NestModule` interfeysini implement qilib, `configure(consumer: MiddlewareConsumer)` ichida `consumer.apply(LoggerMiddleware).forRoutes(...)` chaqiradi (hamma route uchun).

### 17.2. Timing interceptor (`src/common/interceptors/timing.interceptor.ts`)

- So'rov boshlanganda vaqtni eslab qoladi; tugaganda farqni millisekundda hisoblaydi.
- Javobga header qo'shadi: **`X-Response-Time: 12ms`** (format: raqam + `ms`).
- **Muvaffaqiyatli ham, xato bilan tugagan so'rovlarda ham** header bo'lishi kerak (masalan 404 va 400 da). Ya'ni `tap` bilan birga xato holatini ham qo'lla (`catchError`), headerni qo'yib, xatoni **qayta tashla**.
- Global ulanadi: `src/app.setup.ts` ichida `app.useGlobalInterceptors(new TimingInterceptor())`.

### 17.3. Global ValidationPipe (`src/app.setup.ts`)

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### 17.4. Xato formati va status kodlari

NestJS'ning o'rnatilgan exception'laridan foydalan, **murakkab custom exception arxitekturasi yaratma**:

| Status | Qachon                           | Exception                                                  |
| ------ | -------------------------------- | ---------------------------------------------------------- |
| 400    | noto'g'ri DTO/UUID/fayl yo'q     | `ValidationPipe` / `ParseUUIDPipe` / `BadRequestException` |
| 401    | token yo'q/noto'g'ri, login xato | `UnauthorizedException`                                    |
| 403    | rol/ruxsat yo'q                  | `ForbiddenException`                                       |
| 404    | resurs topilmadi                 | `NotFoundException`                                        |
| 409    | email band                       | `ConflictException`                                        |
| 413    | fayl juda katta                  | `PayloadTooLargeException`                                 |
| 415    | fayl turi mumkin emas            | `UnsupportedMediaTypeException`                            |
| 500    | kutilmagan xato                  | (Nest o'zi, xabari umumiy)                                 |

Hamma xato javobi: JSON, `statusCode` (HTTP status bilan bir xil), `message` (matn yoki massiv). `stack`, fayl yo'li, SQL — **yo'q**.

`npm run test:m7`.

---

## 18. File Upload ishlash jarayoni

### 18.1. Multer qanday ishlaydi (avval shuni tushun)

```
Mijoz: POST /notes/:id/attachments   Content-Type: multipart/form-data
         │  tana: "file" maydoni = fayl baytlari
         ▼
JwtAuthGuard                ← avval kimligini tekshiradi (401 bo'lsa Multer ishga tushmaydi)
         ▼
FileInterceptor('file', {limits, fileFilter?, storage?})   ← Multer shu yerda ishlaydi
   • multipart tanani o'qiydi
   • limits.fileSize dan oshsa → 413
   • "file" nomidan boshqa maydondagi fayl → 400
   • faylni xotiraga (MemoryStorage) YOKI diskka (DiskStorage) joylaydi
         ▼
Controller: @UploadedFile() file   ← file: { originalname, mimetype, size, buffer | path }
         ▼
Service: egalikni tekshirish → validatsiya → diskka yozish → DB'ga metadata
```

`FileInterceptor` `@nestjs/platform-express` ichida. `@UseInterceptors(FileInterceptor('file', { limits: { fileSize: ... } }))` — Multer'ning `limits.fileSize` xatosini Nest o'zi `413` ga aylantiradi.

### 18.2. Qoidalar

| Qoida                     | Qiymat                                                     |
| ------------------------- | ---------------------------------------------------------- |
| Maksimal hajm             | **5 MB** = `5 * 1024 * 1024` bayt                          |
| Ruxsat etilgan `mimetype` | `image/png`, `image/jpeg`, `application/pdf`, `text/plain` |
| Boshqa turlar             | **415**                                                    |
| Katta fayl                | **413**                                                    |
| Fayl yuborilmagan         | **400**                                                    |
| Saqlash joyi              | `UPLOAD_DIR` (standart `./uploads`), faqat lokal disk      |
| Saqlash nomi              | noyob, tasodifiy; asl nomdan **foydalanilmaydi**           |

### 18.3. Memory yoki Disk storage?

|              | MemoryStorage                                                                      | DiskStorage                                                                              |
| ------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Fayl qayerda | RAM (`file.buffer`)                                                                | to'g'ridan-to'g'ri diskka                                                                |
| Afzalligi    | avval tekshirib, keyin yozish mumkin; ruxsat bo'lmasa diskka **umuman tegilmaydi** | RAM ishlatmaydi                                                                          |
| Kamchiligi   | RAM ishlatadi (bizda 5 MB gacha — muammo emas)                                     | Controller'ga kelmasdan **fayl yoziladi**; keyin 404/415 bo'lsa, o'chirib tashlash kerak |

**Tavsiya:** `MemoryStorage` (Multer'ning standarti) + service ichida o'zing diskka yozish. Shunda 404/415 holatlarida diskda ortiqcha fayl qolmaydi. (Disk storage'ni ham ishlatsang bo'ladi, lekin xatolikda faylni o'zing o'chirishing shart.)

### 18.4. Fayl validatsiyasi (`src/attachments/file-validation.util.ts`)

Unit test bilan tekshiriladigan sof funksiyalar:

- `ALLOWED_MIME_TYPES` — 18.2 dagi to'rtta tur (massiv).
- `MAX_FILE_SIZE_BYTES` — `5 * 1024 * 1024`.
- `validateUploadedFile(file)` — `file` = `{ originalname, mimetype, size }`:
  - `file` yo'q (`undefined`) → `BadRequestException` (400);
  - `mimetype` ruxsat etilmagan → `UnsupportedMediaTypeException` (415);
  - `size > MAX_FILE_SIZE_BYTES` → `PayloadTooLargeException` (413);
  - aynan 5 MB — **ruxsat**.
- `generateStorageName(originalName)` — **har chaqiriqda noyob** nom (masalan `randomUUID()` + kengaytma). Talablar: asl nomning o'zi (`passwd`, `evil`...) natijada bo'lmasin; `/`, `\`, `..` bo'lmasin; kengaytma **kichik harfda** saqlansin (`Report.PDF` → `….pdf`). Kengaytmani `path.extname()` bilan ol.

`npm run test:m8` — unit testlar bilan boshlab, keyin e2e.

### 18.5. Qadamlar

1. `Attachment` entity (jadval `attachments`) — `Note` bilan `@ManyToOne`, `onDelete: 'CASCADE'`. Migration `CreateAttachments` + `migration:run`.
2. `.gitignore` da `uploads/` borligini tekshir (tayyor).
3. `file-validation.util.ts` ni yoz (18.4), unit testni yashil qil.
4. `AttachmentsService.create(user, noteId, file)`:
   1. note'ni `userId` bilan top → topilmasa **404** (fayl saqlanmasdan oldin!);
   2. `validateUploadedFile(file)`;
   3. `storageName = generateStorageName(file.originalname)`;
   4. upload papkasi mavjudligini ta'minla (`fs.mkdir(dir, { recursive: true })`);
   5. faylni `path.join(UPLOAD_DIR, storageName)` ga yoz;
   6. DB'ga yoz: `originalName`, `storageName`, `mimeType`, `size`, `noteId`;
   7. DB xato bersa — yozilgan faylni o'chir (yetim fayl qolmasin).
5. Fayl yozishda xato (papka yozib bo'lmaydi, joy yo'q va h.k.) → xatoni ushla, **`InternalServerErrorException` bilan umumiy xabar** qaytar (diskdagi yo'lni xabarga **qo'shma**), DB'da yozuv **qolmasin**.
6. Controller: `@Post('notes/:noteId/attachments')`, `FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } })`, `@UploadedFile() file`. `:noteId` uchun `ParseUUIDPipe`. Controller `@Controller()` (prefiks yo'q) bo'lishi yoki ikki controller ishlatilishi mumkin — URL'lar 13.18–13.20 bilan bir xil bo'lsin.
7. **Fayl turi** `fileFilter`da yoki service'da tekshirilishi mumkin. Asosiysi — natija 415.

### 18.6. Yuklab olish va o'chirish

- `GET /attachments/:id`: attachment'ni **note orqali** top: attachment'ning note'i shu userga tegishli bo'lishi kerak (aks holda 404). Keyin faylni `UPLOAD_DIR + storageName` dan o'qib yubor; `Content-Type` = `mimeType`, `Content-Disposition` = asl nom. (Express'ning `res.download(path, originalName)` yoki Nest'ning `StreamableFile` — qaysi biri qulay bo'lsa.) Fizik fayl topilmasa → 404.
- `DELETE /attachments/:id`: egalikni tekshir → DB yozuvini o'chir → fizik faylni o'chir (`fs.unlink`). Fayl allaqachon yo'q bo'lsa (`ENOENT`) — xato emas.

### 18.7. Note o'chirilganda (★ qiyinroq)

`DELETE /notes/:id` da note'ni o'chirishdan **oldin** uning attachment'larini top va fizik fayllarini o'chir (DB yozuvlari `CASCADE` bilan o'zi o'chadi). Aks holda diskda yetim fayllar qoladi.

### 18.8. Xavfsizlik

- Asl fayl nomini **hech qachon** saqlash yo'li sifatida ishlatma (`../../etc/passwd` kabi nomlar xavfli).
- API javoblarida server yo'li, `storageName` yoki `uploads` ko'rsatilmasin.
- Egasi bo'lmagan hech kim (ADMIN ham) faylni ko'ra yoki o'chira olmaydi.
- Eslatma: `mimetype` ni mijoz o'zi yuboradi — u soxtalashtirilishi mumkin. Haqiqiy loyihada fayl mazmuni ham tekshiriladi; bu topshiriq uchun `mimetype` yetarli.

---

## 19. Testlarni ishga tushirish

### 19.1. Bir martalik sozlash

```bash
cp .env.test.example .env.test       # agar hali qilmagan bo'lsang
```

`.env.test` da `DB_DATABASE=noteflow_test` ekanini tekshir (6.5 da yaratgansan). Qolgan DB ma'lumotlari `.env` dagidek.

Test database'iga migration'larni **o'zing qo'llashing shart emas** — e2e testlar boshlanishidan oldin `src/database/data-source.ts` orqali avtomatik qo'llanadi (`synchronize` ishlatilmaydi).

### 19.2. Buyruqlar

| Maqsad                                | Buyruq                                                  |
| ------------------------------------- | ------------------------------------------------------- |
| Barcha **unit** testlar               | `npm run test:unit`                                     |
| Barcha **e2e** testlar                | `npm run test:e2e`                                      |
| Hamma testlar                         | `npm test`                                              |
| M1 — database ulanishi                | `npm run test:m1`                                       |
| M2 — auth (e2e + parol unit)          | `npm run test:m2` (yoki `npm run test:auth`)            |
| M3 — users va RBAC                    | `npm run test:m3`                                       |
| M4 — categories                       | `npm run test:m4` (yoki `npm run test:categories`)      |
| M5 — notes                            | `npm run test:m5`                                       |
| M6 — qidiruv/filtr/pagination         | `npm run test:m6`                                       |
| Notes umuman (M5 + M6)                | `npm run test:notes`                                    |
| M7 — middleware, interceptor, xatolar | `npm run test:m7`                                       |
| M8 — fayl yuklash                     | `npm run test:m8` (yoki `npm run test:upload`)          |
| Faqat bitta testni nomi bo'yicha      | `npx jest -c test/jest.config.js --runInBand -t "so'z"` |
| TypeScript tekshiruvi                 | `npm run typecheck`                                     |

Har bir `test:mN` shu milestone'ning **unit va e2e** testlarini birga ishga tushiradi.

### 19.3. Testlar qanday ishlaydi

- E2E testlar **haqiqiy PostgreSQL** (`noteflow_test`) bilan ishlaydi va `AppModule` + `setupApp` dan **to'liq ilova** yaratadi. Mock yo'q.
- Har bir test oldidan barcha jadvallar tozalanadi → testlar **bir-biriga bog'liq emas** va istalgan tartibda ishlay oladi.
- E2E testlar ketma-ket (`--runInBand`) ishlaydi, chunki bitta database ulashiladi.
- Fayl yuklash testlari `UPLOAD_DIR=./uploads-test` papkasidan foydalanadi va har bir test oldidan/keyin uni tozalaydi. Sening haqiqiy `uploads/` papkang tegilmaydi.

### 19.4. Xavfsizlik to'siqlari

Test infratuzilmasi quyidagilar bajarilmasa **ishlashni rad etadi** (hech narsa o'chirmaydi):

- `NODE_ENV=test`;
- `DB_DATABASE` `_test` bilan tugaydi;
- `DB_HOST` lokal (`localhost`/`127.0.0.1`);
- test database nomi `.env` dagi development database nomidan farq qiladi;
- `UPLOAD_DIR` nomida `test` so'zi bor;
- ulangandan keyin `SELECT current_database()` ham test database'ni ko'rsatadi;
- `synchronize: true` yo'q.

### 19.5. Tez-tez uchraydigan test xatolari

| Xabar                                                        | Ma'nosi / nima qilish kerak                                                                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `.env.test fayli topilmadi`                                  | `cp .env.test.example .env.test`                                                                                              |
| `XAVFSIZLIK: test database nomi "_test" bilan tugashi shart` | `.env.test` da `DB_DATABASE=noteflow_test` yoz                                                                                |
| `src/database/data-source.ts topilmadi`                      | 7.4 ni bajar                                                                                                                  |
| `Test database'ga ulanib/migratsiya qilib bo'lmadi`          | 7.6 (ulanish xatolari)                                                                                                        |
| `Cannot find module '../../src/...'`                         | testlar kutgan fayl hali yo'q — 9.1 jadvaliga qara                                                                            |
| `DataSource topilmadi`                                       | `AppModule` da `TypeOrmModule.forRootAsync` ulanmagan                                                                         |
| `relation "categories" does not exist`                       | migration yaratilmagan yoki qo'llanmagan — 8.6                                                                                |
| `Jest did not exit` / testlar tugamaydi                      | ilovada ochiq ulanish qolgan; `app.close()` e2e'da avtomatik chaqiriladi, o'zingning kodingda `setInterval` kabilarni tekshir |

Qizil test chiqsa: test nomini o'qi → `test/e2e/mN-*.ts` dan shu testni top → u **qanday so'rov** yuboryapti va **qanday status/javob** kutyapti — shuni `curl` yoki Postman bilan qo'lda takrorla.

---

## 20. Definition of Done

Topshiriq tugadi, agar **hammasi** bajarilgan bo'lsa:

### Database va sozlash

- [ ] PostgreSQL'da `noteflow` user va `noteflow_dev`, `noteflow_test` database'lari bor.
- [ ] `.env` va `.env.test` to'ldirilgan, git'ga qo'shilmagan.
- [ ] Ilova `npm run start:dev` bilan xatosiz ishga tushadi va PostgreSQL'ga ulanadi.
- [ ] Jadvallar **faqat migration** orqali yaratilgan; hech qayerda `synchronize: true` yo'q.
- [ ] `npm run migration:show` — barcha migration'lar qo'llangan.

### Funksional

- [ ] 20 ta endpoint 12–13-bo'limlarga muvofiq ishlaydi.
- [ ] Hech qaysi javobda `passwordHash` yoki parol yo'q.
- [ ] Foydalanuvchi faqat o'z category/note/attachment'lariga kira oladi.
- [ ] Category o'chirilganda note'lar saqlanadi (`categoryId = null`).
- [ ] Note o'chirilganda attachment yozuvlari va fizik fayllar o'chadi.
- [ ] Attachment o'chirilganda fizik fayl ham o'chadi.
- [ ] Yuklangan fayllar 5 MB va ruxsat etilgan turlar bilan cheklangan; API javoblarida server yo'li yo'q.

### Kod sifati

- [ ] Global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) yoqilgan.
- [ ] `TimingInterceptor` va `LoggerMiddleware` ishlaydi; logda parol/token yo'q.
- [ ] Barcha xatolar bir xil JSON formatida, stack trace'siz.
- [ ] `npm run build` va `npm run typecheck` xatosiz o'tadi.
- [ ] Parol, JWT kaliti kodga yozilmagan (faqat `.env` da).

### Testlar

- [ ] `npm run test:m1` … `npm run test:m8` — har biri yashil.
- [ ] `npm run test:unit` — yashil.
- [ ] `npm run test:e2e` — yashil.
- [ ] Testlar fayllarini **o'zgartirmading**.

### O'zingni tekshir (testdan tashqari)

- [ ] Postman yoki `curl` bilan butun oqimni qo'lda o'tding: register → login → category → note → fayl yuklash → yuklab olish → o'chirish.
- [ ] Har bir qadamda **nima uchun** shunday ishlashini boshqa odamga tushuntira olasan (ayniqsa: nima uchun `synchronize` yo'q, nima uchun egalik 404 qaytaradi, nima uchun asl fayl nomi ishlatilmaydi).

---

> **Maslahat kerakmi?** `HINTS.md` ni och — qiyin joylar uchun qisqa va aniq yo'riqnomalar bor. Muvaffaqiyat!
