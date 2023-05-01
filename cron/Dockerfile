FROM alpine:3.16

RUN apk update && \
    apk add --no-cache docker-cli docker-cli-compose

COPY renew_certs.sh /etc/periodic/daily/renew_certs
COPY ../docker-compose.yml /workdir/docker-compose.yml
COPY ../.env /workdir/.env

RUN chmod +x /etc/periodic/daily/renew_certs

WORKDIR /workdir

CMD ["crond", "-f", "-l", "0"]
