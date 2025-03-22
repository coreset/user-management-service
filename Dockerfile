# Use Node.js official image
FROM node:22.14.0

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
# COPY package*.json ./
COPY package.json ./
COPY yarn.lock ./

# Instal dependencies  
#RUN npm install --only=production
RUN yarn install --frozen-lockfile  

# Ensure NestJS CLI is installed in node_modules
# RUN npm install @nestjs/cli --save-dev
RUN yarn add @nestjs/cli --save-dev

# Copy source files
COPY . .

# Build the project
# RUN npm run build
RUN yarn build

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
