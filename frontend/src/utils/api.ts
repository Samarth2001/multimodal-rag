import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// No longer using axios for chat, but keeping for other simple requests.
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface UploadResponse {
  session_id: string;
  status: string;
  filename: string;
  chunk_count: number;
  processing_time: number;
}

interface SessionInfo {
  session_id: string;
  filename: string;
  created_at: number;
  chunk_count: number;
  status: string;
}

// Type for the streaming data callbacks
interface StreamCallbacks {
  onToken: (token: string) => void;
  onSources: (sources: string[]) => void;
  onComplete: (processingTime: number) => void;
  onError: (error: Error) => void;
}

// API functions
export const uploadDocument = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Using fetch for consistency and to avoid multiple HTTP clients
  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
     console.error('Upload error:', error);
     throw error;
  }
};

export const sendChatMessage = async (
  question: string,
  sessionId: string,
  callbacks: StreamCallbacks
): Promise<void> => {
  const { onToken, onSources, onComplete, onError } = callbacks;
  
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        question,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep the last, possibly incomplete line

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const event = line.substring(7, line.indexOf('\n')).trim();
          const data = line.substring(line.indexOf('data: ') + 6).trim();
          
          try {
            const parsedData = JSON.parse(data);
            if (event === 'token') {
              onToken(parsedData.token);
            } else if (event === 'sources') {
              onSources(parsedData);
            } else if (event === 'end') {
              onComplete(parsedData.processing_time);
            } else if (event === 'error') {
               throw new Error(parsedData.error || 'Unknown stream error');
            }
          } catch (e) {
            console.error('Failed to parse stream data chunk:', data, e);
          }
        }
      }
    }
  } catch (err) {
    console.error('Chat stream failed:', err);
    onError(err instanceof Error ? err : new Error('An unknown error occurred during the stream.'));
  }
};

export const getSessions = async (): Promise<SessionInfo[]> => {
  const response = await apiClient.get('/sessions');
  return response.data;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await apiClient.delete(`/sessions/${sessionId}`);
};

export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy' };
  }
};

const api = {
  uploadDocument,
  sendChatMessage,
  getSessions,
  deleteSession,
  checkHealth,
};

export default api; 