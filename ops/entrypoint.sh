#!/bin/sh
set -e
echo "Running ./target/debug/${PROGRAM}"
exec ./target/debug/${PROGRAM}
# echo "Running ./target/release/${PROGRAM}"
# exec ./target/release/${PROGRAM}
