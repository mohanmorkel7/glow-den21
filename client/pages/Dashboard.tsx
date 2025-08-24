import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  PieChart
} from 'lucide-react';
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
  ComposedChart
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // User-specific performance data
  const userPerformanceData = {
    today: {
      target: 20000,
      completed: 18500,
      remaining: 1500,
      efficiency: 92.5
    },
    weekly: {
      target: 140000,
      completed: 131500,
      avgPerDay: 18786,
      efficiency: 93.9
    },
    monthly: {
      target: 600000,
      completed: 545250,
      avgPerDay: 17588,
      efficiency: 90.9,
      grade: "A-"
    }
  };

  const weeklyChartData = [
    { day: 'Mon', completed: 19200, target: 20000 },
    { day: 'Tue', completed: 18800, target: 20000 },
    { day: 'Wed', completed: 19500, target: 20000 },
    { day: 'Thu', completed: 17900, target: 20000 },
    { day: 'Fri', completed: 19100, target: 20000 },
    { day: 'Sat', completed: 18500, target: 20000 },
    { day: 'Today', completed: 18500, target: 20000 }
  ];

  // Admin dashboard data
  const dashboardStats = {
    totalProjects: 8,
    activeUsers: 45,
    todayTargetFiles: 125000,
    todayCompletedFiles: 108500,
    totalEarningsUSD: 65420.50,
    totalEarningsINR: 5429881.50,
    pendingApprovals: 12
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'INR') => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    } else {
      return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
  };

  // Render simplified user dashboard
  if (user.role === 'user') {
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
            {user.role.replace('_', ' ')}
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
              <div className="text-3xl font-bold">{userPerformanceData.today.target.toLocaleString()}</div>
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
              <div className="text-3xl font-bold text-green-600">{userPerformanceData.today.completed.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">files processed</p>
              <div className="mt-2">
                <Progress value={userPerformanceData.today.efficiency} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{userPerformanceData.today.efficiency}% complete</p>
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
              <div className="text-3xl font-bold text-orange-600">{userPerformanceData.today.remaining.toLocaleString()}</div>
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
            <CardDescription>Daily file processing over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    value.toLocaleString() + ' files',
                    name === 'completed' ? 'Completed' : 'Target'
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
            <CardDescription>Your week and month performance metrics</CardDescription>
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
                <div className="text-2xl font-bold text-purple-600">{userPerformanceData.weekly.efficiency}%</div>
                <div className="text-sm text-purple-700">Efficiency</div>
                <div className="text-xs text-muted-foreground">This week</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{userPerformanceData.monthly.grade}</div>
                <div className="text-sm text-orange-700">Grade</div>
                <div className="text-xs text-muted-foreground">Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    );
  }

  // Render admin/PM dashboard with full data
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your file processing analytics and project overview.
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {user.role.replace('_', ' ')}
        </Badge>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.todayCompletedFiles.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of {dashboardStats.todayTargetFiles.toLocaleString()} target
            </p>
            <Progress 
              value={(dashboardStats.todayCompletedFiles / dashboardStats.todayTargetFiles) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((dashboardStats.todayCompletedFiles / dashboardStats.todayTargetFiles) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">+5% from yesterday</p>
          </CardContent>
        </Card>

        {user.role === 'super_admin' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Earnings (USD)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalEarningsUSD, 'USD')}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">approvals needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alerts & Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Daily Target Warning</p>
                <p className="text-xs text-muted-foreground">3 users are below today's file processing target</p>
              </div>
              <span className="text-xs text-muted-foreground">5 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Project Milestone Achieved</p>
                <p className="text-xs text-muted-foreground">MO Project completed 300,000 files milestone ahead of schedule</p>
              </div>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
