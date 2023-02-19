FROM node:18 as build

WORKDIR /usr/src/app

RUN curl https://sh.rustup.rs -sSf | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN rustup install 1.64.0
RUN rustup target add wasm32-wasi

COPY package.json ./
COPY vendor ./vendor
RUN npm run build:vendor
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache openssl

COPY --from=build /usr/src/app/build /usr/share/nginx/html

COPY nginx/default.conf /etc/nginx/conf.d/
COPY nginx/gzip.conf nginx/options-ssl-nginx.conf nginx/hsts.conf /etc/nginx/includes/
COPY nginx/site.conf.tpl /customization/
COPY nginx/nginx.sh /customization/

RUN chmod +x /customization/nginx.sh

EXPOSE 80

CMD ["/customization/nginx.sh"]