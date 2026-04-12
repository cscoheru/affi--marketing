FROM node:20-alpine
WORKDIR /app

# Copy server code
COPY server/package.json server/package-lock.json ./
RUN npm ci --production

# Copy server source
COPY server/ ./server/

# Copy static frontend files
COPY index.html ./
COPY css/ ./css/
COPY js/ ./js/

EXPOSE 3010
ENV PORT=3010
CMD ["node", "server/server.js"]
