# Stage 1: Build the application
FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]