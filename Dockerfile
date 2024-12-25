# Gunakan base image Node.js
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file proyek, termasuk folder sessions
COPY . .

# Salin folder sessions ke dalam image (misalnya di /app/sessions)
# COPY ./sessions /app/sessions
# RUN ls -l /app


# Jalankan bot
CMD ["node", "index.js"]