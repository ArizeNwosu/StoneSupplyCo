import { apiJson } from './api';
import { API_ENDPOINTS } from '../constants/api';
import type {
  CreateLiveAssistSessionRequest,
  CreateLiveAssistSessionResponse,
  EndLiveAssistSessionRequest,
  EndLiveAssistSessionResponse,
  GetLiveAssistResponseRequest,
  GetLiveAssistResponseResponse,
  LogLiveAssistActionRequest,
  LogLiveAssistActionResponse,
} from '../types';

export async function createLiveAssistSession(
  request: CreateLiveAssistSessionRequest,
): Promise<CreateLiveAssistSessionResponse> {
  return apiJson<CreateLiveAssistSessionResponse>(API_ENDPOINTS.liveAssistSession, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getLiveAssistResponse(
  request: GetLiveAssistResponseRequest,
): Promise<GetLiveAssistResponseResponse> {
  return apiJson<GetLiveAssistResponseResponse>(API_ENDPOINTS.liveAssistRespond, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function logLiveAssistAction(
  request: LogLiveAssistActionRequest,
): Promise<LogLiveAssistActionResponse> {
  return apiJson<LogLiveAssistActionResponse>(API_ENDPOINTS.liveAssistAction, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function endLiveAssistSession(
  request: EndLiveAssistSessionRequest,
): Promise<EndLiveAssistSessionResponse> {
  return apiJson<EndLiveAssistSessionResponse>(API_ENDPOINTS.liveAssistEnd, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
