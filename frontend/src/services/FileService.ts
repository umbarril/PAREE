// TODO: nada daqui funciona ainda.

import api from "./Axios";

// verArquivo
export async function searchFile(url: string): Promise<number[]> {
    const response = await api.get(url, {});

    return response.data;
}

// sig-arq
export async function fetchFile(url: string): Promise<number[]> {
    const response = await api.get(url, {});
    return response.data;
}
