FROM node:18 as build

WORKDIR /usr/src/app

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup install 1.64.0

COPY package.json ./
COPY vendor ./vendor
RUN npm run build:vendor
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
EXPOSE 443