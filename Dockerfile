# Use Node.js base image
FROM node:20-alpine

# Install Python, build dependencies, and libraries for canvas
RUN apk update && \
    apk add --no-cache \
    python3 \
    make \
    g++ \
    bash \
    pkgconfig \
    cairo-dev \
    pango-dev \
    pixman-dev \
    libjpeg-turbo-dev \
    libpng-dev

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Run the bot
CMD ["node", "index.js"]
