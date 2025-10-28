FROM node:22

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

EXPOSE 5000

# Use nodemon in dev (expected dev deps to be present)
CMD ["npm", "run", "dev"]
