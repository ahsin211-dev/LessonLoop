FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENV NUXT_PUBLIC_API_BASE=http://localhost:3001/local
ENV HOST=0.0.0.0

CMD ["npm", "run", "dev"]
