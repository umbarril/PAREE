package main

import (
	"bytes"
	"embed"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
)

//go:embed frontend/dist/*
var embeddedFiles embed.FS

// todo: adicionar a função do tray icon aqui
func main() {
	const port = ":8085"

	// O diretor é a função que o ReverseProxy chama para modificar a requisição antes de enviá-la ao servidor de destino.
	director := func(req *http.Request) {
		if cookie, err := req.Cookie("session_token"); err == nil {
			req.Header.Set("Authorization", "Bearer "+cookie.Value)
		}

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
	modifyResponse := func(resp *http.Response) error {
		// Se a resposta for do endpoint de autenticação, extraímos o token e o colocamos em um cookie.
		// Isso está sendo feito pois o backend do sigaa não pede o cookie httpOnly.
		// E isso é importante para segurança, para evitar que scripts maliciosos possam acessar o token de autenticação.
		if strings.HasPrefix(resp.Request.URL.Path, "/auth-server/") {
			if resp.StatusCode == http.StatusOK {
				body, err := io.ReadAll(resp.Body)
				if err != nil {
					return err
				}

				var data map[string]any
				if err := json.Unmarshal(body, &data); err == nil {
					if token, ok := data["access_token"].(string); ok {
						cookie := &http.Cookie{
							Name:     "session_token",
							Value:    token,
							Path:     "/",
							HttpOnly: true,
							Secure:   true,
							SameSite: http.SameSiteLaxMode,
						}

						resp.Header.Add("Set-Cookie", cookie.String())

						delete(data, "access_token")
						delete(data, "refresh_token")

						newBody, err := json.Marshal(data)
						if err != nil {
							return err
						}

						resp.Body = io.NopCloser(bytes.NewBuffer(newBody))
						resp.ContentLength = int64(len(newBody))
						resp.Header.Set("Content-Length", strconv.Itoa(len(newBody)))

						return nil
					} else {
						return errors.New("access_token not found in response")
					}
				} else {
					return err
				}
			}
		}
		return nil
	}
	proxy := httputil.ReverseProxy{Director: director, ModifyResponse: modifyResponse}

	//// Aqui nós alteramos a resposta do servidor de destino antes de enviá-la de volta para o cliente.
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

// corsMiddleware é um middleware que adiciona os cabeçalhos CORS necessários para permitir que o frontend (que pode estar em outro domínio) faça requisições para este servidor.
// Ele também lida com as requisições OPTIONS, respondendo imediatamente com 200 OK, sem passar para o proxy/mux.
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
// todo: arrumar um jeito de evitar copiar esse código
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
