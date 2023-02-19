FROM rust:1.64.0

WORKDIR /usr/src/backend
COPY . .
RUN cargo install --path .
RUN cargo build --release

EXPOSE 8080
ENTRYPOINT ["cargo run --release"]
