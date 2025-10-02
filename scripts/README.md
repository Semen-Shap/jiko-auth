
# Database Scripts

## PostgreSQL Connection
```bash
# Direct connection
psql -h localhost -p 5432 -U admin -d obsidian
# Connection via URL
psql "postgresql://admin:admin@localhost:5432/assetdb"
# Query users table
psql "postgresql://admin:admin@localhost:5432/assetdb" -c "SELECT * FROM authorization_codes;"
```


## Database Management
```bash
# Reset database (drop all tables)
npm run db:reset

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Run drizzle studio
npm run db:studio
```

## Deploy commands
```bash
docker-compose down & git pull origin main & docker-compose up --build -d
```

## Run dev
```bash
# Run Docker Postres
docker-compose -f docker-compose.dev.yml up --build postgres
```