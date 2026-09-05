# Stage 1: Build
FROM node:22-alpine AS build
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

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Copy build artifacts to nginx public html
COPY --from=build /app/dist /usr/share/nginx/html
# Custom nginx conf for supporting React Router history API rules maps
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 3000
CMD ["nginx", "-g", "daemon off;"]
