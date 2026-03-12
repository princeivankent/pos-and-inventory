FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# --ignore-scripts skips native compilation for escpos-usb (hardware not yet in use)
RUN npm ci --ignore-scripts

COPY . .

RUN npm run build
