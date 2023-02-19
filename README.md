# RobotChallenge

## Running locally

### 1. Clone the repository

```sh
git clone git@github.com:undrfined/robotchallenge.git --recursive
cd robotchallenge
```

### 2. Install dependencies

You'll need:
- NodeJS
- Rust

```sh
rustup target add wasm32-wasi
npm run build:vendor
npm run build:core
npm install
```

## 3. Run the dev server

```sh
npm run start
```


## Deploying with Docker Compose

### 1. Clone the repository

```sh
git clone git@github.com:undrfined/robotchallenge.git --recursive
cd robotchallenge
```

### 2. Populate .env file

```sh
cp .env.example .env

# edit .env file
```

### 3. Create volumes

```sh
docker volume create --name=nginx_conf
docker volume create --name=letsencrypt_certs
```

### 4. Run docker-compose

```sh
docker compose up -d
```