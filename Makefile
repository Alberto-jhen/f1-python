PYTHON = python3

.PHONY: help frontend backend db-up db-down clean-cache

help:
	@echo "Comandos disponibles:"
	@echo "  make frontend    - Levanta el servidor de desarrollo de React"
	@echo "  make backend     - Levanta el servidor local de FastAPI"
	@echo "  make clean-cache - Borra la caché de FastF1 (.pkl y .sqlite)"

frontend:
	npm run dev --prefix f1_project/frontend/f1-stats

backend:
	cd f1_project/backend && uvicorn main:app --reload --port 8000

clean-cache:
	@echo "Limpiando archivos de caché de FastF1..."
	find . -type f -name "*.pkl" -delete
	find . -type f -name "*.sqlite" -delete
	@echo "Caché limpia."