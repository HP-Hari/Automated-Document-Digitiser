#!/usr/bin/env bash
# ==============================================================================
# Automated Document Digitizer - Universal Run Script
# Usage:
#   ./run.sh [dev | build | start | docker | compose | lint | clean | help]
# ==============================================================================

set -e

# Change to script root directory
cd "$(dirname "$0")"

MODE="${1:-dev}"

print_header() {
  echo ""
  echo "=========================================================="
  echo "  Automated Document Digitizer - Runner ($MODE)"
  echo "=========================================================="
  echo ""
}

ensure_env_file() {
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      echo "ℹ️  No .env file found. Creating .env from .env.example..."
      cp .env.example .env
      echo "✅ Created .env. Please configure GEMINI_API_KEY if available."
    fi
  fi
}

check_node() {
  if ! command -v node >/dev/null 2>&1; then
    echo "❌ Error: Node.js is required but not installed."
    echo "   Please install Node.js 18+ from https://nodejs.org"
    exit 1
  fi
}

check_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Error: Docker is required but not installed."
    echo "   Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
  fi
}

case "$MODE" in
  dev)
    print_header
    check_node
    ensure_env_file
    if [ ! -d "node_modules" ]; then
      echo "📦 Installing npm dependencies..."
      npm install
    fi
    echo "🚀 Starting development server on http://localhost:3000..."
    npm run dev
    ;;

  build)
    print_header
    check_node
    ensure_env_file
    echo "🔨 Building frontend and backend bundles..."
    npm run build
    echo "✅ Build complete! Artifacts located in ./dist"
    ;;

  start|prod)
    print_header
    check_node
    ensure_env_file
    if [ ! -f "dist/server.cjs" ]; then
      echo "🔨 No production build found. Building first..."
      npm run build
    fi
    echo "🚀 Launching production server on http://localhost:3000..."
    NODE_ENV=production npm start
    ;;

  docker)
    print_header
    check_docker
    ensure_env_file
    echo "🐳 Building Docker image 'document-digitizer:latest'..."
    docker build -t document-digitizer:latest .
    echo "🚀 Running Docker container on port 3000..."
    docker run --rm -it -p 3000:3000 --env-file .env --name document-digitizer-instance document-digitizer:latest
    ;;

  compose|docker-compose)
    print_header
    check_docker
    ensure_env_file
    echo "🐳 Starting multi-container application with Docker Compose..."
    if command -v docker compose >/dev/null 2>&1; then
      docker compose up --build
    else
      docker-compose up --build
    fi
    ;;

  lint)
    print_header
    check_node
    echo "🔍 Running TypeScript type validation and linting..."
    npm run lint
    echo "✅ Lint check passed with zero errors!"
    ;;

  py|python)
    print_header
    shift
    ensure_env_file
    if ! command -v python3 >/dev/null 2>&1; then
      echo "❌ Error: Python 3 is required but not installed."
      exit 1
    fi
    python3 digitizer.py "$@"
    ;;

  py-install)
    print_header
    if ! command -v pip3 >/dev/null 2>&1 && ! command -v pip >/dev/null 2>&1; then
      echo "❌ Error: pip is required but not installed."
      exit 1
    fi
    PIP_CMD=$(command -v pip3 || command -v pip)
    echo "📦 Installing Python requirements from requirements.txt..."
    $PIP_CMD install -r requirements.txt
    echo "✅ Python dependencies installed."
    ;;

  clean)
    print_header
    echo "🧹 Cleaning build outputs and cache..."
    rm -rf dist build node_modules/.vite __pycache__ .pytest_cache
    echo "✅ Workspace clean."
    ;;

  help|--help|-h)
    echo "Automated Document Digitizer - Command Guide"
    echo ""
    echo "Commands:"
    echo "  ./run.sh dev         Start local live development server (default)"
    echo "  ./run.sh build       Compile frontend and backend production bundles"
    echo "  ./run.sh start       Run the compiled production server"
    echo "  ./run.sh docker      Build and run in a single Docker container"
    echo "  ./run.sh compose     Build and run with Docker Compose"
    echo "  ./run.sh py <file>   Extract document using Python CLI (digitizer.py)"
    echo "  ./run.sh py-install  Install Python dependencies from requirements.txt"
    echo "  ./run.sh lint        Verify TypeScript types and codebase health"
    echo "  ./run.sh clean       Remove compiled artifacts and caches"
    echo "  ./run.sh help        Display this help message"
    echo ""
    ;;

  *)
    echo "Unknown command: $MODE"
    echo "Run './run.sh help' for available commands."
    exit 1
    ;;
esac
