import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  Download,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  Activity,
  Bot,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

// Individual user performance data - current user's data
const userDailyData = [
  {
    date: "2024-01-08",
    completed: 320,
    target: 350,
    hours: 7.5,
    efficiency: 91.4,
  },
  {
    date: "2024-01-09",
    completed: 280,
    target: 350,
    hours: 8.0,
    efficiency: 80.0,
  },
  {
    date: "2024-01-10",
    completed: 380,
    target: 350,
    hours: 7.2,
    efficiency: 108.6,
  },
  {
    date: "2024-01-11",
    completed: 360,
    target: 350,
    hours: 7.8,
    efficiency: 102.9,
  },
  {
    date: "2024-01-12",
    completed: 420,
    target: 350,
    hours: 7.0,
    efficiency: 120.0,
  },
  {
    date: "2024-01-13",
    completed: 290,
    target: 350,
    hours: 8.2,
    efficiency: 82.9,
  },
  {
    date: "2024-01-14",
    completed: 390,
    target: 350,
    hours: 7.3,
    efficiency: 111.4,
  },
  {
    date: "2024-01-15",
    completed: 340,
    target: 350,
    hours: 7.6,
    efficiency: 97.1,
  },
];

const userWeeklyData = [
  {
    week: "Week 1",
    completed: 2100,
    target: 2450,
    hours: 54.5,
    efficiency: 85.7,
  },
  {
    week: "Week 2",
    completed: 2380,
    target: 2450,
    hours: 52.2,
    efficiency: 97.1,
  },
  {
    week: "Week 3",
    completed: 2520,
    target: 2450,
    hours: 51.8,
    efficiency: 102.9,
  },
  {
    week: "Week 4",
    completed: 2440,
    target: 2450,
    hours: 53.1,
    efficiency: 99.6,
  },
];

const userMonthlyData = [
  { month: "Sep", completed: 8200, target: 9800, hours: 210, efficiency: 83.7 },
  { month: "Oct", completed: 9100, target: 9800, hours: 205, efficiency: 92.9 },
  { month: "Nov", completed: 9650, target: 9800, hours: 208, efficiency: 98.5 },
  {
    month: "Dec",
    completed: 10200,
    target: 9800,
    hours: 202,
    efficiency: 104.1,
  },
  { month: "Jan", completed: 9440, target: 9800, hours: 211, efficiency: 96.3 },
];

// Team performance data for admins
const dailyProductivityData = [
  {
    date: "2024-01-08",
    target: 1500,
    actual: 1420,
    efficiency: 94.7,
    users: 12,
    automation: 320,
    manual: 1100,
  },
  {
    date: "2024-01-09",
    target: 1500,
    actual: 1380,
    efficiency: 92.0,
    users: 11,
    automation: 280,
    manual: 1100,
  },
  {
    date: "2024-01-10",
    target: 1500,
    actual: 1550,
    efficiency: 103.3,
    users: 13,
    automation: 380,
    manual: 1170,
  },
  {
    date: "2024-01-11",
    target: 1500,
    actual: 1480,
    efficiency: 98.7,
    users: 12,
    automation: 360,
    manual: 1120,
  },
  {
    date: "2024-01-12",
    target: 1500,
    actual: 1620,
    efficiency: 108.0,
    users: 14,
    automation: 420,
    manual: 1200,
  },
  {
    date: "2024-01-13",
    target: 1500,
    actual: 1340,
    efficiency: 89.3,
    users: 10,
    automation: 290,
    manual: 1050,
  },
  {
    date: "2024-01-14",
    target: 1500,
    actual: 1590,
    efficiency: 106.0,
    users: 13,
    automation: 390,
    manual: 1200,
  },
  {
    date: "2024-01-15",
    target: 1500,
    actual: 1450,
    efficiency: 96.7,
    users: 12,
    automation: 340,
    manual: 1110,
  },
];

const teamWeeklyData = [
  {
    week: "Week 1",
    completed: 15200,
    target: 17500,
    efficiency: 86.9,
    activeUsers: 45,
    automation: 2100,
    manual: 13100,
  },
  {
    week: "Week 2",
    completed: 17100,
    target: 17500,
    efficiency: 97.7,
    activeUsers: 48,
    automation: 2380,
    manual: 14720,
  },
  {
    week: "Week 3",
    completed: 18200,
    target: 17500,
    efficiency: 104.0,
    activeUsers: 52,
    automation: 2520,
    manual: 15680,
  },
  {
    week: "Week 4",
    completed: 16800,
    target: 17500,
    efficiency: 96.0,
    activeUsers: 46,
    automation: 2440,
    manual: 14360,
  },
];

const teamMonthlyData = [
  {
    month: "Sep",
    completed: 58200,
    target: 70000,
    efficiency: 83.1,
    activeUsers: 42,
    automation: 8200,
    manual: 50000,
  },
  {
    month: "Oct",
    completed: 64100,
    target: 70000,
    efficiency: 91.6,
    activeUsers: 45,
    automation: 9100,
    manual: 55000,
  },
  {
    month: "Nov",
    completed: 68500,
    target: 70000,
    efficiency: 97.9,
    activeUsers: 48,
    automation: 9650,
    manual: 58850,
  },
  {
    month: "Dec",
    completed: 72300,
    target: 70000,
    efficiency: 103.3,
    activeUsers: 52,
    automation: 10200,
    manual: 62100,
  },
  {
    month: "Jan",
    completed: 67300,
    target: 70000,
    efficiency: 96.1,
    activeUsers: 48,
    automation: 9440,
    manual: 57860,
  },
];

// Individual user detailed performance
const detailedUserPerformance = {
  dailyAverage: 345,
  weeklyAverage: 2435,
  monthlyAverage: 9318,
  bestDay: { date: "2024-01-12", completed: 420 },
  worstDay: { date: "2024-01-09", completed: 280 },
  totalCompleted: 41250,
  totalHours: 1124,
  averageHoursPerDay: 7.6,
  currentStreak: 5,
  longestStreak: 12,
  rank: 3,
  totalUsers: 48,
};

const projectPerformanceData = [
  {
    name: "Data Entry Alpha",
    completed: 4250,
    target: 5000,
    efficiency: 85,
    status: "active",
  },
  {
    name: "Customer Support",
    completed: 1860,
    target: 3000,
    efficiency: 62,
    status: "active",
  },
  {
    name: "Invoice Processing",
    completed: 2000,
    target: 2000,
    efficiency: 100,
    status: "completed",
  },
  {
    name: "Lead Generation",
    completed: 0,
    target: 1500,
    efficiency: 0,
    status: "planning",
  },
];

const userPerformanceData = [
  {
    name: "Sarah Johnson",
    completed: 1420,
    target: 1500,
    efficiency: 94.7,
    projects: 2,
    rating: "Excellent",
  },
  {
    name: "Mike Davis",
    completed: 1100,
    target: 1200,
    efficiency: 91.7,
    projects: 1,
    rating: "Good",
  },
  {
    name: "Emily Wilson",
    completed: 1680,
    target: 1500,
    efficiency: 112.0,
    projects: 2,
    rating: "Outstanding",
  },
  {
    name: "John Smith",
    completed: 980,
    target: 1000,
    efficiency: 98.0,
    projects: 3,
    rating: "Excellent",
  },
];

const monthlyTrends = [
  { month: "Sep", projects: 8, users: 32, efficiency: 88.5 },
  { month: "Oct", projects: 10, users: 38, efficiency: 91.2 },
  { month: "Nov", projects: 12, users: 42, efficiency: 94.8 },
  { month: "Dec", projects: 11, users: 45, efficiency: 96.2 },
  { month: "Jan", projects: 12, users: 45, efficiency: 97.1 },
];

const statusDistribution = [
  { name: "Completed", value: 45, color: "#10b981" },
  { name: "In Progress", value: 35, color: "#3b82f6" },
  { name: "Pending", value: 15, color: "#f59e0b" },
  { name: "Overdue", value: 5, color: "#ef4444" },
];

export default function Reports() {
  const { user: currentUser } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [selectedProject, setSelectedProject] = useState("all");
  const [timePeriod, setTimePeriod] = useState("daily");

  const isAdmin =
    currentUser?.role === "super_admin" ||
    currentUser?.role === "project_manager";

  // Get current data based on time period
  const getCurrentData = () => {
    if (isAdmin) {
      switch (timePeriod) {
        case "daily":
          return dailyProductivityData;
        case "weekly":
          return teamWeeklyData;
        case "monthly":
          return teamMonthlyData;
        default:
          return dailyProductivityData;
      }
    } else {
      switch (timePeriod) {
        case "daily":
          return userDailyData;
        case "weekly":
          return userWeeklyData;
        case "monthly":
          return userMonthlyData;
        default:
          return userDailyData;
      }
    }
  };

  const [serverData, setServerData] = useState<any[] | null>(null);
  const [teamPerformanceData, setTeamPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin) {
          // Fetch productivity trend for current timePeriod
          const now = new Date();
          const from = new Date(now);
          if (timePeriod === "daily") from.setDate(now.getDate() - 7);
          if (timePeriod === "weekly") from.setDate(now.getDate() - 28);
          if (timePeriod === "monthly") from.setMonth(now.getMonth() - 6);
          const data = await apiClient.getProductivityTrend({
            from: from.toISOString().slice(0, 10),
            to: now.toISOString().slice(0, 10),
            groupBy: timePeriod === "daily" ? "day" : timePeriod,
          });
          const mapped = (data as any[]).map((d: any) => ({
            date: d.date || d.period,
            week: d.week,
            month: d.month,
            target: Number(d.target || 0),
            actual: Number(d.actual || d.completed || 0),
            automation: Number(d.automation || 0),
            manual: Number(d.manual || 0),
          }));
          setServerData(mapped);
          try {
            const tp: any = await apiClient.getTeamPerformance("week");
            const list = Array.isArray(tp) ? tp : (tp as any) || [];
            const mappedTeam = list.map((u: any) => ({
              name: u.name || u.id,
              submitted: Number(u.submitted || 0),
              completedRequests: Number(u.completedRequests || u.completed_requests || 0),
              efficiency: u.efficiency || null,
            }));
            setTeamPerformanceData(mappedTeam);
          } catch (e) {
            setTeamPerformanceData([]);
          }
        } else {
          setServerData(null);
        }
      } catch (e) {
        setServerData(null);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, timePeriod]);

  const currentData = serverData ?? getCurrentData();

  // Calculate current period metrics
  const currentMetrics = isAdmin
    ? {
        totalCompleted: currentData.reduce(
          (sum, item) => sum + (item.actual || item.completed),
          0,
        ),
        totalTarget: currentData.reduce((sum, item) => sum + item.target, 0),
        averageEfficiency:
          currentData.reduce((sum, item) => sum + item.efficiency, 0) /
          currentData.length,
        activeUsers: isAdmin
          ? currentData[0]?.activeUsers || currentData[0]?.users || 48
          : 1,
      }
    : {
        totalCompleted: currentData.reduce(
          (sum, item) => sum + item.completed,
          0,
        ),
        totalTarget: currentData.reduce((sum, item) => sum + item.target, 0),
        averageEfficiency:
          currentData.reduce((sum, item) => sum + item.efficiency, 0) /
          currentData.length,
        totalHours: currentData.reduce(
          (sum, item) => sum + (item.hours || 0),
          0,
        ),
      };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isAdmin
              ? "Team Performance Analytics"
              : "My Performance Dashboard"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "View comprehensive team performance analytics and reports."
              : "Track your individual performance and productivity metrics."}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? (
          // Admin Metrics
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Efficiency
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {currentMetrics.averageEfficiency.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}{" "}
                  average
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics.totalCompleted.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {timePeriod} period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics.activeUsers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Contributing team members
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Target Achievement
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(
                    (currentMetrics.totalCompleted /
                      currentMetrics.totalTarget) *
                    100
                  ).toFixed(1)}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Of {timePeriod} targets
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Individual User Metrics
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  My Efficiency
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {currentMetrics.averageEfficiency.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}{" "}
                  average
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics.totalCompleted.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {timePeriod} period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Hours Worked
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetrics.totalHours?.toFixed(1) || "0.0"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {timePeriod} period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Ranking
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  #{detailedUserPerformance.rank}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of {detailedUserPerformance.totalUsers} users
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts and Analytics */}
      <Tabs
        defaultValue={isAdmin ? "overview" : "performance"}
        className="space-y-6"
      >
        <TabsList
          className={`grid w-full ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}
        >
          {isAdmin ? (
            <>
              <TabsTrigger value="overview">Team Overview</TabsTrigger>
              <TabsTrigger value="individual">Individual Analysis</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="performance">My Performance</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="goals">Goals & Progress</TabsTrigger>
            </>
          )}
        </TabsList>

        {isAdmin ? (
          // Admin Views
          <>
            {/* Team Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Team{" "}
                      {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}{" "}
                      Performance
                    </CardTitle>
                    <CardDescription>
                      Target vs Actual completion over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={currentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey={
                            timePeriod === "daily"
                              ? "date"
                              : timePeriod === "weekly"
                                ? "week"
                                : "month"
                          }
                          tickFormatter={
                            timePeriod === "daily"
                              ? (date) =>
                                  new Date(date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                              : (value) => value
                          }
                        />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="target"
                          stroke="#6b7280"
                          fill="#6b7280"
                          fillOpacity={0.3}
                          name="Target"
                        />
                        <Area
                          type="monotone"
                          dataKey={isAdmin ? "actual" : "completed"}
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.6}
                          name="Completed"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-purple-500" />
                      Automation vs Manual Processing
                    </CardTitle>
                    <CardDescription>
                      Breakdown of processing by type over {timePeriod} period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={currentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey={
                            timePeriod === "daily"
                              ? "date"
                              : timePeriod === "weekly"
                                ? "week"
                                : "month"
                          }
                          tickFormatter={
                            timePeriod === "daily"
                              ? (date) =>
                                  new Date(date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                              : (value) => value
                          }
                        />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="manual"
                          stackId="1"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.7}
                          name="Manual Processing"
                        />
                        <Area
                          type="monotone"
                          dataKey="automation"
                          stackId="1"
                          stroke="#9333ea"
                          fill="#9333ea"
                          fillOpacity={0.7}
                          name="Automation Tools"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Task Status Distribution</CardTitle>
                    <CardDescription>
                      Current status of all tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-4 mt-4">
                      {statusDistribution.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm">
                            {item.name}: {item.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Team Efficiency Trends</CardTitle>
                  <CardDescription>
                    Performance trends over the selected time period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={currentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey={
                          timePeriod === "daily"
                            ? "date"
                            : timePeriod === "weekly"
                              ? "week"
                              : "month"
                        }
                        tickFormatter={
                          timePeriod === "daily"
                            ? (date) =>
                                new Date(date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                            : (value) => value
                        }
                      />
                      <YAxis domain={[80, 120]} />
                      <Tooltip
                        labelFormatter={
                          timePeriod === "daily"
                            ? (date) => new Date(date).toLocaleDateString()
                            : (value) => value
                        }
                        formatter={(value) => [`${value}%`, "Efficiency"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Automation Performance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-500" />
                    Automation Tools Performance
                  </CardTitle>
                  <CardDescription>
                    Summary of automation tools contribution to overall
                    processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentData
                          .reduce(
                            (sum, item) => sum + (item.automation || 0),
                            0,
                          )
                          .toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-700">
                        Total Automated
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentData
                          .reduce((sum, item) => sum + (item.manual || 0), 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-700">Total Manual</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {(
                          (currentData.reduce(
                            (sum, item) => sum + (item.automation || 0),
                            0,
                          ) /
                            currentData.reduce(
                              (sum, item) =>
                                sum + (item.actual || item.completed || 0),
                              0,
                            )) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-xs text-green-700">
                        Automation Share
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {(
                          currentData.reduce(
                            (sum, item) => sum + (item.automation || 0),
                            0,
                          ) / currentData.length
                        ).toFixed(0)}
                      </div>
                      <div className="text-xs text-orange-700">
                        Avg {timePeriod.slice(0, -2)}ly Auto
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Individual Analysis Tab */}
            <TabsContent value="individual" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Performance Metrics</CardTitle>
                  <CardDescription>
                    Performance analysis for each team member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Member</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Completed Requests</TableHead>
                        <TableHead>Last Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(individualMetrics || []).map(
                        (user: any, index: number) => (
                          <TableRow key={user.id || index}>
                            <TableCell className="font-medium">
                              {user.name}
                            </TableCell>
                            <TableCell>
                              {(user.submitted ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell>{user.completedRequests ?? 0}</TableCell>
                            <TableCell>
                              {user.lastCompletedAt
                                ? new Date(
                                    user.lastCompletedAt,
                                  ).toLocaleString()
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Efficiency Comparison</CardTitle>
                  <CardDescription>
                    Individual efficiency comparison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={isAdmin ? teamPerformanceData : userPerformanceData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 120]} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Efficiency"]}
                      />
                      <Bar dataKey="efficiency" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Performance Overview</CardTitle>
                  <CardDescription>
                    Progress and efficiency metrics for all projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Completed / Active Users</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Completion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(projectOverview || []).map(
                        (project: any, index: number) => (
                          <TableRow key={project.id || index}>
                            <TableCell className="font-medium">
                              {project.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  project.status === "on track"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {project.status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>
                                    {(project.completed ?? 0).toLocaleString()}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Active Users: {project.activeUsers ?? 0}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Progress
                                value={project.completed > 0 ? 100 : 0}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {project.completed > 0 ? "100%" : "0%"}
                              </div>
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Completion Chart</CardTitle>
                  <CardDescription>
                    Visual representation of project progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectOverview}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="completed"
                        fill="#3b82f6"
                        name="Completed"
                      />
                      <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Growth Trends</CardTitle>
                  <CardDescription>
                    Organization growth over the past 5 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Bar
                        yAxisId="left"
                        dataKey="projects"
                        fill="#3b82f6"
                        name="Projects"
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="users"
                        fill="#10b981"
                        name="Users"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        name="Efficiency %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Growth Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      +18.5%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Projects this quarter
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Capacity Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      94.2%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Team capacity used
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      9.1/10
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Average quality rating
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </>
        ) : (
          // Individual User Views
          <>
            {/* Individual Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      My{" "}
                      {timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}{" "}
                      Performance
                    </CardTitle>
                    <CardDescription>
                      Your performance over the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={currentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey={
                            timePeriod === "daily"
                              ? "date"
                              : timePeriod === "weekly"
                                ? "week"
                                : "month"
                          }
                          tickFormatter={
                            timePeriod === "daily"
                              ? (date) =>
                                  new Date(date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                              : (value) => value
                          }
                        />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="target"
                          stroke="#6b7280"
                          fill="#6b7280"
                          fillOpacity={0.3}
                          name="Target"
                        />
                        <Area
                          type="monotone"
                          dataKey="completed"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.6}
                          name="Completed"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Efficiency Trend</CardTitle>
                    <CardDescription>
                      Your efficiency percentage over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={currentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey={
                            timePeriod === "daily"
                              ? "date"
                              : timePeriod === "weekly"
                                ? "week"
                                : "month"
                          }
                          tickFormatter={
                            timePeriod === "daily"
                              ? (date) =>
                                  new Date(date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                              : (value) => value
                          }
                        />
                        <YAxis domain={[70, 130]} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Efficiency"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="efficiency"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {timePeriod === "daily" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Hours vs Performance</CardTitle>
                    <CardDescription>
                      Correlation between hours worked and completion rate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={currentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(date) =>
                            new Date(date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }
                        />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="completed"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.6}
                          name="Completed"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="hours"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="Hours"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Performance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Best Day</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {detailedUserPerformance.bestDay.completed}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        detailedUserPerformance.bestDay.date,
                      ).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Streak</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {detailedUserPerformance.currentStreak} days
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Longest: {detailedUserPerformance.longestStreak} days
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Daily Average</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {detailedUserPerformance.dailyAverage}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Per day completion
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Progress Comparison</CardTitle>
                    <CardDescription>
                      Your performance across recent months
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={userMonthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar
                          dataKey="completed"
                          fill="#10b981"
                          name="Completed"
                        />
                        <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Efficiency Pattern</CardTitle>
                    <CardDescription>
                      Your efficiency patterns over recent weeks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={userWeeklyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis domain={[80, 110]} />
                        <Tooltip
                          formatter={(value) => [`${value}%`, "Efficiency"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="efficiency"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>
                    Key insights about your work patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {detailedUserPerformance.totalCompleted.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-700">
                        Total Completed
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {detailedUserPerformance.totalHours.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">Total Hours</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        {detailedUserPerformance.averageHoursPerDay}
                      </div>
                      <div className="text-sm text-purple-700">
                        Avg Hours/Day
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">
                        {(
                          detailedUserPerformance.totalCompleted /
                          detailedUserPerformance.totalHours
                        ).toFixed(0)}
                      </div>
                      <div className="text-sm text-orange-700">Items/Hour</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Goals & Progress Tab */}
            <TabsContent value="goals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Goals Status</CardTitle>
                    <CardDescription>
                      Your progress towards set goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Daily Target</span>
                        <span>340 / 350</span>
                      </div>
                      <Progress value={97.1} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Weekly Target</span>
                        <span>2440 / 2450</span>
                      </div>
                      <Progress value={99.6} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Monthly Target</span>
                        <span>9440 / 9800</span>
                      </div>
                      <Progress value={96.3} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Efficiency Goal</span>
                        <span>96.3% / 95%</span>
                      </div>
                      <Progress value={100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Achievement Timeline</CardTitle>
                    <CardDescription>
                      Recent achievements and milestones
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">
                            Monthly Goal Achieved
                          </div>
                          <div className="text-sm text-muted-foreground">
                            December 2024
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">
                            12-Day Streak Record
                          </div>
                          <div className="text-sm text-muted-foreground">
                            November 2024
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">Top 3 Performance</div>
                          <div className="text-sm text-muted-foreground">
                            Ongoing
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">
                            110% Daily Efficiency
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Best record
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Forecast</CardTitle>
                  <CardDescription>
                    Projected performance based on current trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        9,800
                      </div>
                      <div className="text-sm text-blue-700">
                        Projected Monthly
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Based on current pace
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        98.5%
                      </div>
                      <div className="text-sm text-green-700">
                        Projected Efficiency
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Above target
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        #2
                      </div>
                      <div className="text-sm text-purple-700">
                        Projected Ranking
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Improvement likely
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
