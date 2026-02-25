import { Button, CircularProgress, Box, Typography } from "@mui/material";
import Base from "../components/Base";
import { fetchEnrollmentCertificate, fetchOfficialTranscript } from "../services/DocumentsService";
import { useAuthStore } from "../store/AuthStore";
import { useState } from "react";

export function Documents() {
    const user = useAuthStore((store) => store.user);
    const [loadingCert, setLoadingCert] = useState(false);
    const [loadingHist, setLoadingHist] = useState(false);

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    const handleDownloadCert = async () => {
        if (!user) return;
        try {
            setLoadingCert(true);
            const blob = await fetchEnrollmentCertificate(user.matricula);
            downloadBlob(blob, `certificado_matricula_${user.matricula}.pdf`);
        } catch (err) {
            console.error(err);
            alert('Falha ao baixar o certificado.');
        } finally {
            setLoadingCert(false);
        }
    }

    const handleDownloadHist = async () => {
        if (!user) return;
        try {
            setLoadingHist(true);
            const blob = await fetchOfficialTranscript(user.matricula);
            downloadBlob(blob, `historico_oficial_${user.matricula}.pdf`);
        } catch (err) {
            console.error(err);
            alert('Falha ao baixar o histórico.');
        } finally {
            setLoadingHist(false);
        }
    }

    return (
        <Base>
            <Box className="p-6 max-w-3xl mx-auto">
                <Typography variant="h5" sx={{ mb: 2 }}>Documentos</Typography>

                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Button variant="contained" color="primary" onClick={handleDownloadCert} disabled={loadingCert} startIcon={loadingCert ? <CircularProgress size={18} color="inherit" /> : undefined}>
                        {loadingCert ? 'Baixando...' : 'Download Certificado de Matrícula'}
                    </Button>

                    <Button variant="contained" color="secondary" onClick={handleDownloadHist} disabled={loadingHist} startIcon={loadingHist ? <CircularProgress size={18} color="inherit" /> : undefined}>
                        {loadingHist ? 'Baixando...' : 'Download Histórico Oficial'}
                    </Button>
                </Box>
            </Box>
        </Base>
    );
}