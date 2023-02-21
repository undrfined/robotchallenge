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

## 3. Run the dev frontent server

```sh
npm run start
```

## 4. Install backend dependencies

Either start a local Postgres & Redis server or use Docker Compose:

```sh
docker compose up postgres redis
```

Don't forget to update `/etc/hosts` file:

```
127.0.0.1       redis
127.0.0.1       postgres
```

## 5. Run the backend server

```sh
cd backend && cargo run
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

### 3. Run docker-compose

```sh
docker compose up -d
```