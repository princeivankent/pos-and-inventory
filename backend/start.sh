#!/bin/sh
set -e

echo "Running database migrations..."
npx typeorm migration:run -d dist/config/database.config.js

echo "Starting server..."
exec node dist/main
