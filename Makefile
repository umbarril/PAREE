APP_NAME=paree-proxy
FLAGS=-ldflags="-H windowsgui"

.PHONY: build clean dev

build:
	cd frontend && npm run build
	go build $(FLAGS) -o $(APP_NAME) ..

clean:
	rm -f $(APP_NAME)
	rm -rf frontend/dist
