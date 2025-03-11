# Use Node.js base image
FROM mcr.microsoft.com/playwright:v1.41.0-focal

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Define the command to run the actor
CMD ["npm", "start"] 