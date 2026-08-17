FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY public ./public
VOLUME ["/app/data"]
EXPOSE 3100
CMD ["node", "src/server.js"]
