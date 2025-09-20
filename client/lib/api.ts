import { ApiResponse, PaginatedResponse } from "@shared/types";

const API_BASE_URL = "/api";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

const decodeJwtPayload = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64url -> base64
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
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
            hint = ` User role: ${role ?? "unknown"}.`;
            if (permissions) {
              hint += ` Permissions: ${Array.isArray(permissions) ? permissions.join(",") : JSON.stringify(permissions)}.`;
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
      if (
        parsed &&
        typeof parsed === "object" &&
        Object.prototype.hasOwnProperty.call(parsed, "data")
      ) {
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
        throw new Error(
          `Network error: Unable to connect to server. Please check your connection.`,
        );
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

  // Tutorials
  async getTutorials(params?: { category?: string; search?: string }) {
    const qs = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request(`/tutorials${qs}`);
  }

  async uploadTutorialVideo(file: Blob, name: string, category?: string) {
    const headers: Record<string, string> = {
      ...(this.getAuthHeaders() as any),
      "x-file-name": (file as any).name || "video.mp4",
      "x-tutorial-name": name,
    };
    if (category) headers["x-tutorial-category"] = category;
    const url = `${API_BASE_URL}/tutorials/upload`;
    const resp = await fetch(url, { method: "POST", headers, body: file });
    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText);
      throw new Error(msg || `Upload failed (${resp.status})`);
    }
    const json = await resp.json().catch(() => ({}));
    return (json as any)?.data ?? json;
  }

  async createTutorial(data: any) {
    return this.request(`/tutorials`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateTutorial(id: string, data: any) {
    return this.request(`/tutorials/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteTutorial(id: string) {
    return this.request(`/tutorials/${id}`, { method: "DELETE" });
  }

  // File processes
  async getFileProcesses(params?: { page?: number; limit?: number }) {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request(`/file-processes${queryString}`);
  }

  async getFileProcess(id: string) {
    return this.request(`/file-processes/${id}`);
  }

  async createFileProcess(data: any) {
    return this.request(`/file-processes`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateFileProcess(id: string, data: any) {
    return this.request(`/file-processes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteFileProcess(id: string) {
    return this.request(`/file-processes/${id}`, {
      method: "DELETE",
    });
  }

  async uploadFileProcessFile(id: string, file: Blob, fileName?: string) {
    const headers: Record<string, string> = {
      ...(this.getAuthHeaders() as any),
      "x-file-name": fileName || (file as any).name || "upload.csv",
    };
    const url = `${API_BASE_URL}/file-processes/${id}/upload`;
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: file,
    });
    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText);
      throw new Error(msg || `Upload failed (${resp.status})`);
    }
    const json = await resp.json().catch(() => ({}));
    return json?.data ?? json;
  }

  // File requests
  async getFileRequests(params?: {
    page?: number;
    limit?: number;
    processId?: string;
    status?: string;
    userId?: string;
  }) {
    const queryString = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request(`/file-requests${queryString}`);
  }

  async createFileRequest(data: any) {
    return this.request(`/file-requests`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async approveFileRequest(id: string, data: any) {
    return this.request(`/file-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateFileRequest(id: string, data: any) {
    return this.request(`/file-requests/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async downloadFileRequest(
    id: string,
  ): Promise<{ blob: Blob; filename: string }> {
    const headers = this.getAuthHeaders();
    const url = `${API_BASE_URL}/file-requests/${id}/download`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      const text = await resp.text().catch(() => resp.statusText);
      throw new Error(text || `Download failed (${resp.status})`);
    }
    const cd = resp.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1] : `request_${id}.csv`;
    const blob = await resp.blob();
    return { blob, filename };
  }

  // Upload completed ZIP for a request
  async uploadCompletedRequestFile(id: string, file: Blob, fileName?: string) {
    const headers: Record<string, string> = {
      ...(this.getAuthHeaders() as any),
      "x-file-name": fileName || (file as any).name || "completed.zip",
    };
    const url = `${API_BASE_URL}/file-requests/${id}/upload-completed`;
    const resp = await fetch(url, { method: "POST", headers, body: file });
    if (!resp.ok) {
      const msg = await resp.text().catch(() => resp.statusText);
      throw new Error(msg || `Upload failed (${resp.status})`);
    }
    return (await resp.json().catch(() => ({}))) as any;
  }

  // Download uploaded ZIP
  async downloadUploadedRequestFile(
    id: string,
  ): Promise<{ blob: Blob; filename: string }> {
    const headers = this.getAuthHeaders();
    const url = `${API_BASE_URL}/file-requests/${id}/uploaded`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      const text = await resp.text().catch(() => resp.statusText);
      throw new Error(text || `Download failed (${resp.status})`);
    }
    const cd = resp.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="?([^";]+)"?/i);
    const filename = match ? match[1] : `completed_${id}.zip`;
    const blob = await resp.blob();
    return { blob, filename };
  }

  // Verify uploaded work (approve/reject)
  async verifyCompletedRequest(
    id: string,
    action: "approve" | "reject",
    notes?: string,
  ) {
    return this.request(`/file-requests/${id}/verify`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    });
  }

  // Sync completed requests into daily_counts for the current user (or specified user if caller is admin)
  async syncCompletedRequests(userId?: string) {
    return this.request(`/file-requests/sync`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Expense / Salary endpoints
  async getSalaryConfig() {
    return this.request(`/expenses/salary/config`);
  }

  // Expenses
  async getExpenses(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    category?: string;
    from?: string;
    to?: string;
    month?: string;
    sortBy?: "expense_date" | "amount" | "category" | "type";
    sortOrder?: "asc" | "desc";
  }) {
    const qs = params
      ? `?${new URLSearchParams(params as any).toString()}`
      : "";
    return this.request(`/expenses${qs}`);
  }

  async createExpense(payload: {
    category: string;
    description: string;
    amount: number;
    expense_date: string; // YYYY-MM-DD
    type:
      | "administrative"
      | "operational"
      | "marketing"
      | "utilities"
      | "miscellaneous";
    frequency?: "monthly" | "one-time";
    receipt_path?: string;
  }) {
    return this.request(`/expenses`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateExpense(
    id: string,
    payload: Partial<{
      category: string;
      description: string;
      amount: number;
      date: string;
      type:
        | "administrative"
        | "operational"
        | "marketing"
        | "utilities"
        | "miscellaneous";
      frequency: "monthly" | "one-time";
      receipt: string;
      status: "pending" | "approved" | "rejected";
    }>,
  ) {
    return this.request(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteExpense(id: string) {
    return this.request(`/expenses/${id}`, { method: "DELETE" });
  }

  async getExpenseAnalyticsDashboard(month?: string) {
    const qs = month ? `?month=${encodeURIComponent(month)}` : "";
    return this.request(`/expenses/analytics/dashboard${qs}`);
  }

  async getExpenseProfitLoss() {
    return this.request(`/expenses/analytics/profit-loss`);
  }

  // Billing
  async getBillingSummary(month?: string, months?: number) {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (months) params.set("months", String(months));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.request(`/expenses/billing/summary${qs}`);
  }

  async exportBilling(
    format: "csv" | "excel" | "pdf",
    month?: string,
    rate?: number,
    months?: number,
  ) {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (months) params.set("months", String(months));
    if (rate && isFinite(rate)) params.set("rate", String(rate));
    params.set("format", format);
    const url = `${API_BASE_URL}/expenses/billing/export?${params.toString()}`;
    const headers = this.getAuthHeaders();
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      const text = await resp.text().catch(() => resp.statusText);
      throw new Error(text || `Export failed (${resp.status})`);
    }
    const blob = await resp.blob();
    return blob;
  }

  async updateSalaryConfig(config: any) {
    return this.request(`/expenses/salary/config`, {
      method: "PUT",
      body: JSON.stringify(config),
    });
  }

  async getSalaryUsers(month?: string) {
    const qs = month ? `?month=${encodeURIComponent(month)}` : "";
    return this.request(`/expenses/salary/users${qs}`);
  }

  async getSalaryProjectManagers() {
    return this.request(`/expenses/salary/project-managers`);
  }

  async createPMSalary(payload: {
    name: string;
    email?: string;
    monthlySalary: number;
  }) {
    return this.request(`/expenses/salary/project-managers`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getSalaryUserBreakdown(
    userId: string,
    period: "daily" | "weekly" | "monthly",
    month?: string,
  ) {
    const params = new URLSearchParams({ userId, period });
    if (month) params.set("month", month);
    return this.request(`/expenses/salary/breakdown?${params.toString()}`);
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
