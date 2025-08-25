// Tutorial Management Types for BPO Platform
// Types for tutorial videos, instructions, and training content

// ===== TUTORIAL TYPES =====
export type TutorialStatus = "draft" | "published" | "archived";
export type TutorialCategory =
  | "getting_started"
  | "daily_tasks"
  | "projects"
  | "reports"
  | "advanced"
  | "troubleshooting";
export type UserRole = "super_admin" | "project_manager" | "user";

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: TutorialCategory;
  status: TutorialStatus;

  // Video details
  videoUrl?: string; // Local video file path or URL
  videoFileName?: string; // Original filename
  videoSize?: number; // File size in bytes
  videoDuration?: number; // Duration in seconds
  thumbnailUrl?: string; // Video thumbnail image

  // Content
  instructions: string; // Rich text content (HTML)
  steps: TutorialStep[]; // Step-by-step instructions

  // Access control
  targetRoles: UserRole[]; // Which roles can access this tutorial
  isRequired: boolean; // Is this tutorial mandatory for new users

  // Ordering and display
  order: number; // Display order within category
  tags: string[]; // Searchable tags

  // Metadata
  createdBy: {
    id: string;
    name: string;
  };
  updatedBy?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;

  // Analytics
  viewCount: number;
  completionCount: number;
  averageRating?: number;
}

export interface TutorialStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string; // Rich text content
  imageUrl?: string; // Optional step illustration
  videoTimestamp?: number; // Timestamp in main video (seconds)
  isRequired: boolean; // Must user complete this step
}

export interface CreateTutorialRequest {
  title: string;
  description: string;
  category: TutorialCategory;
  instructions: string;
  steps: Omit<TutorialStep, "id">[];
  targetRoles: UserRole[];
  isRequired?: boolean;
  tags?: string[];
  order?: number;
}

export interface UpdateTutorialRequest {
  title?: string;
  description?: string;
  category?: TutorialCategory;
  instructions?: string;
  steps?: Omit<TutorialStep, "id">[];
  targetRoles?: UserRole[];
  isRequired?: boolean;
  tags?: string[];
  order?: number;
  status?: TutorialStatus;
}

export interface VideoUploadRequest {
  tutorialId: string;
  videoFile: File;
  generateThumbnail?: boolean;
}

export interface VideoUploadResponse {
  videoUrl: string;
  fileName: string;
  fileSize: number;
  duration: number;
  thumbnailUrl?: string;
}

// ===== USER PROGRESS TYPES =====
export interface UserTutorialProgress {
  id: string;
  userId: string;
  tutorialId: string;

  // Progress tracking
  status: "not_started" | "in_progress" | "completed" | "skipped";
  progressPercentage: number; // 0-100
  currentStep: number; // Current step number
  completedSteps: number[]; // Array of completed step numbers

  // Time tracking
  timeSpent: number; // Total time spent in seconds
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt: string;

  // Engagement
  rating?: number; // 1-5 star rating
  feedback?: string; // User feedback text
  bookmarked: boolean; // Is tutorial bookmarked

  // Video progress
  videoProgress?: {
    watchedSeconds: number; // Total watched time
    currentPosition: number; // Current playback position
    watchPercentage: number; // Percentage of video watched
  };
}

export interface CreateProgressRequest {
  tutorialId: string;
  currentStep?: number;
  timeSpent?: number;
  videoProgress?: {
    watchedSeconds: number;
    currentPosition: number;
  };
}

export interface UpdateProgressRequest {
  status?: "in_progress" | "completed" | "skipped";
  currentStep?: number;
  completedSteps?: number[];
  timeSpent?: number;
  rating?: number;
  feedback?: string;
  bookmarked?: boolean;
  videoProgress?: {
    watchedSeconds: number;
    currentPosition: number;
  };
}

// ===== TUTORIAL ANALYTICS TYPES =====
export interface TutorialAnalytics {
  tutorialId: string;
  tutorialTitle: string;

  // Usage statistics
  totalViews: number;
  uniqueUsers: number;
  completionRate: number; // Percentage of users who completed
  averageCompletionTime: number; // Average time to complete (seconds)
  dropOffPoints: {
    // Where users typically stop
    stepNumber: number;
    dropOffPercentage: number;
  }[];

  // Engagement metrics
  averageRating: number;
  totalRatings: number;
  feedbackCount: number;
  bookmarkCount: number;

  // Time-based data
  dailyViews: {
    date: string;
    views: number;
    completions: number;
  }[];

  // User demographics
  viewsByRole: {
    role: UserRole;
    count: number;
    completionRate: number;
  }[];
}

export interface TutorialDashboard {
  overview: {
    totalTutorials: number;
    publishedTutorials: number;
    totalViews: number;
    averageCompletionRate: number;
    activeUsers: number; // Users who viewed tutorials recently
  };

  popularTutorials: {
    id: string;
    title: string;
    category: string;
    views: number;
    completionRate: number;
    rating: number;
  }[];

  recentActivity: {
    userId: string;
    userName: string;
    tutorialId: string;
    tutorialTitle: string;
    action: "started" | "completed" | "rated";
    timestamp: string;
  }[];

  categoryStats: {
    category: TutorialCategory;
    tutorialCount: number;
    totalViews: number;
    averageRating: number;
  }[];
}

// ===== TUTORIAL CATEGORIES =====
export interface TutorialCategoryInfo {
  id: TutorialCategory;
  name: string;
  description: string;
  icon: string; // Icon name for UI
  color: string; // Color code for UI
  order: number; // Display order
  requiredForRoles?: UserRole[]; // Roles that must complete tutorials in this category
}

export const TUTORIAL_CATEGORIES: TutorialCategoryInfo[] = [
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Essential tutorials for new users to get up and running",
    icon: "PlayCircle",
    color: "#3b82f6",
    order: 1,
    requiredForRoles: ["user", "project_manager"],
  },
  {
    id: "daily_tasks",
    name: "Daily Tasks",
    description: "Learn how to perform common daily work activities",
    icon: "CheckSquare",
    color: "#10b981",
    order: 2,
    requiredForRoles: ["user"],
  },
  {
    id: "projects",
    name: "Project Management",
    description: "Managing projects, assignments, and team coordination",
    icon: "FolderOpen",
    color: "#f59e0b",
    order: 3,
    requiredForRoles: ["project_manager"],
  },
  {
    id: "reports",
    name: "Reports & Analytics",
    description: "Understanding reports, analytics, and data insights",
    icon: "BarChart3",
    color: "#8b5cf6",
    order: 4,
  },
  {
    id: "advanced",
    name: "Advanced Features",
    description: "Advanced functionality and power user features",
    icon: "Settings",
    color: "#6b7280",
    order: 5,
  },
  {
    id: "troubleshooting",
    name: "Troubleshooting",
    description: "Common issues and how to resolve them",
    icon: "AlertCircle",
    color: "#ef4444",
    order: 6,
  },
];

// ===== QUERY TYPES =====
export interface TutorialListQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: TutorialCategory;
  status?: TutorialStatus;
  targetRole?: UserRole;
  isRequired?: boolean;
  sortBy?: "title" | "createdAt" | "order" | "viewCount" | "rating";
  sortOrder?: "asc" | "desc";
}

export interface UserProgressQuery {
  userId?: string;
  tutorialId?: string;
  status?: "not_started" | "in_progress" | "completed" | "skipped";
  category?: TutorialCategory;
  from?: string; // Date filter
  to?: string; // Date filter
}

export interface TutorialSearchRequest {
  query: string;
  categories?: TutorialCategory[];
  roles?: UserRole[];
  includeContent?: boolean; // Search within tutorial content
}

export interface TutorialSearchResult {
  id: string;
  title: string;
  description: string;
  category: TutorialCategory;
  relevanceScore: number; // 0-1 relevance score
  matchedTerms: string[]; // Which search terms matched
  excerpt?: string; // Relevant content excerpt
}

// ===== RICH TEXT EDITOR TYPES =====
export interface RichTextContent {
  html: string; // HTML content
  plainText: string; // Plain text version
  wordCount: number;
  estimatedReadTime: number; // Minutes
}

export interface RichTextEditorConfig {
  allowImages: boolean;
  allowVideos: boolean;
  allowLinks: boolean;
  allowTables: boolean;
  maxLength?: number;
  allowedTags?: string[];
}

// ===== VALIDATION & ERROR TYPES =====
export interface TutorialValidationError {
  field: string;
  message: string;
  code:
    | "REQUIRED"
    | "INVALID_FORMAT"
    | "TOO_LONG"
    | "TOO_SHORT"
    | "INVALID_FILE";
}

export interface VideoValidationError {
  field: string;
  message: string;
  code:
    | "FILE_TOO_LARGE"
    | "INVALID_FORMAT"
    | "DURATION_TOO_LONG"
    | "UPLOAD_FAILED";
}

export interface BulkTutorialImportResult {
  successful: number;
  failed: number;
  errors: {
    row: number;
    errors: TutorialValidationError[];
  }[];
  createdTutorials: Tutorial[];
}

// ===== NOTIFICATION TYPES =====
export interface TutorialNotification {
  id: string;
  type:
    | "new_tutorial"
    | "tutorial_updated"
    | "completion_reminder"
    | "required_tutorial";
  tutorialId: string;
  tutorialTitle: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ===== EXPORT TYPES =====
export interface TutorialExportRequest {
  format: "csv" | "excel" | "pdf";
  includeProgress?: boolean;
  includeAnalytics?: boolean;
  categories?: TutorialCategory[];
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface ProgressExportRequest {
  format: "csv" | "excel";
  userIds?: string[];
  tutorialIds?: string[];
  status?: "completed" | "in_progress" | "all";
  dateRange?: {
    from: string;
    to: string;
  };
}

// Type guards for runtime type checking
export const isTutorialCategory = (
  category: string,
): category is TutorialCategory => {
  return [
    "getting_started",
    "daily_tasks",
    "projects",
    "reports",
    "advanced",
    "troubleshooting",
  ].includes(category);
};

export const isTutorialStatus = (status: string): status is TutorialStatus => {
  return ["draft", "published", "archived"].includes(status);
};

export const isUserRole = (role: string): role is UserRole => {
  return ["super_admin", "project_manager", "user"].includes(role);
};

// Utility functions
export const getTutorialCategoryInfo = (
  category: TutorialCategory,
): TutorialCategoryInfo | undefined => {
  return TUTORIAL_CATEGORIES.find((cat) => cat.id === category);
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
};

export const calculateReadTime = (text: string): number => {
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

export const getProgressColor = (percentage: number): string => {
  if (percentage === 0) return "#6b7280"; // gray
  if (percentage < 25) return "#ef4444"; // red
  if (percentage < 50) return "#f59e0b"; // orange
  if (percentage < 75) return "#eab308"; // yellow
  if (percentage < 100) return "#3b82f6"; // blue
  return "#10b981"; // green
};
