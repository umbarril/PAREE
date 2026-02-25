package main

import (
	"bytes"
	"compress/gzip"
	"embed"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strconv"
	"strings"
	"time"
)

//go:embed frontend/dist/*
var embeddedFiles embed.FS

// todo: adicionar a função do tray icon aqui
func main() {
	const port = ":8085"

	// O diretor é a função que o ReverseProxy chama para modificar a requisição antes de enviá-la ao servidor de destino.
	// talvez separar esse reverse proxy em 2+ para não ficar tão emaranhado
	proxy := httputil.ReverseProxy{Director: director, ModifyResponse: modifyResponse}

	//// Aqui nós alteramos a resposta do servidor de destino antes de enviá-la de volta para o cliente.
	mux := http.NewServeMux()

	// auth
	mux.HandleFunc("/auth-server/oauth/token", proxy.ServeHTTP)
	mux.HandleFunc("/auth/refresh", refreshAccessToken)
	mux.HandleFunc("/auth/logout", logout)
	// todo: ver pq isso esetá sendo chamado duas vezes seguidas (pelo log pelo menos aparece duas vezes)
	mux.HandleFunc("/auth/me", func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("access_token")
		if err != nil {
			fmt.Println(err.Error())
			http.Error(w, "Unauthorized", 401)
			return
		}

		// Since the cookie is a JWT, you can decode the payload
		// to get the 'nome' or 'id' without calling SIGAA.
		userData := decodeJwtPayload(cookie.Value)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(userData)
	})

	// arquivos (não precisa do token)
	mux.HandleFunc("/arquivos/", proxy.ServeHTTP)
	mux.HandleFunc("/shared/", proxy.ServeHTTP)

	// api (precisa do token)
	mux.HandleFunc("/api/", proxy.ServeHTTP)
	mux.HandleFunc("/sigaa/mobile/", proxy.ServeHTTP) // todo: talvez alterar isso para paree ou algo mais genérico, para não ficar tão amarrado ao sigaa

	wrappedMux := corsMiddleware(mux)

	println("Server started at http://localhost" + port)

	http.ListenAndServe(port, wrappedMux)
}

func logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:   "access_token",
		Value:  "",
		Path:   "/",
		MaxAge: -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Path:     "/auth-server/refresh",
		MaxAge:   -1,
		HttpOnly: true,
	})

	// Do the same for refresh_token
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"message": "Logged out successfully"}`)
}

func refreshAccessToken(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		fmt.Println("Refresh token not found:", err.Error())
		http.Error(w, "Expired", 401)
		return
	}

	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", cookie.Value)
	data.Set("client_id", "sigaa-discente-mobile")

	resp, err := http.PostForm("https:/sistemas.ufpb.br/auth-server/oauth/token", data)
	defer resp.Body.Close()
	if err != nil {
		fmt.Println("Error refreshing token:", err.Error())
		http.Error(w, "SIGAA Unreachable", 500)
		return
	}

	// Parse the response body to extract new access_token
	var tokenResponse map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
		http.Error(w, "Failed to parse token response", 500)
		return
	}

	newAccessToken, ok := tokenResponse["access_token"].(string)
	if !ok {
		http.Error(w, "Failed to extract new access token", 500)
		return
	}

	// Set the new Cookie
	// todo: isso é igual ao código do ModifyResponse.. refatorar isso depois
	expiresIn, _ := tokenResponse["expires_in"].(float64)

	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    newAccessToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(expiresIn), // valido por 1 hora (3600 segundos) ou o valor retornado pelo servidor
		// por sorte, o servidor já retorno o expiresIn sem ter que calcular o exp do jwt
	})

	w.WriteHeader(http.StatusOK)
}

// corsMiddleware é um middleware que adiciona os cabeçalhos CORS necessários para permitir que o frontend (que pode estar em outro domínio) faça requisições para este servidor.
// Ele também lida com as requisições OPTIONS, respondendo imediatamente com 200 OK, sem passar para o proxy/mux.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Received request: " + r.Method + " " + r.URL.Path)

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
	if cookie, err := req.Cookie("access_token"); err == nil {
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
	// Isso está sendo feito aqui pois o backend do sigaa não pede o cookie httpOnly.
	// E isso é importante para evitar que scripts maliciosos possam acessar o token de autenticação.

	var reader io.ReadCloser
	var err error
	isGzipped := resp.Header.Get("Content-Encoding") == "gzip"

	// Se a resposta estiver gzipada, precisamos descompactá-la antes de ler o JSON.
	if isGzipped {
		reader, err = gzip.NewReader(resp.Body)
		if err != nil {
			return err
		}
		defer reader.Close()
	} else {
		reader = resp.Body
	}

	body, err := io.ReadAll(reader)
	if err != nil {
		return err
	}

	// Agora que temos o corpo da resposta (descompactado se necessário), podemos ler o JSON e extrair o token.
	var data map[string]any
	if err := json.Unmarshal(body, &data); err != nil {
		return err
	}

	if accessToken, ok := data["access_token"].(string); ok {
		expiresIn, _ := data["expires_in"].(float64)

		accessCookie := &http.Cookie{
			Name:     "access_token",
			Value:    accessToken,
			Path:     "/",
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   int(expiresIn), // valido por 1 hora (3600 segundos) ou o valor retornado pelo servidor
			// por sorte, o servidor já retorno o expiresIn sem ter que calcular o exp do jwt
		}

		var refreshCookieStr string
		if refreshToken, ok := data["refresh_token"].(string); ok {
			refreshCookie := &http.Cookie{
				Name:     "refresh_token",
				Value:    refreshToken,
				Path:     "/auth-server/refresh",
				HttpOnly: true,
				Secure:   true,
				SameSite: http.SameSiteLaxMode,
				MaxAge:   getJwtMaxAge(refreshToken), // Calcula o MaxAge com base no exp do JWT (do jeito que vi, o exp tem 30 dias)
			}
			refreshCookieStr = refreshCookie.String()
		}

		resp.Header.Add("Set-Cookie", accessCookie.String())
		if refreshCookieStr != "" {
			resp.Header.Add("Set-Cookie", refreshCookieStr)
		}

		delete(data, "access_token")
		delete(data, "token_type")
		delete(data, "refresh_token")
		delete(data, "expires_in")
		delete(data, "scope")
		delete(data, "jti")
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

func decodeJwtPayload(tokenString string) map[string]any {
	parts := strings.Split(tokenString, ".")
	if len(parts) < 2 {
		return nil
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])

	if err != nil {
		return nil
	}

	var claims map[string]any
	json.Unmarshal(payload, &claims)
	return claims
}

func getJwtMaxAge(tokenString string) int {
	parts := strings.Split(tokenString, ".")
	if len(parts) < 2 {
		return 0
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return 0
	}

	var claims struct {
		Exp int64 `json:"exp"`
	}
	json.Unmarshal(payload, &claims)

	// MaxAge = ExpirationTimestamp - CurrentTimestamp
	return int(claims.Exp - time.Now().Unix())
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
