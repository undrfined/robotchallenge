FROM rust:1.64.0 as build

WORKDIR /usr/src/backend
COPY . .
RUN cargo install --path .
RUN cargo build --release

FROM alpine
COPY --from=build /usr/src/backend/target/release ./backend

EXPOSE 8080
RUN chmod +x ./backend/backend
ENTRYPOINT [ "./backend/backend","$@"]
