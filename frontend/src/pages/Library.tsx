import { useMemo, type JSX } from "react";
import Base from "../components/Base";
import { fetchBorrowedBooks } from "../services/LibraryService";
import { useAuthStore } from "../store/AuthStore";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    CircularProgress,
    Divider,
    Skeleton,
    Stack,
    Typography,
} from "@mui/material";

function normalizeIsbn(value: string): string | null {
    const digits = value.replace(/[^0-9Xx]/g, "").toUpperCase();
    if (digits.length === 10 || digits.length === 13) {
        return digits;
    }
    return null;
}

function parseApiDate(value: string): string {
    if (!value) return "Não informado";

    const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) {
        const [, dd, mm, yyyy] = ddmmyyyy;
        return `${dd}/${mm}/${yyyy}`;
    }

    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
        return asDate.toLocaleDateString("pt-BR");
    }

    return value;
}

function buildCoverUrlFromOpenLibrary(isbn: string): string {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
}

function BookCover({ src, title }: { src: string | null; title: string }): JSX.Element {
    if (!src) {
        return (
            <Box
                sx={{
                    width: 84,
                    height: 124,
                    borderRadius: 1,
                    backgroundColor: "grey.200",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 1,
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    Capa indisponível
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            component="img"
            src={src}
            alt={`Capa de ${title}`}
            loading="lazy"
            sx={{
                width: 84,
                height: 124,
                borderRadius: 1,
                objectFit: "cover",
                backgroundColor: "grey.100",
            }}
            onError={(event) => {
                const img = event.currentTarget;
                img.style.display = "none";
            }}
        />
    );
}

export default function Library(): JSX.Element {
    const user = useAuthStore((state) => state.user);

    const {
        data: borrowedBooks,
        error,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ["borrowedBooks", user?.matricula],
        queryFn: fetchBorrowedBooks,
        enabled: Boolean(user?.matricula),
        staleTime: 1000 * 60,
    });

    const coverQueries = useQueries({
        queries:
            borrowedBooks?.map((book) => {
                const isbn = normalizeIsbn(book.codigoBarras);
                return {
                    queryKey: ["bookCover", isbn],
                    enabled: Boolean(isbn),
                    queryFn: async () => {
                        if (!isbn) return null;
                        const url = buildCoverUrlFromOpenLibrary(isbn);
                        const response = await fetch(url, { method: "HEAD" });
                        return response.ok ? url : null;
                    },
                    staleTime: 1000 * 60 * 60 * 24,
                    retry: 1,
                };
            }) ?? [],
    });

    const coverMap = useMemo(() => {
        const map = new Map<number, string | null>();

        if (!borrowedBooks) return map;

        borrowedBooks.forEach((book, index) => {
            map.set(book.id, coverQueries[index]?.data ?? null);
        });

        return map;
    }, [borrowedBooks, coverQueries]);

    const hasCoverLoading = coverQueries.some((query) => query.isLoading);

    return (
        <Base>
            <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: "auto" }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Biblioteca
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Acompanhe os livros atualmente emprestados para sua matrícula.
                    </Typography>
                </Box>

                {!user?.matricula && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Não foi possível identificar sua matrícula para buscar os empréstimos.
                    </Alert>
                )}

                {isLoading && (
                    <Stack spacing={2}>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Card key={index} variant="outlined">
                                <CardHeader
                                    title={<Skeleton variant="text" width="55%" />}
                                    subheader={<Skeleton variant="text" width="35%" />}
                                />
                                <Divider />
                                <CardContent>
                                    <Stack direction="row" spacing={2}>
                                        <Skeleton variant="rounded" width={84} height={124} />
                                        <Box sx={{ width: "100%" }}>
                                            <Skeleton variant="text" width="80%" />
                                            <Skeleton variant="text" width="70%" />
                                            <Skeleton variant="text" width="60%" />
                                            <Skeleton variant="text" width="50%" />
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}

                {!isLoading && error && (
                    <Alert
                        severity="error"
                        action={
                            <Button color="inherit" size="small" onClick={() => refetch()}>
                                Tentar novamente
                            </Button>
                        }
                        sx={{ mb: 2 }}
                    >
                        Ocorreu um erro ao carregar seus empréstimos da biblioteca.
                    </Alert>
                )}

                {!isLoading && !error && borrowedBooks?.length === 0 && (
                    <Alert severity="info">Você não tem livros emrpestados!</Alert>
                )}

                {!isLoading && !error && borrowedBooks && borrowedBooks.length > 0 && (
                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {borrowedBooks.length} livro(s) emprestado(s)
                            </Typography>
                            {(isFetching || hasCoverLoading) && <CircularProgress size={16} />}
                        </Box>

                        {borrowedBooks.map((book) => (
                            <Card key={book.id} variant="outlined">
                                <CardHeader
                                    title={book.titulo}
                                    subheader={`Biblioteca: ${book.biblioteca}`}
                                    action={
                                        <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                                            <Chip
                                                label={book.atrasado ? "Atrasado" : "No prazo"}
                                                color={book.atrasado ? "error" : "success"}
                                                size="small"
                                            />
                                            <Chip
                                                label={book.podeRenovar ? "Renovável" : "Sem renovação"}
                                                color={book.podeRenovar ? "primary" : "default"}
                                                size="small"
                                                variant={book.podeRenovar ? "filled" : "outlined"}
                                            />
                                        </Stack>
                                    }
                                />

                                <Divider />

                                <CardContent>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                    >
                                        <BookCover src={coverMap.get(book.id) ?? null} title={book.titulo} />

                                        <Stack spacing={0.75} sx={{ width: "100%" }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Código de barras:</strong> {book.codigoBarras}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Data do empréstimo:</strong> {parseApiDate(book.dataEmprestimo)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Prazo de devolução:</strong> {parseApiDate(book.prazo)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Ano:</strong> {book.ano}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>Tipo de empréstimo:</strong> #{book.idTipoEmprestimo}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                <strong>ID interno:</strong> {book.id}
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>
        </Base>
    );
}