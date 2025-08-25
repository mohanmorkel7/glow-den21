import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  FolderOpen,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  DollarSign,
  FileText,
  Timer,
  PieChart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) return null;

  // User-specific performance data
  const userPerformanceData = {
    today: {
      target: 20000,
      completed: 18500,
      remaining: 1500,
      efficiency: 92.5,
    },
    weekly: {
      target: 140000,
      completed: 131500,
      avgPerDay: 18786,
      efficiency: 93.9,
    },
    monthly: {
      target: 600000,
      completed: 545250,
      avgPerDay: 17588,
      efficiency: 90.9,
      grade: "A-",
    },
  };

  const weeklyChartData = [
    { day: "Mon", completed: 19200, target: 20000 },
    { day: "Tue", completed: 18800, target: 20000 },
    { day: "Wed", completed: 19500, target: 20000 },
    { day: "Thu", completed: 17900, target: 20000 },
    { day: "Fri", completed: 19100, target: 20000 },
    { day: "Sat", completed: 18500, target: 20000 },
    { day: "Today", completed: 18500, target: 20000 },
  ];

  // Admin dashboard data
  const dashboardStats = {
    totalProjects: 8,
    activeUsers: 45,
    todayTargetFiles: 125000,
    todayCompletedFiles: 108500,
    totalEarningsUSD: 65420.5,
    totalEarningsINR: 5429881.5,
    pendingApprovals: 12,
  };

  const formatCurrency = (amount: number, currency: "USD" | "INR") => {
    if (currency === "USD") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    } else {
      return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
  };

  // Render simplified user dashboard
  if (user.role === "user") {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your daily performance and file processing progress.
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {user.role.replace("_", " ")}
          </Badge>
        </div>

        {/* Today's Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Target className="h-5 w-5" />
                Today's Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {userPerformanceData.today.target.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">files to process</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {userPerformanceData.today.completed.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">files processed</p>
              <div className="mt-2">
                <Progress
                  value={userPerformanceData.today.efficiency}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {userPerformanceData.today.efficiency}% complete
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <Clock className="h-5 w-5" />
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {userPerformanceData.today.remaining.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">files left</p>
              <p className="text-xs text-blue-600 mt-1">~1.5 hrs to complete</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your 7-Day Performance
            </CardTitle>
            <CardDescription>
              Daily file processing over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    value.toLocaleString() + " files",
                    name === "completed" ? "Completed" : "Target",
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#94a3b8"
                  fill="#e2e8f0"
                  fillOpacity={0.3}
                  name="Target"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Summary
            </CardTitle>
            <CardDescription>
              Your week and month performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">7</div>
                <div className="text-sm text-blue-700">Working Days</div>
                <div className="text-xs text-muted-foreground">This week</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">6</div>
                <div className="text-sm text-green-700">Target Met</div>
                <div className="text-xs text-muted-foreground">Days</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {userPerformanceData.weekly.efficiency}%
                </div>
                <div className="text-sm text-purple-700">Efficiency</div>
                <div className="text-xs text-muted-foreground">This week</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {userPerformanceData.monthly.grade}
                </div>
                <div className="text-sm text-orange-700">Grade</div>
                <div className="text-xs text-muted-foreground">Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced mock data for admin dashboard
  const monthlyPerformanceData = [
    { month: "Jan", completed: 2450000, target: 2500000, revenue: 98000, efficiency: 98 },
    { month: "Feb", completed: 2680000, target: 2700000, revenue: 107200, efficiency: 99.3 },
    { month: "Mar", completed: 2890000, target: 2800000, revenue: 115600, efficiency: 103.2 },
    { month: "Apr", completed: 2750000, target: 2900000, revenue: 110000, efficiency: 94.8 },
    { month: "May", completed: 3120000, target: 3000000, revenue: 124800, efficiency: 104 },
    { month: "Jun", completed: 2980000, target: 3100000, revenue: 119200, efficiency: 96.1 }
  ];

  const teamPerformanceData = [
    { name: "Team Alpha", files: 450000, efficiency: 96.5, projects: 3 },
    { name: "Team Beta", files: 420000, efficiency: 94.2, projects: 2 },
    { name: "Team Gamma", files: 380000, efficiency: 92.8, projects: 3 },
    { name: "Team Delta", files: 310000, efficiency: 89.5, projects: 2 },
    { name: "Team Echo", files: 290000, efficiency: 88.1, projects: 1 }
  ];

  const projectDistributionData = [
    { name: "MO Projects", value: 35, files: 1200000, color: "#0088FE" },
    { name: "Data Entry", value: 25, files: 850000, color: "#00C49F" },
    { name: "Document Processing", value: 20, files: 680000, color: "#FFBB28" },
    { name: "Quality Check", value: 12, files: 410000, color: "#FF8042" },
    { name: "Others", value: 8, files: 270000, color: "#8884D8" }
  ];

  const dailyTrendsData = [
    { day: "Mon", files: 18500, users: 42, efficiency: 92.5 },
    { day: "Tue", files: 19200, users: 44, efficiency: 94.8 },
    { day: "Wed", files: 17800, users: 41, efficiency: 89.7 },
    { day: "Thu", files: 20100, users: 45, efficiency: 96.2 },
    { day: "Fri", files: 19800, users: 43, efficiency: 95.1 },
    { day: "Sat", files: 16500, users: 38, efficiency: 88.3 },
    { day: "Sun", files: 15200, users: 35, efficiency: 86.8 }
  ];

  const revenueData = [
    { quarter: "Q1", revenue: 320800, expenses: 245600, profit: 75200 },
    { quarter: "Q2", revenue: 345600, expenses: 258400, profit: 87200 },
    { quarter: "Q3", revenue: 398200, expenses: 284800, profit: 113400 },
    { quarter: "Q4", revenue: 412800, expenses: 295200, profit: 117600 }
  ];

  // Render comprehensive admin dashboard
  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Admin Control Center
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Complete business analytics and operational insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="capitalize text-lg px-4 py-2">
            {user.role.replace("_", " ")}
          </Badge>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Last updated</p>
            <p className="text-sm font-medium">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(1245680, "USD")}
            </div>
            <p className="text-xs text-muted-foreground">+12.5% from last quarter</p>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+8.2% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Processed</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {(15420000).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
            <Progress value={87.5} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">87.5% of monthly target</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {dashboardStats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">Across 8 projects</p>
            <div className="flex items-center mt-2 text-xs">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">98.2% attendance</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Efficiency</CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">94.7%</div>
            <p className="text-xs text-muted-foreground">Average team performance</p>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+2.1% improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Monthly Performance Trends
            </CardTitle>
            <CardDescription>Files processed vs targets over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    name === 'completed' ? 'Files Completed' :
                    name === 'target' ? 'Target' :
                    name === 'revenue' ? 'Revenue ($)' : name
                  ]}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="completed" fill="#3b82f6" name="Completed" />
                <Bar yAxisId="left" dataKey="target" fill="#e5e7eb" name="Target" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Project Distribution
            </CardTitle>
            <CardDescription>Current workload by project type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={projectDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {projectDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance and Daily Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Performance Analysis
            </CardTitle>
            <CardDescription>Current team productivity and efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamPerformanceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    name === 'files' ? 'Files Processed' :
                    name === 'efficiency' ? 'Efficiency (%)' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="files" fill="#3b82f6" name="Files Processed" />
                <Bar dataKey="efficiency" fill="#10b981" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              This Week Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Files</p>
                  <p className="text-2xl font-bold text-blue-600">127K</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">Avg Efficiency</p>
                  <p className="text-2xl font-bold text-green-600">92.1%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-purple-900">Revenue</p>
                  <p className="text-2xl font-bold text-purple-600">$45.2K</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">Active Users</p>
                  <p className="text-2xl font-bold text-orange-600">42</p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends and Revenue Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Daily Productivity Trends
            </CardTitle>
            <CardDescription>Week-over-week daily performance patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value,
                    name === 'files' ? 'Files' :
                    name === 'users' ? 'Active Users' :
                    name === 'efficiency' ? 'Efficiency %' : name
                  ]}
                />
                <Legend />
                <Area type="monotone" dataKey="files" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Files" />
                <Area type="monotone" dataKey="efficiency" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.4} name="Efficiency %" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue & Profit Analysis
            </CardTitle>
            <CardDescription>Quarterly financial performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    `$${typeof value === 'number' ? value.toLocaleString() : value}`,
                    name === 'revenue' ? 'Revenue' :
                    name === 'expenses' ? 'Expenses' :
                    name === 'profit' ? 'Profit' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                <Bar dataKey="profit" fill="#10b981" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Alerts and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              System Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Critical: Server Load High</p>
                  <p className="text-xs text-red-700">Processing server at 89% capacity - consider load balancing</p>
                </div>
                <span className="text-xs text-red-600">2 min ago</span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Timer className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">Daily Target Alert</p>
                  <p className="text-xs text-yellow-700">3 teams are 15% below daily processing targets</p>
                </div>
                <span className="text-xs text-yellow-600">15 min ago</span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Milestone Achieved</p>
                  <p className="text-xs text-green-700">Project Alpha reached 500K files processed milestone</p>
                </div>
                <span className="text-xs text-green-600">1 hour ago</span>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">New Team Member</p>
                  <p className="text-xs text-blue-700">Sarah Johnson joined Team Beta - pending orientation</p>
                </div>
                <span className="text-xs text-blue-600">3 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/users')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Teams
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/projects')}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                View Projects
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/reports')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/file-process')}
              >
                <Target className="h-4 w-4 mr-2" />
                Set Targets
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/reports')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
