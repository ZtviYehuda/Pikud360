# Dockerfile for Frontend Service
FROM node:20-alpine

WORKDIR /app

# Copy package configurations
COPY frontend/package*.json /app/

# Install dependencies
RUN npm install

# Copy application source code
COPY frontend/ /app/

# Expose Vite dev server port
EXPOSE 5173

# Run Vite dev server by default
CMD ["npm", "run", "dev", "--", "--host"]
