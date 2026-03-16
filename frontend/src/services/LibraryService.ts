import type { LibraryResponse } from "../types/LibraryResponse";
import api from "./Axios";

export async function fetchBorrowedBooks(): Promise<LibraryResponse> {
    const response = await api.get(`/sigaa/mobile/biblioteca/discente/emprestimos`);
    return response.data;
}

