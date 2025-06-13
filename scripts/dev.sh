#!/bin/bash
# Remove set -e to prevent immediate exit on errors
# set -e

echo "Starting Firestore emulator..."
npm run emulator &
EMULATOR_PID=$!

# Ensure emulator is stopped on exit
trap "echo 'Cleaning up...'; kill $EMULATOR_PID" EXIT

echo "Waiting for Firestore emulator to be ready..."
# Wait for the emulator to be ready by checking the port
for i in {1..30}; do
    if curl -s http://localhost:8080 > /dev/null; then
        echo "Emulator is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Failed to connect to Firestore emulator after 30 seconds"
        exit 1
    fi
    echo "Waiting for emulator... ($i/30)"
    sleep 1
done

echo "Sleeping for 2 seconds to ensure emulator is fully ready..."
sleep 2

echo "Importing Firestore data..."
npm run import-data || {
    echo "Failed to import data"
    exit 1
}

echo "Starting Next.js dev server..."
npx next dev
