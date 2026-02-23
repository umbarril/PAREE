import type { AuthResponse } from "../types/AuthResponse";

export const fetchAuthData = async (username: string, password: string): Promise<AuthResponse> => {
    // Prepare URL-encoded body
    const bodyParams = new URLSearchParams({
      grant_type: "password",
      username: username,
      password: password,
    });

    const authUrl = import.meta.env.VITE_API_URL || "http://localhost:8085";
    const response = await fetch(`${authUrl}/auth-server/oauth/token`, {
        method: "POST",
        headers: {
            Authorization:
            "Basic c2lnYWEtZGlzY2VudGUtbW9iaWxlOjZkMDYyODBkMTc5MzY3ZjhmM2I3ZjhmYmJjNmJmOTgx",
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
            Accept: "application/json",
        },
        body: bodyParams.toString(),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Auth failed with status: ${response.status}. ${text}`);
    }

    const data: AuthResponse = await response.json();
    return data;
}