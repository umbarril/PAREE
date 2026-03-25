APP_NAME=paree-proxy
FLAGS=-ldflags="-H windowsgui"

.PHONY: build clean dev

build:
	cd frontend && npm run build
	go build $(FLAGS) -o $(APP_NAME) ..

# precisa de concurrently instalado globalmente: npm install -g concurrently
run:
	concurrently "cd frontend && npm run dev -- --host" "go run ."

clean:
	rm -f $(APP_NAME)
	rm -rf frontend/dist
