# syntax=docker/dockerfile:1

# --- build ---
FROM node:24-alpine AS build
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist/datashare-frontend/browser /usr/share/nginx/html
EXPOSE 80
