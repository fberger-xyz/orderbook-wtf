# FROM rust:slim
# RUN cargo install cargo-watch
# WORKDIR /app
# COPY . .
# RUN cargo build --bin stream
# CMD ["cargo", "watch", "-x", "run --bin stream"]

FROM rust:slim
RUN apt-get update && apt-get install -y libssl-dev pkg-config
RUN cargo install cargo-watch
WORKDIR /app
COPY . .
RUN cargo build --bin stream
CMD ["cargo", "watch", "-w", "/src", "-x", "run --bin stream"]