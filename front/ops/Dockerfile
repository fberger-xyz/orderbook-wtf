# Use official Next.js image
FROM node:18-alpine
# Set working directory
WORKDIR /app
# Copy package.json and package-lock.json
COPY package*.json ./
# Install dependencies
RUN npm install
# Copy project files
COPY . .
# Expose port
EXPOSE 3000
# Start Next.js app
CMD ["npm", "run", "dev"]