import { RequestHandler } from "express";
import { 
  DashboardSummary, 
  ProductivityData,
  ProjectPerformance,
  UserPerformance,
  ApiResponse,
  AuthUser 
} from "@shared/types";

// Mock data - in production, these would be database queries with proper aggregations
const mockDashboardStats = {
  totalProjects: 12,
  activeProjects: 8,
  totalUsers: 45,
  activeUsers: 42,
  todayTarget: 1500,
  todaySubmitted: 1230,
  completedToday: 8,
  pendingTasks: 23,
  unreadNotifications: 5,
  overallEfficiency: 97.1
};

const mockRecentProjects = [
  {
    id: "1",
    name: "Data Entry Project Alpha",
    status: "active" as const,
    progress: 85,
    deadline: "2024-01-31",
    assignedUsers: 3,
    currentCount: 4250,
    targetCount: 5000
  },
  {
    id: "2", 
    name: "Customer Support Portal",
    status: "active" as const,
    progress: 62,
    deadline: "2024-02-15",
    assignedUsers: 2,
    currentCount: 1860,
    targetCount: 3000
  },
  {
    id: "3",
    name: "Invoice Processing System", 
    status: "completed" as const,
    progress: 100,
    deadline: "2024-01-15",
    assignedUsers: 2,
    currentCount: 2000,
    targetCount: 2000
  }
];

const mockTeamPerformance = [
  {
    id: "3",
    name: "Sarah Johnson",
    target: 150,
    submitted: 142,
    efficiency: 94.7,
    projects: 2,
    rating: "Excellent"
  },
  {
    id: "4",
    name: "Mike Davis", 
    target: 120,
    submitted: 98,
    efficiency: 81.7,
    projects: 1,
    rating: "Good"
  },
  {
    id: "5",
    name: "Emily Wilson",
    target: 180,
    submitted: 195,
    efficiency: 108.3,
    projects: 2,
    rating: "Outstanding"
  }
];

const mockRecentAlerts = [
  {
    id: "1",
    type: "warning" as const,
    title: "Daily Target Warning",
    message: "3 users are below today's target completion rate",
    timestamp: "2024-01-15T09:30:00Z",
    isRead: false
  },
  {
    id: "2",
    type: "success" as const, 
    title: "Project Completed",
    message: "Invoice Processing System completed ahead of schedule",
    timestamp: "2024-01-15T08:15:00Z",
    isRead: true
  },
  {
    id: "3",
    type: "info" as const,
    title: "System Maintenance",
    message: "Scheduled maintenance tonight from 11 PM to 2 AM",
    timestamp: "2024-01-14T16:45:00Z",
    isRead: false
  }
];

const mockProductivityData: ProductivityData[] = [
  { date: "2024-01-08", target: 1500, actual: 1420, efficiency: 94.7 },
  { date: "2024-01-09", target: 1500, actual: 1380, efficiency: 92.0 },
  { date: "2024-01-10", target: 1500, actual: 1550, efficiency: 103.3 },
  { date: "2024-01-11", target: 1500, actual: 1480, efficiency: 98.7 },
  { date: "2024-01-12", target: 1500, actual: 1620, efficiency: 108.0 },
  { date: "2024-01-13", target: 1500, actual: 1340, efficiency: 89.3 },
  { date: "2024-01-14", target: 1500, actual: 1590, efficiency: 106.0 },
  { date: "2024-01-15", target: 1500, actual: 1450, efficiency: 96.7 }
];

export const getDashboardSummary: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const { period = "week" } = req.query;

    // Calculate role-specific summary
    let summary: any = {
      overallEfficiency: mockDashboardStats.overallEfficiency,
      totalCompleted: mockDashboardStats.todaySubmitted,
      activeProjects: mockDashboardStats.activeProjects,
      teamPerformance: "Excellent"
    };

    // Add role-specific metrics
    if (currentUser.role === "super_admin" || currentUser.role === "project_manager") {
      summary = {
        ...summary,
        totalUsers: mockDashboardStats.totalUsers,
        activeUsers: mockDashboardStats.activeUsers,
        pendingTasks: mockDashboardStats.pendingTasks,
        unreadNotifications: mockDashboardStats.unreadNotifications,
        growthRate: 18.5,
        capacityUtilization: 94.2,
        qualityScore: 9.1
      };
    }

    // User-specific metrics
    if (currentUser.role === "user") {
      // In production, query user's specific data
      summary = {
        ...summary,
        todayTarget: 100,
        todaySubmitted: 85,
        userEfficiency: 85.0,
        assignedProjects: 2
      };
    }

    res.json({
      data: summary
    } as ApiResponse<DashboardSummary>);

  } catch (error) {
    console.error("Get dashboard summary error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching dashboard summary"
      }
    } as ApiResponse);
  }
};

export const getRecentProjects: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const { limit = 5 } = req.query;

    let projects = mockRecentProjects;

    // Filter projects based on user role
    if (currentUser.role === "user") {
      // In production, filter by user assignments
      // For now, show subset of projects
      projects = projects.slice(0, 2);
    }

    // Apply limit
    const limitNum = Math.min(10, Math.max(1, Number(limit)));
    const limitedProjects = projects.slice(0, limitNum);

    // Add computed fields
    const projectsWithDetails = limitedProjects.map(project => ({
      ...project,
      progressPercentage: project.progress,
      statusBadge: getStatusBadge(project.status),
      daysToDeadline: getDaysToDeadline(project.deadline),
      isOverdue: new Date(project.deadline) < new Date() && project.status !== "completed"
    }));

    res.json({
      data: projectsWithDetails
    } as ApiResponse);

  } catch (error) {
    console.error("Get recent projects error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching recent projects"
      }
    } as ApiResponse);
  }
};

export const getTeamPerformance: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const { period = "today" } = req.query;

    // Only managers and admins can see team performance
    if (currentUser.role === "user") {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You don't have permission to view team performance"
        }
      } as ApiResponse);
    }

    // In production, aggregate from daily_counts table
    const performanceData = mockTeamPerformance.map(user => ({
      ...user,
      efficiencyColor: getEfficiencyColor(user.efficiency),
      statusIcon: getPerformanceStatusIcon(user.efficiency),
      trend: getTrendIndicator(user.efficiency)
    }));

    res.json({
      data: performanceData
    } as ApiResponse);

  } catch (error) {
    console.error("Get team performance error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching team performance"
      }
    } as ApiResponse);
  }
};

export const getRecentAlerts: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const { limit = 5 } = req.query;

    // In production, filter alerts based on user permissions and assignments
    let alerts = mockRecentAlerts;

    // Filter alerts based on user role
    if (currentUser.role === "user") {
      // Users see fewer system alerts
      alerts = alerts.filter(alert => 
        alert.type !== "warning" || alert.title.includes("target")
      );
    }

    const limitNum = Math.min(10, Math.max(1, Number(limit)));
    const limitedAlerts = alerts.slice(0, limitNum);

    res.json({
      data: limitedAlerts
    } as ApiResponse);

  } catch (error) {
    console.error("Get recent alerts error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching recent alerts"
      }
    } as ApiResponse);
  }
};

export const getProductivityTrend: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const { from, to, groupBy = "day" } = req.query;

    // Validate date range
    let startDate = from ? new Date(from as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let endDate = to ? new Date(to as string) : new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid date format"
        }
      } as ApiResponse);
    }

    // In production, query daily_counts table with proper aggregation
    let productivityData = mockProductivityData;

    // Filter by date range
    productivityData = productivityData.filter(data => {
      const dataDate = new Date(data.date);
      return dataDate >= startDate && dataDate <= endDate;
    });

    // Group data if needed (weekly, monthly)
    if (groupBy === "week") {
      productivityData = groupByWeek(productivityData);
    } else if (groupBy === "month") {
      productivityData = groupByMonth(productivityData);
    }

    // Add computed metrics
    const dataWithMetrics = productivityData.map(data => ({
      ...data,
      variance: data.actual - data.target,
      variancePercentage: ((data.actual - data.target) / data.target) * 100,
      performanceLevel: getPerformanceLevel(data.efficiency)
    }));

    res.json({
      data: dataWithMetrics
    } as ApiResponse);

  } catch (error) {
    console.error("Get productivity trend error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching productivity trend"
      }
    } as ApiResponse);
  }
};

export const getUserDashboard: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;

    // User-specific dashboard data
    const userDashboard = {
      todayTarget: 100,
      todaySubmitted: 85,
      efficiency: 85.0,
      assignedProjects: 2,
      completedThisWeek: 450,
      weeklyTarget: 500,
      rank: 3,
      totalUsers: 12,
      recentSubmissions: [
        {
          date: "2024-01-15",
          projectName: "Data Entry Alpha",
          submitted: 85,
          target: 100,
          status: "submitted"
        },
        {
          date: "2024-01-14", 
          projectName: "Data Entry Alpha",
          submitted: 95,
          target: 100,
          status: "approved"
        }
      ],
      achievements: [
        {
          id: "1",
          title: "Weekly Goal Achieved",
          description: "Completed 100% of weekly target",
          earnedAt: "2024-01-14T00:00:00Z",
          icon: "target"
        }
      ]
    };

    res.json({
      data: userDashboard
    } as ApiResponse);

  } catch (error) {
    console.error("Get user dashboard error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching user dashboard"
      }
    } as ApiResponse);
  }
};

// Helper functions
function getStatusBadge(status: string) {
  const badges = {
    planning: { color: "yellow", text: "Planning" },
    active: { color: "blue", text: "Active" },
    on_hold: { color: "gray", text: "On Hold" },
    completed: { color: "green", text: "Completed" }
  };
  return badges[status as keyof typeof badges] || badges.planning;
}

function getDaysToDeadline(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= 100) return "green";
  if (efficiency >= 90) return "blue";
  if (efficiency >= 80) return "orange";
  return "red";
}

function getPerformanceStatusIcon(efficiency: number): string {
  if (efficiency >= 100) return "trending-up";
  if (efficiency >= 90) return "check-circle";
  if (efficiency >= 80) return "alert-circle";
  return "trending-down";
}

function getTrendIndicator(efficiency: number): "up" | "down" | "stable" {
  // Mock trend calculation - in production, compare with previous period
  if (efficiency >= 95) return "up";
  if (efficiency <= 85) return "down";
  return "stable";
}

function getPerformanceLevel(efficiency: number): string {
  if (efficiency >= 100) return "excellent";
  if (efficiency >= 90) return "good";
  if (efficiency >= 80) return "average";
  return "needs-improvement";
}

function groupByWeek(data: ProductivityData[]): ProductivityData[] {
  // Mock weekly grouping - in production, implement proper aggregation
  const grouped: { [key: string]: ProductivityData[] } = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!grouped[weekKey]) {
      grouped[weekKey] = [];
    }
    grouped[weekKey].push(item);
  });

  return Object.keys(grouped).map(week => {
    const weekData = grouped[week];
    const totalTarget = weekData.reduce((sum, item) => sum + item.target, 0);
    const totalActual = weekData.reduce((sum, item) => sum + item.actual, 0);
    
    return {
      date: week,
      target: totalTarget,
      actual: totalActual,
      efficiency: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
    };
  });
}

function groupByMonth(data: ProductivityData[]): ProductivityData[] {
  // Mock monthly grouping - in production, implement proper aggregation
  const grouped: { [key: string]: ProductivityData[] } = {};
  
  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(item);
  });

  return Object.keys(grouped).map(month => {
    const monthData = grouped[month];
    const totalTarget = monthData.reduce((sum, item) => sum + item.target, 0);
    const totalActual = monthData.reduce((sum, item) => sum + item.actual, 0);
    
    return {
      date: month,
      target: totalTarget,
      actual: totalActual,
      efficiency: totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
    };
  });
}
