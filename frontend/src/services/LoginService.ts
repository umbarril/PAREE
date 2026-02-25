import type { AxiosResponse } from "axios";
import type { AuthResponse } from "../types/AuthResponse";
import api from "./Axios";

export const fetchAuthData = async (username: string, password: string): Promise<AxiosResponse<AuthResponse>> => {
    const bodyParams = new URLSearchParams({
      grant_type: "password",
      username: username,
      password: password,
    });

    return api.post(`/auth-server/oauth/token`, bodyParams, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            Accept: "application/json",
        },
    });
}

// todo: por enquanto ele ignora o método http, mas no futuro pode ser necessário usar um método específico para logout
export const fetchLogout = async (): Promise<AxiosResponse<void>> => api.post(`/auth/logout`, {}, {});

// todo: por enquanto ele ignora o método http, mas no futuro pode ser necessário usar um método específico para fetchMe
export const fetchMe = async (): Promise<AxiosResponse<AuthResponse>> => api.get(`/auth/me`, {});
