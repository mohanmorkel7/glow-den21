import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  ChangePasswordRequest,
  UserListQuery,
  ApiResponse,
  PaginatedResponse,
  AuthUser
} from "@shared/types";

// Mock database - in production, replace with actual database queries
let mockUsers = [
  {
    id: "1",
    name: "Super Admin",
    email: "admin@websyntactic.com",
    phone: "+1 (555) 123-4567",
    hashedPassword: "$2b$10$K9p1qGQqXYZ5Z9Z9Z9Z9Zu",
    role: "super_admin" as const,
    status: "active" as const,
    department: "Administration",
    jobTitle: "System Administrator",
    avatarUrl: null,
    theme: "system" as const,
    language: "English",
    notificationsEnabled: true,
    joinDate: "2024-01-01",
    lastLogin: "2024-01-15T10:30:00Z",
    projectsCount: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    name: "John Smith", 
    email: "john.smith@websyntactic.com",
    phone: "+1 (555) 234-5678",
    hashedPassword: "$2b$10$K9p1qGQqXYZ5Z9Z9Z9Z9Zu",
    role: "project_manager" as const,
    status: "active" as const,
    department: "Operations",
    jobTitle: "Project Manager",
    avatarUrl: null,
    theme: "light" as const,
    language: "English",
    notificationsEnabled: true,
    joinDate: "2024-01-02",
    lastLogin: "2024-01-15T09:15:00Z",
    projectsCount: 3,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-15T09:15:00Z"
  },
  {
    id: "3",
    name: "Sarah Johnson",
    email: "sarah.johnson@websyntactic.com",
    phone: "+1 (555) 345-6789",
    hashedPassword: "$2b$10$K9p1qGQqXYZ5Z9Z9Z9Z9Zu",
    role: "user" as const,
    status: "active" as const,
    department: "Data Entry",
    jobTitle: "Data Specialist",
    avatarUrl: null,
    theme: "dark" as const,
    language: "English",
    notificationsEnabled: true,
    joinDate: "2024-01-05",
    lastLogin: "2024-01-15T08:45:00Z",
    projectsCount: 2,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-01-15T08:45:00Z"
  },
  {
    id: "4",
    name: "Mike Davis",
    email: "mike.davis@websyntactic.com",
    phone: "+1 (555) 456-7890",
    hashedPassword: "$2b$10$K9p1qGQqXYZ5Z9Z9Z9Z9Zu",
    role: "user" as const,
    status: "inactive" as const,
    department: "Data Entry",
    jobTitle: "Data Specialist",
    avatarUrl: null,
    theme: "system" as const,
    language: "English",
    notificationsEnabled: false,
    joinDate: "2024-01-08",
    lastLogin: "2024-01-12T16:20:00Z",
    projectsCount: 1,
    createdAt: "2024-01-08T00:00:00Z",
    updatedAt: "2024-01-12T16:20:00Z"
  },
  {
    id: "5",
    name: "Emily Wilson",
    email: "emily.wilson@websyntactic.com",
    phone: "+1 (555) 567-8901",
    hashedPassword: "$2b$10$K9p1qGQqXYZ5Z9Z9Z9Z9Zu",
    role: "project_manager" as const,
    status: "active" as const,
    department: "Quality Assurance",
    jobTitle: "QA Manager",
    avatarUrl: null,
    theme: "light" as const,
    language: "English",
    notificationsEnabled: true,
    joinDate: "2024-01-10",
    lastLogin: "2024-01-15T11:00:00Z",
    projectsCount: 2,
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-15T11:00:00Z"
  }
];

// Helper function to convert internal user to API user
const toApiUser = (user: typeof mockUsers[0]): User => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  department: user.department,
  jobTitle: user.jobTitle,
  avatarUrl: user.avatarUrl,
  theme: user.theme,
  language: user.language,
  notificationsEnabled: user.notificationsEnabled,
  joinDate: user.joinDate,
  lastLogin: user.lastLogin,
  projectsCount: user.projectsCount,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const listUsers: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const query: UserListQuery = req.query;

    // Extract query parameters
    const {
      search = "",
      role,
      status,
      page = 1,
      limit = 20
    } = query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));

    // Filter users
    let filteredUsers = mockUsers.filter(user => {
      // Search filter
      const matchesSearch = !search || 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      // Role filter
      const matchesRole = !role || user.role === role;

      // Status filter
      const matchesStatus = !status || user.status === status;

      return matchesSearch && matchesRole && matchesStatus;
    });

    // Calculate pagination
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / limitNum);
    const offset = (pageNum - 1) * limitNum;

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limitNum);

    // Convert to API format
    const users = paginatedUsers.map(toApiUser);

    const response: PaginatedResponse<User> = {
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    };

    res.json({
      data: response
    } as ApiResponse<PaginatedResponse<User>>);

  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching users"
      }
    } as ApiResponse);
  }
};

export const getUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: AuthUser = (req as any).user;

    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      } as ApiResponse);
    }

    // Users can only view their own profile unless they have user_read permission
    if (currentUser.id !== id && !currentUser.permissions.includes("user_read") && !currentUser.permissions.includes("all")) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only view your own profile"
        }
      } as ApiResponse);
    }

    res.json({
      data: toApiUser(user)
    } as ApiResponse<User>);

  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching user"
      }
    } as ApiResponse);
  }
};

export const createUser: RequestHandler = async (req, res) => {
  try {
    const userRequest: CreateUserRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    // Validate required fields
    const { name, email, password, role = "user" } = userRequest;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Name, email, and password are required",
          details: [
            !name && { field: "name", message: "Name is required" },
            !email && { field: "email", message: "Email is required" },
            !password && { field: "password", message: "Password is required" }
          ].filter(Boolean)
        }
      } as ApiResponse);
    }

    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "A user with this email already exists"
        }
      } as ApiResponse);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid email format"
        }
      } as ApiResponse);
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 8 characters long"
        }
      } as ApiResponse);
    }

    // Hash password (mock - use bcrypt in production)
    const hashedPassword = "$2b$10$K9p1qGQqXYZ5Z9Z9Z9Z9Zu"; // Mock hash

    // Generate new user ID
    const newId = (mockUsers.length + 1).toString();

    // Create new user
    const newUser = {
      id: newId,
      name,
      email,
      phone: userRequest.phone || null,
      hashedPassword,
      role,
      status: "active" as const,
      department: userRequest.department || null,
      jobTitle: userRequest.jobTitle || null,
      avatarUrl: null,
      theme: "system" as const,
      language: "English",
      notificationsEnabled: true,
      joinDate: new Date().toISOString().split('T')[0],
      lastLogin: null,
      projectsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockUsers.push(newUser);

    res.status(201).json({
      data: toApiUser(newUser)
    } as ApiResponse<User>);

  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while creating user"
      }
    } as ApiResponse);
  }
};

export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userRequest: UpdateUserRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      } as ApiResponse);
    }

    const user = mockUsers[userIndex];

    // Users can only update their own profile (for personal fields) unless they have user_update permission
    const isOwnProfile = currentUser.id === id;
    const canUpdateUsers = currentUser.permissions.includes("user_update") || currentUser.permissions.includes("all");

    if (!isOwnProfile && !canUpdateUsers) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only update your own profile"
        }
      } as ApiResponse);
    }

    // Role changes require user_update permission
    if (userRequest.role && userRequest.role !== user.role && !canUpdateUsers) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You cannot change user roles"
        }
      } as ApiResponse);
    }

    // Validate email if provided
    if (userRequest.name && userRequest.name.trim().length === 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Name cannot be empty"
        }
      } as ApiResponse);
    }

    // Update user fields
    const updatedUser = {
      ...user,
      ...userRequest,
      updatedAt: new Date().toISOString()
    };

    // Prevent updating certain fields
    delete (updatedUser as any).id;
    delete (updatedUser as any).email; // Email changes should be separate endpoint
    delete (updatedUser as any).hashedPassword;
    delete (updatedUser as any).createdAt;

    mockUsers[userIndex] = updatedUser;

    res.json({
      data: toApiUser(updatedUser)
    } as ApiResponse<User>);

  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while updating user"
      }
    } as ApiResponse);
  }
};

export const updateUserStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUser: AuthUser = (req as any).user;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Status must be 'active' or 'inactive'"
        }
      } as ApiResponse);
    }

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      } as ApiResponse);
    }

    // Prevent user from deactivating themselves
    if (currentUser.id === id) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "You cannot deactivate your own account"
        }
      } as ApiResponse);
    }

    const user = mockUsers[userIndex];
    user.status = status;
    user.updatedAt = new Date().toISOString();

    res.json({
      data: toApiUser(user)
    } as ApiResponse<User>);

  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while updating user status"
      }
    } as ApiResponse);
  }
};

export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: AuthUser = (req as any).user;

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      } as ApiResponse);
    }

    // Prevent user from deleting themselves
    if (currentUser.id === id) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "You cannot delete your own account"
        }
      } as ApiResponse);
    }

    // In production, perform soft delete or check for dependencies
    mockUsers.splice(userIndex, 1);

    res.status(204).send();

  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while deleting user"
      }
    } as ApiResponse);
  }
};

export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    // Users can only change their own password unless they're super admin
    if (currentUser.id !== id && currentUser.role !== "super_admin") {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only change your own password"
        }
      } as ApiResponse);
    }

    if (!newPassword) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New password is required"
        }
      } as ApiResponse);
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New password must be at least 8 characters long"
        }
      } as ApiResponse);
    }

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      } as ApiResponse);
    }

    const user = mockUsers[userIndex];

    // If changing own password, verify current password
    if (currentUser.id === id) {
      if (!currentPassword) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Current password is required"
          }
        } as ApiResponse);
      }

      // Mock password verification - use bcrypt.compare in production
      const isValidPassword = currentPassword === "admin123";
      if (!isValidPassword) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Current password is incorrect"
          }
        } as ApiResponse);
      }
    }

    // Hash new password (mock - use bcrypt in production)
    user.hashedPassword = "$2b$10$NewHashedPassword";
    user.updatedAt = new Date().toISOString();

    res.json({
      data: { message: "Password changed successfully" }
    } as ApiResponse);

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while changing password"
      }
    } as ApiResponse);
  }
};

export const getUserProjects: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: AuthUser = (req as any).user;

    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      } as ApiResponse);
    }

    // Users can only view their own projects unless they have user_read permission
    if (currentUser.id !== id && !currentUser.permissions.includes("user_read") && !currentUser.permissions.includes("all")) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only view your own projects"
        }
      } as ApiResponse);
    }

    // Mock projects data - in production, query from user_projects table
    const mockProjects = [
      {
        id: "1",
        name: "Data Entry Project Alpha",
        status: "active",
        role: "member",
        assignedAt: "2024-01-01T00:00:00Z"
      }
    ];

    res.json({
      data: mockProjects
    } as ApiResponse);

  } catch (error) {
    console.error("Get user projects error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching user projects"
      }
    } as ApiResponse);
  }
};
