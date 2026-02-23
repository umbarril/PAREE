package main

import (
	"bytes"
	"compress/gzip"
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, User-Agent, Accept-Encoding")

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

func director(req *http.Request) {
	if cookie, err := req.Cookie("session_token"); err == nil {
		req.Header.Set("Authorization", "Bearer "+cookie.Value)
	}

	target, _ := url.Parse("https://api.ufpb.br")

	if strings.HasPrefix(req.URL.Path, "/auth-server/") {
		req.Header.Set("Authorization", "Basic c2lnYWEtZGlzY2VudGUtbW9iaWxlOjZkMDYyODBkMTc5MzY3ZjhmM2I3ZjhmYmJjNmJmOTgx")
		target, _ = url.Parse("https://sistemas.ufpb.br")

	} else if strings.HasPrefix(req.URL.Path, "/shared/") {
		target, _ = url.Parse("https://sigaa.ufpb.br")

	} else if strings.HasPrefix(req.URL.Path, "/arquivos/") {
		target, _ = url.Parse("https://sig-arq.ufpb.br")
	}

	// Redireciona a requisição para o host do target
	req.Host = target.Host
	req.Header.Set("User-Agent", "Dart/2.10 (dart:io)") // se passando pelo aplicativo mobile
	req.Header.Set("Accept-Encoding", "gzip")

	rewriteRequestURL(req, target)
}

func modifyResponse(resp *http.Response) error {
	if !strings.HasPrefix(resp.Request.URL.Path, "/auth-server/") || resp.StatusCode != http.StatusOK {
		return nil
	}
	// Se a resposta for do endpoint de autenticação, extraímos o token e o colocamos em um cookie.
	// Isso está sendo feito pois o backend do sigaa não pede o cookie httpOnly.
	// E isso é importante para segurança, para evitar que scripts maliciosos possam acessar o token de autenticação.

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	// Se a resposta estiver gzipada, precisamos descompactá-la antes de ler o JSON.
	var reader io.ReadCloser
	isGzipped := resp.Header.Get("Content-Encoding") == "gzip"

	if isGzipped {
		reader, err = gzip.NewReader(resp.Body)
		if err != nil {
			return err
		}
		defer reader.Close()
	} else {
		reader = resp.Body
	}

	body, err = io.ReadAll(reader)
	if err != nil {
		return err
	}

	// Agora que temos o corpo da resposta (descompactado se necessário), podemos ler o JSON e extrair o token.
	var data map[string]any
	if err := json.Unmarshal(body, &data); err != nil {
		return err
	}

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
	} else {
		return errors.New("access_token not found in response")
	}

	newJson, _ := json.Marshal(data)

	// Compactando novamente
	if isGzipped {
		var buf bytes.Buffer
		gz := gzip.NewWriter(&buf)
		if _, err := gz.Write(newJson); err != nil {
			return err
		}
		gz.Close() // Must close to flush the bits!

		resp.Body = io.NopCloser(&buf)
		resp.Header.Set("Content-Length", strconv.Itoa(buf.Len()))
	} else {
		resp.Body = io.NopCloser(bytes.NewBuffer(newJson))
		resp.Header.Set("Content-Length", strconv.Itoa(len(newJson)))
	}

	return nil
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
