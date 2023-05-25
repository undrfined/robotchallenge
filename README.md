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

### 3. Populate .env file

Instructions on how to do that are [here](#populating-env-file).

### 4. Run the dev frontend server

```sh
npm run start
```

### 5. Install backend dependencies

Either start a local Postgres & Redis server or use Docker Compose:

```sh
docker compose up postgres redis
```

Don't forget to update `/etc/hosts` file:

```
127.0.0.1       redis
127.0.0.1       postgres
```

Also if you're running a local (not docker) Postgres server, you'll need to run the `postgres/init.sql` script.

### 6. Run the backend server

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

Instructions on how to do that are [here](#populating-env-file).

```sh
cp .env.example .env

# edit .env file
```

### 3. Run docker-compose

```sh
docker compose up -d
```

## Populating .env file

### 1. Endpoints

For local setup, you'll need to set the following fields in the `.env` file like so:

```
APP_API_ENDPOINT="localhost:8080/"
APP_UI_ENDPOINT="http://localhost:3000/"
```

For the docker setup, you'll need to set the following fields in the `.env` file like so:

```
APP_API_ENDPOINT="example.com/api"
APP_UI_ENDPOINT="https://example.com/"
```

### 2. Github OAuth

Firstly, you'll need to create a new OAuth application on GitHub. You can do that [here](https://github.com/settings/applications/new).

The callback URL should be `https://YOUR_DOMAIN/api/callback` if you're running in docker compose, and `http://localhost:8080/callback` if you're running locally.

Copy client id, client secret and redirect URL to the `.env` file (fields are `GH_CLIENT_ID`, `GH_CLIENT_SECRET` and `GH_REDIRECT_URI` respectively).

### 3. Postgres

You'll need to specify the following fields in the `.env` file:

- `POSTGRES_USER` - a username for the user
- `POSTGRES_PASSWORD` - a password for the user

Optionally, if you're running a docker container, you can specify the following fields:
- `PGADMIN_DEFAULT_EMAIL` - an email address for the pgadmin user 
- `PGADMIN_DEFAULT_PASSWORD` - a password for the pgadmin user

### 4. Let's Encrypt config (only used for docker)

If you're deploying with docker compose, you'll need to set up Let's Encrypt. You can do that by setting the following fields in the `.env` file:

- `DOMAINS` - a domain that you want to use for the app. For example, `DOMAINS="example.com"`
- `CERTBOT_EMAILS` - an email address that will be used for Let's Encrypt notifications. For example, `CERTBOT_EMAILS="example@example.com"`

## Running tests

Create a `.env.test` file and populate it with the same values as `.env` file.

Then run:

```sh
cargo test
```