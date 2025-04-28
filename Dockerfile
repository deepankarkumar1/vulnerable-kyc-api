# Use official Node.js LTS image
FROM node:16

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the app port
EXPOSE 3000

# Run the server
CMD ["node", "index.js"]
