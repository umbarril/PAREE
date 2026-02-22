import api from "./Axios";

// todo
export async function fetchBorrowedBooks(matricula: string): Promise<string> {
    const response = await api.get(`/biblioteca/${matricula}/emprestimos`);
    
    return response.data;
}

