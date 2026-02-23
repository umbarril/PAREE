import axios from "axios";
import type { AuthResponse } from "../types/AuthResponse";

export const fetchAuthData = async (username: string, password: string): Promise<AuthResponse> => {
    // Prepare URL-encoded body
    const bodyParams = new URLSearchParams({
      grant_type: "password",
      username: username,
      password: password,
    });

    const authUrl = import.meta.env.VITE_API_URL || "http://localhost:8085";
    const response = await axios.post(`${authUrl}/auth-server/oauth/token`, bodyParams, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            Accept: "application/json",
        },
    });

    const data: AuthResponse = response.data;
    return data;
}