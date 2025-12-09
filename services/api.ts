// API Service for Backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        
        // Handle authentication errors - only clear token if it's actually invalid
        // Don't clear token for 403 "Admin access required" errors (those are authorization, not authentication)
        if (response.status === 401) {
          // 401 = Unauthorized (invalid/expired token)
          const errorMessage = error.message || error.error || '';
          
          // Only clear token if it's actually an authentication issue, not just a missing setting
          if (errorMessage.includes('token') || errorMessage.includes('authentication') || errorMessage.includes('Unauthorized') || errorMessage.includes('Access token required')) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            
            // If not on login page, redirect to login
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/';
            }
          }
        }
        
        // For 403 errors, don't clear token - it's an authorization issue, not authentication
        // The error will be thrown and handled by the component
        
        throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();
      
      // Handle different response formats
      if (data.success !== undefined) {
        if (data.success) {
          // If data.data exists, return it; otherwise return the whole response (for endpoints that return data directly)
          return (data.data !== undefined ? data.data : data) as T;
        } else {
          throw new Error(data.error || data.message || 'Request failed');
        }
      }
      
      return data as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Health Check
  async healthCheck() {
    return this.request('/api/health');
  }

  // Authentication APIs
  async login(username: string, password: string) {
    const url = `${this.baseURL}/api/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle response structure: { success: true, data: { token, user } }
    if (data.success && data.data) {
      const { token, user } = data.data;
      if (token) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
      }
      return { token, user };
    }
    
    throw new Error('Invalid response format');
  }

  async getCurrentUser() {
    return this.request('/api/auth/me');
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  getStoredUser() {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Menu APIs
  async getAddons() {
    return this.request<Array<any>>('/api/menu/addons');
  }

  async createAddon(addonData: any) {
    return this.request('/api/menu/addons', {
      method: 'POST',
      body: JSON.stringify(addonData),
    });
  }

  async updateAddon(id: number, addonData: any) {
    return this.request(`/api/menu/addons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(addonData),
    });
  }

  async deleteAddon(id: number) {
    return this.request(`/api/menu/addons/${id}`, {
      method: 'DELETE',
    });
  }

  async getSoups() {
    return this.request<Array<any>>('/api/menu/soups');
  }

  async createSoup(soupData: any) {
    return this.request('/api/menu/soups', {
      method: 'POST',
      body: JSON.stringify(soupData),
    });
  }

  async updateSoup(id: string, soupData: any) {
    return this.request(`/api/menu/soups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(soupData),
    });
  }

  async deleteSoup(id: string) {
    return this.request(`/api/menu/soups/${id}`, {
      method: 'DELETE',
    });
  }

  async getSpiceLevels() {
    return this.request<Array<any>>('/api/menu/spice-levels');
  }

  async createSpiceLevel(spiceData: any) {
    return this.request('/api/menu/spice-levels', {
      method: 'POST',
      body: JSON.stringify(spiceData),
    });
  }

  async updateSpiceLevel(id: string, spiceData: any) {
    return this.request(`/api/menu/spice-levels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(spiceData),
    });
  }

  async deleteSpiceLevel(id: string) {
    return this.request(`/api/menu/spice-levels/${id}`, {
      method: 'DELETE',
    });
  }

  // Order APIs
  async createOrder(orderData: any) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(params?: { status?: string; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/orders${query ? `?${query}` : ''}`);
  }

  async getOrderById(id: number) {
    return this.request(`/api/orders/${id}`);
  }

  async updateOrderStatus(id: number, status: string) {
    return this.request(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ order_status: status }),
    });
  }

  // Queue APIs
  async getReadyOrders() {
    return this.request('/api/queue/ready');
  }

  async getInProgressOrders() {
    return this.request('/api/queue/in-progress');
  }

  // Kitchen APIs
  async getKitchenOrders() {
    return this.request('/api/kitchen');
  }

  async updateKitchenStatus(id: number, status: string) {
    return this.request(`/api/kitchen/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Settings APIs
  async getSettings() {
    return this.request('/api/settings');
  }

  async updateSetting(key: string, value: any) {
    return this.request(`/api/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  // Reports APIs
  async getDashboardSummary(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/reports/dashboard/summary${query ? `?${query}` : ''}`);
  }

  async getProductSales(params?: { startDate?: string; endDate?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/reports/products${query ? `?${query}` : ''}`);
  }

  async getOrdersForReports(params?: { startDate?: string; endDate?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/reports/orders${query ? `?${query}` : ''}`);
  }

  // LINE API
  async getOrderQRCode(orderId: number) {
    return this.request(`/api/line/orders/${orderId}/qr`);
  }

  async connectLineToOrder(orderId: number, lineUserId: string, token?: string) {
    return this.request('/api/line/connect', {
      method: 'POST',
      body: JSON.stringify({ orderId, lineUserId, token }),
    });
  }

  async getOrderLineStatus(orderId: number) {
    return this.request(`/api/line/orders/${orderId}/status`);
  }

  async disableOrderNotification(orderId: number, lineUserId: string) {
    return this.request('/api/line/disable', {
      method: 'POST',
      body: JSON.stringify({ orderId, lineUserId }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;

