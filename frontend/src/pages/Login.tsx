import { useEffect, useState, type ChangeEvent, type FormEvent, type JSX } from "react";
import { useNavigate, Link as RouterLink } from "react-router";
import { Box, Container, TextField, Button, Typography, Paper, Alert, CircularProgress } from "@mui/material";
import axios from "axios";
import { fetchAuthData } from "../services/LoginService";
import { authResponseToUser, useAuthStore } from "../store/AuthStore";

export default function LoginPortal(): JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState<boolean>(false);
  const [usernameHelper, setUsernameHelper] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<boolean>(false);
  const [passwordHelper, setPasswordHelper] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!username) {
      const msg = "Por favor, insira um nome de usuário válido.";
      setError(null);
      setUsernameError(true);
      setUsernameHelper(msg);
      return;
    }
    if (!password) {
      const msg = "Por favor, insira uma senha válida.";
      setError(null);
      setPasswordError(true);
      setPasswordHelper(msg);
      return;
    }
    setLoading(true);
    try {
      const response = await fetchAuthData(username, password);
      login(authResponseToUser(response.data));
      navigate("/");
    } catch (err) {
      // Tratamento específico para erros HTTP do axios e erros de rede
      if (axios.isAxiosError(err)) {
        // sem resposta do servidor -> erro de rede
        if (!err.response) {
          setError("Erro de rede. Não foi possível conectar aos servidores. Verifique sua conexão e tente novamente.");
          setUsernameError(false);
          setPasswordError(false);
        } else {
          const status = err.response.status;
          if (status === 400) {
            // erro de credenciais: limpar campos e mostrar apenas nos helpers dos campos
            setUsername("");
            setPassword("");
            setUsernameError(true);
            setPasswordError(true);
            setError("Credenciais incorretas.");
          } else if (status === 503) {
            setError("Incapaz de acessar os servidores do SIGAA. Tente novamente mais tarde.");
            setUsernameError(false);
            setPasswordError(false);
          } else {
            setError(err.response.data?.message ?? err.message ?? "Erro desconhecido");
          }
        }
      } else if (err instanceof Error && err.message === "Network Error") {
        // Caso raro quando não for um axios error mas message indica problema de rede
        setError("Erro de rede. Não foi possível conectar aos servidores. Verifique sua conexão e tente novamente.");
        setUsernameError(false);
        setPasswordError(false);
      } else {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        background: 'linear-gradient(180deg, #f3f4f6 0%, #e6e9ef 100%)'
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper elevation={3} sx={{ width: '100%', p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box component="img" src="/logo.png" alt="PAREE logo" loading="lazy" sx={{ width: { xs: 64, sm: 72, md: 96 }, height: { xs: 64, sm: 72, md: 72 }, objectFit: 'contain' }} />
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h4" component="h1" color="error.main" fontWeight={700}>
              PAREE
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>
              Portal do Discente
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block">
              Conceito de interface para o SIGAA
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'grid', gap: 2 }}>
          <TextField
            id="username"
            label="Nome de Usuário"
            value={username}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setUsername(e.target.value); setUsernameError(false); setUsernameHelper(null); setError(null); }}
            fullWidth
            autoComplete="username"
            error={usernameError}
            helperText={usernameError ? usernameHelper : undefined}
          />

          <TextField
            id="password"
            label="Senha"
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setPassword(e.target.value); setPasswordError(false); setPasswordHelper(null); setError(null); }}
            fullWidth
            autoComplete="current-password"
            error={passwordError}
            helperText={passwordError ? passwordHelper : undefined}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="text" component={RouterLink} to="/about">Sobre</Button>
            <Button
              variant="text"
              component="a"
              href="https://sigaa.ufpb.br/sigaa/public/cadastro/cadastro.jsf"
            >
              Esqueceu a senha?
            </Button>
          </Box>

          <Button type="submit" variant="contained" color="primary" disabled={loading} fullWidth sx={{ py: 1.5 }}>
            {loading ? <><CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> Autenticando...</> : 'ENTRAR NO PORTAL'}
          </Button>
        </Box>
        </Paper>
      </Container>
    </Box>
  );
}

