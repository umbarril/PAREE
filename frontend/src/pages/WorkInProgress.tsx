import { type JSX } from "react";
import Base from "../components/Base";
import { Box, Paper, Typography, Button } from "@mui/material";
import { BiWrench } from "react-icons/bi";
import { useNavigate } from "react-router";

export default function InProgressPage(): JSX.Element {
    const navigate = useNavigate();

    return (
        <Base>
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <Paper elevation={3} sx={{ p: 6, maxWidth: 720, width: '100%', textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <Box sx={{ bgcolor: '#f3f4f6', width: 84, height: 84, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <BiWrench size={40} color="#374151" />
                        </Box>
                    </Box>

                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>EM CONSTRUÇÃO</Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>Esta seção ainda está em desenvolvimento. Estamos preparando uma experiência melhor para você — volte em breve!</Typography>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button variant="contained" onClick={() => navigate('/')} color="primary">Voltar ao Início</Button>
                    </Box>
                </Paper>
            </Box>
        </Base>
    );
}