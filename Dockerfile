# Base image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Build the app (important!)
RUN npm run build

# Start the app
CMD ["node", "dist/index.js"]
