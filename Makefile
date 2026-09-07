.PHONY: help install dev build start prod docker compose test lint clean py-install py

# Default target
help:
	@echo "Automated Document Digitizer - Available Targets"
	@echo "  make install       Install npm dependencies"
	@echo "  make dev           Start development server on port 3000"
	@echo "  make build         Compile client and bundle server"
	@echo "  make start         Run production server"
	@echo "  make docker-build  Build Docker image"
	@echo "  make docker-run    Run Docker container on port 3000"
	@echo "  make compose-up    Start with Docker Compose"
	@echo "  make compose-down  Stop Docker Compose services"
	@echo "  make py-install    Install Python dependencies from requirements.txt"
	@echo "  make py            Run Python digitizer CLI (usage: make py FILE=invoice.jpg)"
	@echo "  make lint          Validate TypeScript types"
	@echo "  make clean         Remove build artifacts"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm start

prod: build
	npm start

docker-build:
	docker build -t document-digitizer:latest .

docker-run:
	docker run --rm -it -p 3000:3000 --env-file .env document-digitizer:latest

compose-up:
	docker compose up --build

compose-down:
	docker compose down

py-install:
	pip install -r requirements.txt

py:
	python3 digitizer.py $(FILE)

lint:
	npm run lint

clean:
	rm -rf dist build node_modules/.vite __pycache__ .pytest_cache
