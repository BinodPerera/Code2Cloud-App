# --- Build Stage ---
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Optional: run build if a frontend asset or typescript build script exists
RUN npm run build --if-present

# --- Production Stage ---
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app ./

EXPOSE 3000
CMD ["sh", "-c", "if npm run | grep -E -q '^[[:space:]]*start'; then npm start; elif npm run | grep -E -q '^[[:space:]]*dev'; then npm run dev -- --host 0.0.0.0; elif npm run | grep -E -q '^[[:space:]]*preview'; then npm run preview -- --host 0.0.0.0; else node index.js || node server.js || node src/index.js || node src/main.js; fi"]