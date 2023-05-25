FROM rust:1.65.0

WORKDIR /usr/src/backend
COPY . .
RUN cargo install --path .
RUN cargo build --release

WORKDIR /usr/src/backend/target/release

EXPOSE 8080
RUN chmod +x ./backend
ENTRYPOINT [ "./backend","$@"]
