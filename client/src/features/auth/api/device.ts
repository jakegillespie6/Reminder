import api from "@lib/api";
import type {
  DeviceApproveRequest,
  DevicePollRequest,
  DevicePollResponse,
  DeviceStartResponse,
} from "../types";

const AUTH_BASE = "/auth/device";

export async function deviceStart(): Promise<DeviceStartResponse> {
  const response = await api.post<DeviceStartResponse>(`${AUTH_BASE}/start/`);
  return response.data;
}

export async function devicePoll(
  payload: DevicePollRequest
): Promise<{ data: DevicePollResponse; httpStatus: number }> {
  const response = await api.post<DevicePollResponse>(`${AUTH_BASE}/poll/`, payload);
  return { data: response.data, httpStatus: response.status };
}

export async function deviceApprove(payload: DeviceApproveRequest) {
  const response = await api.post(`${AUTH_BASE}/approve/`, payload);
  return response.data;
}