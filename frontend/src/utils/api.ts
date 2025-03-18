import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept responses for unified error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.response) {
      // The server responded with a status code outside of 2xx
      const { data, status } = error.response;
      errorMessage = data?.detail || `Server error (${status})`;
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request
      errorMessage = error.message || 'Failed to send request';
    }
    
    console.error('API error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// API functions
export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

export const sendChatMessage = async (question: string, sessionId: string) => {
  try {
    const response = await apiClient.post('/chat', {
      question,
      session_id: sessionId,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
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

export default {
  uploadDocument,
  sendChatMessage,
  checkHealth,
}; 