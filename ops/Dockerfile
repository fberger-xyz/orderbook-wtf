# ops/Dockerfile
FROM rust:latest
WORKDIR /app
# Copy the entire project into the container
COPY . .
ARG PROGRAM
ENV PROGRAM=$PROGRAM
# Install cargo-watch for live-reloading
RUN cargo install cargo-watch
# Expose the API port (if running the API)
EXPOSE 3000
# Use cargo-watch to re-run the chosen binary on code changes.
CMD ["sh", "-c", "cargo watch -x \"run --bin ${PROGRAM}\""]