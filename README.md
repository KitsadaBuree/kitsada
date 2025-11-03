# Restaurant Stack (Docker Compose)

สภาพแวดล้อมพร้อมใช้สำหรับ **Mobile**, **Dashboard**, **MySQL 8.0**, และ **phpMyAdmin**  
ดึงแอปจาก Docker Hub: `veerct/online_food_ordering_mobile` และ `veerct/online_food_ordering_dashboard`  
รองรับ **seed ข้อมูลอัตโนมัติครั้งแรก** ผ่านโฟลเดอร์ `seed/`

---

## วิธีดาวน์โหลดโปรเจกต์

### ทางเลือก A) ใช้ Git (แนะนำ)
```bash
git clone <YOUR_REPO_URL>.git
cd <project-root>
```

อัปเดตในอนาคต:
```bash
git pull
```

### ทางเลือก B) ดาวน์โหลดเป็น ZIP
1) กด Download ZIP จากหน้า GitHub ของโปรเจกต์  
2) แตกไฟล์ แล้วเปิดโฟลเดอร์ที่แตกออกมา:
```bash
cd <project-root>
```

> โครงโปรเจกต์ที่ต้องมี:
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

---

## ความต้องการ
- Docker Desktop/Engine ที่มี **docker compose v2**
- พอร์ตว่าง: `3000`, `3001`, `3307`, `8080`

---

## เริ่มใช้งานแบบ “ผู้ใช้ทั่วไป” (Run all services)
1) ตรวจไฟล์ env ใน `envs/` ให้ถูกต้อง (อย่างน้อย `envs/db.env`)  
2) (ออปชัน) วางไฟล์ `seed/00_dump.sql` หากต้องการข้อมูลตั้งต้น  
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

> สร้างค่า `JWT_SECRET`/`AUTH_SECRET`: `openssl rand -hex 32`  
> ใช้ **Gmail App Password** เป็น `SMTP_PASS` (เปิด 2FA ก่อน)

---

## โหมดพัฒนา (สำหรับผู้พัฒนาต่อ)

### 1) สตาร์ทเฉพาะฐานข้อมูล
```bash
docker compose up -d db phpmyadmin
# MySQL (host) : 127.0.0.1:3307
# phpMyAdmin   : http://localhost:8080  (Host: db)
```

### 2) ตั้งค่า `.env.local` ในแต่ละแอป (รันนอก Docker)
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

### 3) ติดตั้งและรัน Dev Server
```bash
cd dashboard_restaurant && npm i && npm run dev   # http://localhost:3000
cd ../mobile_orders && npm i && npm run dev       # http://localhost:3001
```

### 4) อัปเดต seed (เมื่อตาราง/ข้อมูลเปลี่ยน)
```bash
docker exec restaurant_mysql mysqldump \
  -u root -prootpass --single-transaction --routines --events \
  --databases restaurant_db > seed/00_dump.sql
# รี-seed: docker compose down -v && docker compose up -d db phpmyadmin
```

---

## คำสั่งที่ใช้บ่อย
```bash
# สถานะ
docker compose ps

# Log
docker compose logs -f db
docker compose logs -f dashboard
docker compose logs -f mobile

# อัปเดต image + รีสตาร์ต
docker compose pull
docker compose up -d

# ปิดบริการ
docker compose down

# รีเซ็ต DB + seed ใหม่ (ล้างข้อมูลทั้งหมด)
docker compose down -v
docker compose up -d
```

---

## พอร์ตเริ่มต้น
| Service     | URL/Port                |
|-------------|-------------------------|
| Dashboard   | http://localhost:3000   |
| Mobile      | http://localhost:3001   |
| MySQL (host)| 127.0.0.1:3307          |
| phpMyAdmin  | http://localhost:8080   |

> ในเครือข่าย Docker Compose ให้ใช้ `DB_HOST=db`, `DB_PORT=3306`

---

## อิมเมจที่ใช้งาน
- Mobile: `veerct/online_food_ordering_mobile:latest`  
- Dashboard: `veerct/online_food_ordering_dashboard:latest`  
- MySQL: `mysql:8.0`  
- phpMyAdmin: `phpmyadmin/phpmyadmin:latest`

พร้อมใช้งาน 🎉
```bash
docker compose up -d --pull always
```
