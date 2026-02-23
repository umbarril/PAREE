package main

import (
	"embed"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

//go:embed frontend/dist/*
var embeddedFiles embed.FS

// todo: adicionar a função do tray icon aqui
func main() {
	const port = ":8085"

	// O diretor é a função que o ReverseProxy chama para modificar a requisição antes de enviá-la ao servidor de destino.
	director := func(req *http.Request) {
		target, _ := url.Parse("https://api.ufpb.br")

		if strings.HasPrefix(req.URL.Path, "/auth-server/") {
			target, _ = url.Parse("https://sistemas.ufpb.br")

		} else if strings.HasPrefix(req.URL.Path, "/shared/") {
			target, _ = url.Parse("https://sigaa.ufpb.br")

		} else if strings.HasPrefix(req.URL.Path, "/arquivos/") {
			target, _ = url.Parse("https://sig-arq.ufpb.br")
		}

		// Redireciona a requisição para o host do target
		req.Host = target.Host
		rewriteRequestURL(req, target)
	}
	modifyResponse := func(r *http.Response) error {
		r.Header.Del("Access-Control-Allow-Origin")
		return nil
	}
	proxy := httputil.ReverseProxy{Director: director, ModifyResponse: modifyResponse}

	//// Aqui nós alteramos a resposta do servidor de destino antes de enviá-la de volta para o cliente.
	//// Em especial, estamos removendo o header "Access-Control-Allow-Origin" para evitar problemas de CORS no frontend.
	mux := http.NewServeMux()

	// auth
	mux.HandleFunc("/auth-server/", proxy.ServeHTTP)
	// arquivos
	mux.HandleFunc("/arquivos/", proxy.ServeHTTP)
	mux.HandleFunc("/shared/", proxy.ServeHTTP)
	// api
	mux.HandleFunc("/api/", proxy.ServeHTTP)
	mux.HandleFunc("/sigaa/", proxy.ServeHTTP) // todo: talvez alterar isso para paree ou algo mais genérico, para não ficar tão amarrado ao sigaa

	wrappedMux := corsMiddleware(mux)

	println("Server started at http://localhost" + port)

	http.ListenAndServe(port, wrappedMux)
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		// Handle "Preflight" OPTIONS requests
		// If the browser asks "Can I send a request?", we say "Yes" immediately.
		// We do NOT pass this to the proxy/mux.
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// If it's not an OPTIONS request, pass it to the Mux (Proxy or FileServer)
		next.ServeHTTP(w, r)
	})
}

// ==== COPIADO DE httputil.ReverseProxy (temporário) ====
func rewriteRequestURL(req *http.Request, target *url.URL) {
	targetQuery := target.RawQuery
	req.URL.Scheme = target.Scheme
	req.URL.Host = target.Host
	req.URL.Path, req.URL.RawPath = joinURLPath(target, req.URL)
	if targetQuery == "" || req.URL.RawQuery == "" {
		req.URL.RawQuery = targetQuery + req.URL.RawQuery
	} else {
		req.URL.RawQuery = targetQuery + "&" + req.URL.RawQuery
	}
}

func joinURLPath(a, b *url.URL) (path, rawpath string) {
	if a.RawPath == "" && b.RawPath == "" {
		return singleJoiningSlash(a.Path, b.Path), ""
	}
	// Same as singleJoiningSlash, but uses EscapedPath to determine
	// whether a slash should be added
	apath := a.EscapedPath()
	bpath := b.EscapedPath()

	aslash := strings.HasSuffix(apath, "/")
	bslash := strings.HasPrefix(bpath, "/")

	switch {
	case aslash && bslash:
		return a.Path + b.Path[1:], apath + bpath[1:]
	case !aslash && !bslash:
		return a.Path + "/" + b.Path, apath + "/" + bpath
	}
	return a.Path + b.Path, apath + bpath
}

func singleJoiningSlash(a, b string) string {
	aslash := strings.HasSuffix(a, "/")
	bslash := strings.HasPrefix(b, "/")
	switch {
	case aslash && bslash:
		return a + b[1:]
	case !aslash && !bslash:
		return a + "/" + b
	}
	return a + b
}
