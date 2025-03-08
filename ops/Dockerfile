FROM rust:slim
RUN cargo install cargo-watch
WORKDIR /app
COPY . .
RUN cargo build --bin stream
CMD ["cargo", "watch", "-x", "run"]