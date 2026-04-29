FROM node:20-alpine
WORKDIR /app

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm ci --only=production

# Copia o código
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]