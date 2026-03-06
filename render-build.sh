set -o errexit

npm ci --include=dev
npx prisma generate
npm run build
npx prisma migrate deploy