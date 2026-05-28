// Cấu hình URL mặc định
// Vì bạn đang chạy Docker backend trên cổng 8080 và test bằng điện thoại thật, cần dùng IP LAN của máy tính:
export const BASE_URL = 'http://192.168.1.5:8080/api'; 
// (Nếu dùng máy ảo Android thì đổi thành http://10.0.2.2:8080/api)

const API_URL = BASE_URL;

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Có lỗi xảy ra khi gọi API');
      }

      return data as T;
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiClient();
