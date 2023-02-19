# RobotChallenge

## Running with Docker Compose

### 1. Clone the repository

```sh
git clone git@github.com:undrfined/robotchallenge.git --recursive
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