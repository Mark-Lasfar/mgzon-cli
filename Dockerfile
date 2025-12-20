# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
# استخدم npm ci هنا عشان يولد/يستخدم lockfile صح
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime (صغير جدًا)
FROM node:20-slim
WORKDIR /app
# نسخ الـ dist + package.json + package-lock.json (المهم!)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# دلوقتي npm ci هيشتغل لأن lockfile موجود
RUN npm ci --only=production && npm cache clean --force
RUN chmod +x dist/index.js

EXPOSE 8080
ENTRYPOINT ["./dist/index.js"]