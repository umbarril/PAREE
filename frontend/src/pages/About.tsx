import type { JSX } from "react";
import { Box, Container, Paper, Typography, Link } from "@mui/material";
import { FiMail } from "react-icons/fi";

export default function About(): JSX.Element {
    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, sm: 4 }, background: 'linear-gradient(180deg, #f3f4f6 0%, #e6e9ef 100%)' }}>
            <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper elevation={3} sx={{ width: '100%', p: 4, borderRadius: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" component="h1" color="error.main" fontWeight={700}>
                            PAREE
                        </Typography>

                        <Typography variant="subtitle1" sx={{ mt: 1 }}>
                            Projeto de Trabalho de Conclusão de Curso (TCC)
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Uma interface alternativa para o Portal do Discente da UFPB, construída com React e TypeScript, utilizando dados extraídos por meio da API mobile.
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Este projeto é um TCC e não possui afiliação com a Superintendência de Tecnologia da Informação (STI) da UFPB.
                        </Typography>

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Quaisquer dúvidas, sugestões ou feedbacks são muito bem-vindos! Sinta-se à vontade para entrar em contato comigo por e-mail.
                        </Typography>

                        <Box sx={{ mt: 2 }}>
                            <Link href="mailto:joao.barros@dcx.ufpb.br" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                <FiMail /> joao.barros@dcx.ufpb.br
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}