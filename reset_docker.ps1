# 1. Stop containers
docker-compose down

# 2. Remove the database volume only (resets DB state)
# We suppress errors just in case the volume is already gone
docker volume rm genysis_mysql_data -ErrorAction SilentlyContinue

# 3. Start containers
# Enable BuildKit for advanced caching
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1
docker-compose up --build -d

# 4. Show logs
docker-compose logs -f
