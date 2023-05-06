FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# Change port as needed
EXPOSE 3100

CMD ["npm", "start"]