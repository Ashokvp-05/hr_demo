#!/bin/sh

# Wait for DB to be ready
echo "Waiting for database at db:5432..."
while ! nc -z db 5432; do
  sleep 1
done
echo "Database is up!"

# Push schema to DB (no migration files needed)
echo "Running Prisma db push..."
npx prisma db push --accept-data-loss

# Start the application
echo "Starting backend..."
npm start
