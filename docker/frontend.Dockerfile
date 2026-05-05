FROM node:20
WORKDIR /app
COPY frontend/ /app
RUN npm install
CMD ["npm", "run", "dev"]