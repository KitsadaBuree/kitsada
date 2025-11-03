# Restaurant Stack (Docker Compose)

สภาพแวดล้อมพร้อมใช้สำหรับ **Mobile**, **Dashboard**, **MySQL 8.0**, และ **phpMyAdmin**  
ดึงแอปจาก Docker Hub: `veerct/online_food_ordering_mobile` และ `veerct/online_food_ordering_dashboard`  
รองรับ **seed ข้อมูลอัตโนมัติครั้งแรก** ผ่านโฟลเดอร์ `seed/`.

---

## โครงโปรเจกต์

```
.
├─ docker-compose.yml
├─ envs/
│  ├─ db.env
│  ├─ dashboard.env
│  └─ mobile.env
└─ seed/
   └─ 00_dump.sql        # (ออปชัน) schema+data ของ restaurant_db
```

> ถ้าไม่มี `seed/00_dump.sql` ระบบจะขึ้นได้ แต่ฐานข้อมูลจะว่าง

---

## ความต้องการ
- Docker Desktop/Engine ที่มี **docker compose v2**
- พอร์ตว่าง: `3000`, `3001`, `3307`, `8080` (ปรับได้ใน compose)

---

## เริ่มใช้งาน (สำหรับผู้ใช้ทั่วไป)

1) ตรวจค่าตัวแปรใน `envs/` ให้ถูกต้อง (อย่างน้อย `db.env`)  
2) (ถ้ามี) วางไฟล์ `seed/00_dump.sql`  
3) รันคำสั่งเดียว:
```bash
docker compose up -d --pull always
```

**เข้าระบบ**
- Dashboard → <http://localhost:3000>  
- Mobile → <http://localhost:3001>  
- phpMyAdmin → <http://localhost:8080> (Host: `db`, user/pass ดูใน `envs/db.env`)

> ครั้งแรก MySQL จะ import ไฟล์ใน `seed/` อัตโนมัติเมื่อสร้าง volume ใหม่

---

## ตัวอย่างไฟล์ env

**envs/db.env**
```env
MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=restaurant_db
MYSQL_USER=morning
MYSQL_PASSWORD=kitsada
```

**envs/dashboard.env**
```env
NODE_ENV=production
PORT=3000
DB_HOST=db
DB_PORT=3306
DB_USER=morning
DB_PASSWORD=kitsada
DB_DATABASE=restaurant_db
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>
JWT_SECRET=<random-hex>
NEXT_PUBLIC_CUSTOMER_ORIGIN=http://localhost:3001
```

**envs/mobile.env**
```env
NODE_ENV=production
PORT=3000
DB_HOST=db
DB_PORT=3306
DB_USER=morning
DB_PASSWORD=kitsada
DB_DATABASE=restaurant_db
AUTH_SECRET=<random-hex>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email>
SMTP_PASS=<app_password>
FROM_EMAIL=<display@domain.com>
FROM_NAME=OTP_Service
APP_NAME=ร้านอาหาร
APP_ORIGIN=http://localhost:3001
```

> สร้างค่า `JWT_SECRET`/`AUTH_SECRET` แบบสุ่ม: `openssl rand -hex 32`  
> Gmail ควรใช้ **App Password** (เปิด 2FA → สร้าง App password)

---

## คำสั่งที่ใช้บ่อย

```bash
# ดูสถานะ
docker compose ps

# ดู log
docker compose logs -f db
docker compose logs -f dashboard
docker compose logs -f mobile

# ดึงอัปเดต image + รีสตาร์ต
docker compose pull
docker compose up -d

# ปิดบริการ
docker compose down

# รีเซ็ตฐานข้อมูล + seed ใหม่ (ล้างข้อมูลทั้งหมด)
docker compose down -v
docker compose up -d
```

---

## โหมดพัฒนา (สำหรับนักพัฒนาที่จะแก้โค้ด)

1) สตาร์ทเฉพาะ DB + phpMyAdmin
```bash
docker compose up -d db phpmyadmin
```

2) ตั้งค่า `.env.local` สำหรับรันนอก Docker  
   ชี้ DB ไปที่ `127.0.0.1:3307` ในแต่ละแอป:

**dashboard_restaurant/.env.local**
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=morning
DB_PASSWORD=kitsada
DB_DATABASE=restaurant_db
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>
JWT_SECRET=<random-hex>
NEXT_PUBLIC_CUSTOMER_ORIGIN=http://localhost:3001
```

**mobile_orders/.env.local**
```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=morning
DB_PASSWORD=kitsada
DB_DATABASE=restaurant_db
AUTH_SECRET=<random-hex>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email>
SMTP_PASS=<app_password>
FROM_EMAIL=<display@domain.com>
FROM_NAME=OTP_Service
APP_NAME=ร้านอาหาร
APP_ORIGIN=http://localhost:3001
```

3) ติดตั้งและรัน dev
```bash
cd dashboard_restaurant && npm i && npm run dev   # http://localhost:3000
cd ../mobile_orders && npm i && npm run dev       # http://localhost:3001
```

---

## พอร์ตเริ่มต้น

| Service     | URL/Port                   |
|-------------|----------------------------|
| Dashboard   | `http://localhost:3000`    |
| Mobile      | `http://localhost:3001`    |
| MySQL (host)| `127.0.0.1:3307`           |
| phpMyAdmin  | `http://localhost:8080`    |

> ในเครือข่าย Docker Compose ให้ใช้ `DB_HOST=db`, `DB_PORT=3306`

---

## แก้ปัญหาเร็ว

- **เข้าเว็บไม่ได้/DB ไม่พร้อม** → รอสักครู่, ดู `docker compose logs -f db`  
- **seed ไม่ทำงาน** → seed ทำงานเฉพาะตอนสร้าง volume ใหม่ → `docker compose down -v && up -d`  
- **พอร์ตชน** → แก้พอร์ตฝั่งซ้ายใน `ports:` (เช่น `3002:3000`, `3308:3306`, `8081:80`)

---

## อิมเมจที่ใช้
- Mobile: `veerct/online_food_ordering_mobile:latest`  
- Dashboard: `veerct/online_food_ordering_dashboard:latest`  
- MySQL: `mysql:8.0`  
- phpMyAdmin: `phpmyadmin/phpmyadmin:latest`

พร้อมใช้งาน 🎉  
```bash
docker compose up -d --pull always
```
