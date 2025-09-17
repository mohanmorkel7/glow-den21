import { ApiResponse, PaginatedResponse } from "@shared/types";

const API_BASE_URL = "/api";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

const decodeJwtPayload = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
};

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem("authToken");
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { requiresAuth = true, headers = {}, ...restOptions } = options;

    const requestHeaders = {
      "Content-Type": "application/json",
      ...headers,
      ...(requiresAuth ? this.getAuthHeaders() : {}),
    };

    const url = `${API_BASE_URL}${endpoint}`;

    // Create a fresh request configuration for each call
    const requestConfig = {
      ...restOptions,
      headers: requestHeaders,
    };

    try {
      const response = await fetch(url, requestConfig);

      // Handle authentication errors
      if (response.status === 401) {
        // Clear auth token and redirect to login
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        throw new Error("Authentication required");
      }

      // Read body as text first (works for empty/no-body responses too)
      let text = "";
      try {
        text = await response.text();
      } catch (err) {
        console.warn(`Failed to read response text for ${endpoint}:`, err);
        text = "";
      }

      // Try to parse JSON if any
      let parsed: any = null;
      if (text) {
        try {
          parsed = JSON.parse(text);
        } catch (err) {
          // Not JSON, keep text
          parsed = text;
        }
      }

      // If response is not ok, surface server message if present and add helpful debug info for 403
      if (!response.ok) {
        const serverMessage =
          (parsed && parsed.error && parsed.error.message) ||
          (parsed && parsed.message) ||
          (typeof parsed === "string" && parsed) ||
          response.statusText ||
          `HTTP ${response.status}`;

        if (response.status === 403) {
          // Try to decode JWT to give helpful hint to developer
          const token = this.getAuthToken();
          const decoded = token ? decodeJwtPayload(token) : null;
          const permissions = decoded?.permissions || decoded?.perms || null;
          const role = decoded?.role || null;

          let hint = "";
          if (token) {
            hint = ` User role: ${role ?? 'unknown'}.`;
            if (permissions) {
              hint += ` Permissions: ${Array.isArray(permissions) ? permissions.join(',') : JSON.stringify(permissions)}.`;
            } else {
              hint += ` Token does not include permissions array.`;
            }
          } else {
            hint = " No auth token found in localStorage.";
          }

          throw new Error(`${serverMessage}${hint} (403)`);
        }

        throw new Error(String(serverMessage));
      }

      // If no body (204), return null
      if (!text) {
        return null as unknown as T;
      }

      // If server returned ApiResponse wrapper
      if (parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "data")) {
        return parsed.data as T;
      }

      // Otherwise return parsed value (could be plain array/object)
      return parsed as T;
    } catch (error) {
      // Handle specific network errors
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error(`Network error for ${endpoint}:`, error);
        throw new Error(`Network error: Unable to connect to server. Please check your connection.`);
      }

      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      requiresAuth: false,
    });
  }

  async logout(refreshToken?: string) {
    return this.request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      requiresAuth: false,
    });
  }

  async resetPassword(email: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      requiresAuth: false,
    });
  }

  // User management endpoints
  async getUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request<PaginatedResponse<any>>(`/users${queryString}`);
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData: any) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async updateUserStatus(id: string, status: string) {
    return this.request(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    });
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    return this.request(`/users/${id}/change-password`, {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getUserProjects(id: string) {
    return this.request(`/users/${id}/projects`);
  }

  // Project management endpoints
  async getProjects(params?: {
    search?: string;
    status?: string;
    assignedUser?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request<PaginatedResponse<any>>(`/projects${queryString}`);
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async createProject(projectData: any) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: any) {
    return this.request(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  async assignUsersToProject(
    id: string,
    userIds: string[],
    roleInProject?: string,
  ) {
    return this.request(`/projects/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ userIds, roleInProject }),
    });
  }

  async removeUserFromProject(projectId: string, userId: string) {
    return this.request(`/projects/${projectId}/assign/${userId}`, {
      method: "DELETE",
    });
  }

  async getProjectProgress(id: string) {
    return this.request(`/projects/${id}/progress`);
  }

  // Daily counts endpoints
  async getDailyCounts(params?: {
    userId?: string;
    projectId?: string;
    from?: string;
    to?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request(`/daily-counts${queryString}`);
  }

  async getDailyCount(id: string) {
    return this.request(`/daily-counts/${id}`);
  }

  async createDailyCount(countData: any) {
    return this.request("/daily-counts", {
      method: "POST",
      body: JSON.stringify(countData),
    });
  }

  async updateDailyCount(id: string, countData: any) {
    return this.request(`/daily-counts/${id}`, {
      method: "PUT",
      body: JSON.stringify(countData),
    });
  }

  async approveDailyCount(id: string, notes?: string) {
    return this.request(`/daily-counts/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async rejectDailyCount(id: string, reason: string) {
    return this.request(`/daily-counts/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getDailyCountStatistics(params?: {
    userId?: string;
    projectId?: string;
    from?: string;
    to?: string;
  }) {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request(`/daily-counts/statistics${queryString}`);
  }

  // Dashboard endpoints
  async getDashboardSummary(period?: string) {
    const queryString = period ? `?period=${period}` : "";
    return this.request(`/dashboard/summary${queryString}`);
  }

  async getRecentProjects(limit?: number) {
    const queryString = limit ? `?limit=${limit}` : "";
    return this.request(`/dashboard/recent-projects${queryString}`);
  }

  async getTeamPerformance(period?: string) {
    const queryString = period ? `?period=${period}` : "";
    return this.request(`/dashboard/team-performance${queryString}`);
  }

  async getRecentAlerts(limit?: number) {
    const queryString = limit ? `?limit=${limit}` : "";
    return this.request(`/dashboard/recent-alerts${queryString}`);
  }

  async getProductivityTrend(params?: {
    from?: string;
    to?: string;
    groupBy?: string;
  }) {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request(`/dashboard/productivity-trend${queryString}`);
  }

  async getUserDashboard() {
    return this.request("/dashboard/user");
  }

  // Health check
  async healthCheck() {
    return this.request("/health", { requiresAuth: false });
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export types for convenience
export type { ApiResponse, PaginatedResponse };
