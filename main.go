package main

import (
	"embed"
	"io/fs"
	"net/http"
	"net/http/httputil"
	"net/url"
)

//go:embed frontend/dist/*
var embeddedFiles embed.FS

// todo: adicionar a função do tray icon aqui
func main() {
	target, _ := url.Parse("https://api.ufpb.br")
	proxy := httputil.NewSingleHostReverseProxy(target)

	proxy.ModifyResponse = func(r *http.Response) error {
		r.Header.Del("Access-Control-Allow-Origin")
		return nil
	}

	mux := http.NewServeMux()

	proxyHandler := func(w http.ResponseWriter, r *http.Request) {
		r.Host = target.Host
		proxy.ServeHTTP(w, r)
	}
	mux.HandleFunc("/api/", proxyHandler)
	mux.HandleFunc("/sigaa/", proxyHandler)

	distFolder, _ := fs.Sub(embeddedFiles, "frontend/dist")
	mux.Handle("/", http.FileServer(http.FS(distFolder)))

	wrappedMux := corsMiddleware(mux)

	port := ":8085"
	println("Server started at http://localhost" + port)

	http.ListenAndServe(port, wrappedMux)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Allow any origin (or change "*" to "http://localhost:5173" for stricter security)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		// 2. Handle "Preflight" OPTIONS requests
		// If the browser asks "Can I send a request?", we say "Yes" immediately.
		// We do NOT pass this to the proxy/mux.
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// 3. If it's not an OPTIONS request, pass it to the Mux (Proxy or FileServer)
		next.ServeHTTP(w, r)
	})
}
