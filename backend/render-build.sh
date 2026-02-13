#!/usr/bin/env bash
set -o errexit

# Install poppler-utils for pdftotext (PDF text extraction)
apt-get update && apt-get install -y poppler-utils

# Install Node dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build TypeScript to dist/
npm run build

# Create uploads directory for multer disk storage
mkdir -p uploads
