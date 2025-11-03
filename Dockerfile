# ---- deps & build ----
FROM node:20-alpine AS builder
ARG BUILD_DIR
WORKDIR /app

# กันลืมส่ง BUILD_DIR
RUN test -n "$BUILD_DIR" || (echo "ERROR: BUILD_DIR is empty" && exit 1)

# ต้องมี lockfile เสมอสำหรับ npm ci
COPY ${BUILD_DIR}/package.json ./
COPY ${BUILD_DIR}/package-lock.json ./

# lib พื้นฐานสำหรับ alpine (กันปัญหา sharp / next บางเคส)
RUN apk add --no-cache libc6-compat

# ปิด telemetry ตอน build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci

# คัดลอกซอร์สแล้ว build
COPY ${BUILD_DIR}/ ./
RUN npm run build

# ---- runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# ถ้าใช้ Next standalone (แนะนำ):
# COPY --from=builder /app/.next/standalone ./
# COPY --from=builder /app/.next/static ./.next/static
# COPY --from=builder /app/public ./public

# ถ้าไม่ได้เปิด standalone ให้คัดลอกทั้งโฟลเดอร์ (เหมือนของคุณ)
COPY --from=builder /app ./

# เปิดพอร์ตภายในคอนเทนเนอร์เป็น 3000 (แก้ได้ด้วย -p / PORT)
EXPOSE 3000

# ให้ package.json จัดการพอร์ตเอง เช่น:
#  "start": "next start -p ${PORT:-3000}"
CMD ["npm","start"]
