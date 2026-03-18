# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Embed build ARGS for Vite to consume from process.env mapped strings
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Copy build artifacts to nginx public html
COPY --from=build /app/dist /usr/share/nginx/html
# Custom nginx conf for supporting React Router history API rules maps
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
