import type { AxiosResponse } from "axios";
import type { VinculosResponse } from "../types/VinculosResponse";
import type { UserResponse } from "../types/UserResponse";
import api from "./Axios";

export const fetchUsuario = async (): Promise<AxiosResponse<UserResponse>> => api.get(`/api/personal/usuario`, {});

export const fetchVinculo = async (): Promise<AxiosResponse<VinculosResponse>> => api.get(`/api/personal/vinculos/ativos`, {});