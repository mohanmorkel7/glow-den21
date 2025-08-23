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

  // Mock data for dashboard with file processing focus
  const dashboardStats = {
    totalProjects: 8,
    activeUsers: 45,
    todayTargetFiles: 125000,
    todayCompletedFiles: 108500,
    totalEarningsUSD: 65420.50,
    totalEarningsINR: 5429881.50,
    pendingApprovals: 12
  };

  // Daily file processing data for charts
  const dailyProductivityData = [
    { date: '2024-01-01', target: 120000, completed: 115000, submitted: 114500, earnings: 5750 },
    { date: '2024-01-02', target: 125000, completed: 122000, submitted: 121800, earnings: 6100 },
    { date: '2024-01-03', target: 120000, completed: 98000, submitted: 97500, earnings: 4900 },
    { date: '2024-01-04', target: 130000, completed: 128000, submitted: 127500, earnings: 6400 },
    { date: '2024-01-05', target: 125000, completed: 131000, submitted: 130500, earnings: 6550 },
    { date: '2024-01-06', target: 115000, completed: 112000, submitted: 111800, earnings: 5600 },
    { date: '2024-01-07', target: 125000, completed: 108500, submitted: 108000, earnings: 5425 }
  ];

  // Monthly earnings data
  const monthlyEarningsData = [
    { month: 'Oct 2023', usd: 48500, inr: 4025500 },
    { month: 'Nov 2023', usd: 52300, inr: 4340900 },
    { month: 'Dec 2023', usd: 58700, inr: 4872100 },
    { month: 'Jan 2024', usd: 65420, inr: 5429881 }
  ];

  // Project progress data for pie chart
  const projectProgressData = [
    { name: 'Completed', value: 3, fill: '#22c55e' },
    { name: 'Active', value: 4, fill: '#3b82f6' },
    { name: 'On Hold', value: 1, fill: '#f59e0b' }
  ];

  // Team performance data
  const teamPerformanceData = [
    { name: 'Sarah Johnson', completed: 18500, target: 20000, efficiency: 92.5, earnings: 925 },
    { name: 'Mike Davis', completed: 19200, target: 20000, efficiency: 96, earnings: 960 },
    { name: 'Emily Wilson', completed: 21500, target: 20000, efficiency: 107.5, earnings: 1075 },
    { name: 'John Smith', completed: 17800, target: 20000, efficiency: 89, earnings: 890 },
    { name: 'David Chen', completed: 19800, target: 20000, efficiency: 99, earnings: 990 }
  ];

  // Attendance data for dashboard - simplified login-based system
  const attendanceData = {
    today: {
      totalEmployees: 45,
      present: 42,  // Users who logged in today
      absent: 3     // Users who haven't logged in today
    },
    thisWeek: {
      averageAttendance: 93.3,
      totalWorkingDays: 7,
      totalPresent: 294,
      totalAbsent: 21
    },
    thisMonth: {
      averageAttendance: 91.8,
      totalWorkingDays: 22,
      totalPresent: 910,
      totalAbsent: 80
    }
  };

  // Daily attendance trend for last 7 days
  const dailyAttendanceTrend = [
    { date: '2024-01-15', present: 43, absent: 2, total: 45, percentage: 95.6 },
    { date: '2024-01-16', present: 41, absent: 4, total: 45, percentage: 91.1 },
    { date: '2024-01-17', present: 44, absent: 1, total: 45, percentage: 97.8 },
    { date: '2024-01-18', present: 40, absent: 5, total: 45, percentage: 88.9 },
    { date: '2024-01-19', present: 43, absent: 2, total: 45, percentage: 95.6 },
    { date: '2024-01-20', present: 41, absent: 4, total: 45, percentage: 91.1 },
    { date: '2024-01-21', present: 42, absent: 3, total: 45, percentage: 93.3 }
  ];

  // Individual employee attendance (for detailed view) - simplified login-based
  const employeeAttendance = [
    {
      name: 'Sarah Johnson',
      role: 'user',
      daysPresent: 20,
      daysAbsent: 2,
      attendanceRate: 90.9,
      lastLogin: '2024-01-21T09:15:00Z',
      status: 'Present'  // Logged in today
    },
    {
      name: 'Mike Davis',
      role: 'user',
      daysPresent: 22,
      daysAbsent: 0,
      attendanceRate: 100,
      lastLogin: '2024-01-21T08:45:00Z',
      status: 'Present'  // Logged in today
    },
    {
      name: 'Emily Wilson',
      role: 'project_manager',
      daysPresent: 21,
      daysAbsent: 1,
      attendanceRate: 95.5,
      lastLogin: '2024-01-21T09:30:00Z',
      status: 'Present'  // Logged in today
    },
    {
      name: 'John Smith',
      role: 'project_manager',
      daysPresent: 19,
      daysAbsent: 3,
      attendanceRate: 86.4,
      lastLogin: '2024-01-20T17:30:00Z',
      status: 'Absent'   // Haven't logged in today
    },
    {
      name: 'David Chen',
      role: 'user',
      daysPresent: 21,
      daysAbsent: 1,
      attendanceRate: 95.5,
      lastLogin: '2024-01-21T08:50:00Z',
      status: 'Present'  // Logged in today
    }
  ];

  // Recent projects data with file tracking
  const recentProjects = [
    { 
      id: 1, 
      name: 'MO Project - Data Processing', 
      filesCompleted: 187500, 
      filesTarget: 300000, 
      dailyCapacity: 20000,
      deadline: '2024-01-31', 
      status: 'On Track',
      earningsUSD: 9375,
      ratePerFile: 0.05
    },
    { 
      id: 2, 
      name: 'Customer Support Processing', 
      filesCompleted: 48600, 
      filesTarget: 75000, 
      dailyCapacity: 5000,
      deadline: '2024-02-15', 
      status: 'Behind',
      earningsUSD: 3888,
      ratePerFile: 0.08
    },
    { 
      id: 3, 
      name: 'Invoice Processing', 
      filesCompleted: 150000, 
      filesTarget: 150000, 
      dailyCapacity: 10000,
      deadline: '2024-01-15', 
      status: 'Completed',
      earningsUSD: 18000,
      ratePerFile: 0.12
    }
  ];

  const formatCurrency = (amount: number, currency: 'USD' | 'INR') => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
  };

  const getProgressColor = (completed: number, target: number) => {
    const percentage = (completed / target) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

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
            <p className="text-xs text-muted-foreground">Approvals needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daily Productivity Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily File Processing
            </CardTitle>
            <CardDescription>
              Target vs completed files over the last 7 days{user.role === 'super_admin' ? ' with earnings' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dailyProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toLocaleString() : value, 
                    name === 'target' ? 'Target Files' : 
                    name === 'completed' ? 'Completed Files' : 
                    name === 'earnings' ? 'Earnings (USD)' : name
                  ]}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  fill="#e5e7eb" 
                  stroke="#9ca3af" 
                  fillOpacity={0.3}
                  name="Target"
                />
                <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
                {user.role === 'super_admin' && (
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    name="Earnings"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Project Status
            </CardTitle>
            <CardDescription>
              Overview of project completion status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={projectProgressData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectProgressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Earnings and Team Performance - Admin Only */}
      {user.role === 'super_admin' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly Earnings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Monthly Earnings
              </CardTitle>
              <CardDescription>
                USD and INR earnings comparison by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyEarningsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'usd' ? formatCurrency(Number(value), 'USD') : formatCurrency(Number(value), 'INR'),
                      name === 'usd' ? 'USD Earnings' : 'INR Earnings'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="usd" fill="#22c55e" name="USD" />
                  <Bar dataKey="inr" fill="#3b82f6" name="INR" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Team Performance
              </CardTitle>
              <CardDescription>
                Individual team member efficiency and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamPerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'efficiency' ? `${value}%` :
                      name === 'earnings' ? `$${value}` :
                      value.toLocaleString(),
                      name === 'efficiency' ? 'Efficiency' :
                      name === 'earnings' ? 'Earnings' :
                      name === 'completed' ? 'Completed Files' : name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
                  <Bar dataKey="earnings" fill="#22c55e" name="Earnings" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Performance for Project Managers - No Earnings */}
      {user.role === 'project_manager' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Team Performance
            </CardTitle>
            <CardDescription>
              Individual team member efficiency and productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teamPerformanceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'efficiency' ? `${value}%` :
                    value.toLocaleString(),
                    name === 'efficiency' ? 'Efficiency' :
                    name === 'completed' ? 'Completed Files' : name
                  ]}
                />
                <Legend />
                <Bar dataKey="completed" fill="#3b82f6" name="Completed Files" />
                <Bar dataKey="efficiency" fill="#22c55e" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Attendance Dashboard - Admin & Project Managers */}
      {(user.role === 'super_admin' || user.role === 'project_manager') && (
        <div className="space-y-6">
          {/* Attendance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Present Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{attendanceData.today.present}</div>
                <p className="text-xs text-muted-foreground">
                  logged in today out of {attendanceData.today.totalEmployees} {user.role === 'super_admin' ? 'total staff' : 'users'}
                </p>
                <div className="mt-2">
                  <Progress
                    value={(attendanceData.today.present / attendanceData.today.totalEmployees) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Absent Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{attendanceData.today.absent}</div>
                <p className="text-xs text-muted-foreground">
                  {((attendanceData.today.absent / attendanceData.today.totalEmployees) * 100).toFixed(1)}% absence rate
                </p>
                <div className="mt-2">
                  <Progress
                    value={(attendanceData.today.absent / attendanceData.today.totalEmployees) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Weekly Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{attendanceData.thisWeek.averageAttendance}%</div>
                <p className="text-xs text-muted-foreground">
                  {attendanceData.thisWeek.totalPresent} total present this week
                </p>
                <div className="mt-2">
                  <Progress value={attendanceData.thisWeek.averageAttendance} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Daily Attendance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  7-Day Attendance Trend
                </CardTitle>
                <CardDescription>
                  Daily attendance percentage over the last week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyAttendanceTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis domain={[80, 100]} />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'percentage' ? `${value}%` : value,
                        name === 'percentage' ? 'Attendance Rate' :
                        name === 'present' ? 'Present' : 'Absent'
                      ]}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="percentage"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Attendance %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Employee Login Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Today's Login Status
                </CardTitle>
                <CardDescription>
                  Current login status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Present (Logged In)', value: attendanceData.today.present, fill: '#22c55e' },
                        { name: 'Absent (Not Logged In)', value: attendanceData.today.absent, fill: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Present (Logged In)', value: attendanceData.today.present, fill: '#22c55e' },
                        { name: 'Absent (Not Logged In)', value: attendanceData.today.absent, fill: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Employee Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {user.role === 'super_admin' ? 'All Staff Attendance' : 'User Attendance'} Details
              </CardTitle>
              <CardDescription>
                Individual login-based attendance records for this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Employee</th>
                      <th className="text-left p-2 font-medium">Role</th>
                      <th className="text-left p-2 font-medium">Login Status</th>
                      <th className="text-left p-2 font-medium">Attendance Rate</th>
                      <th className="text-left p-2 font-medium">Days Present</th>
                      <th className="text-left p-2 font-medium">Days Absent</th>
                      <th className="text-left p-2 font-medium">Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeAttendance
                      .filter(emp =>
                        user.role === 'super_admin' ||
                        (user.role === 'project_manager' && emp.role === 'user')
                      )
                      .map((employee, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div className="font-medium">{employee.name}</div>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="capitalize">
                            {employee.role.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge
                            className={
                              employee.status === 'Present' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {employee.status === 'Present' ? 'Logged In' : 'Not Logged In'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              employee.attendanceRate >= 95 ? 'text-green-600' :
                              employee.attendanceRate >= 85 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {employee.attendanceRate}%
                            </span>
                            <div className="w-16">
                              <Progress value={employee.attendanceRate} className="h-1" />
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-green-600 font-medium">{employee.daysPresent}</td>
                        <td className="p-2 text-red-600 font-medium">{employee.daysAbsent}</td>
                        <td className="p-2 text-sm text-muted-foreground">
                          {new Date(employee.lastLogin).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Active Projects Overview
          </CardTitle>
          <CardDescription>
            {user.role === 'user' ? 'Your assigned projects and file processing progress' :
             user.role === 'project_manager' ? 'Detailed view of current project progress and performance' :
             'Detailed view of current project progress and earnings'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => {
              const progress = (project.filesCompleted / project.filesTarget) * 100;
              const remainingFiles = project.filesTarget - project.filesCompleted;
              const estimatedDays = Math.ceil(remainingFiles / project.dailyCapacity);
              
              return (
                <div key={project.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{project.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Due: {project.deadline}</span>
                        </div>
                        <Badge 
                          variant={project.status === 'On Track' ? 'default' : 
                                  project.status === 'Behind' ? 'destructive' : 
                                  project.status === 'Completed' ? 'secondary' : 'outline'}
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    {user.role === 'super_admin' && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(project.earningsUSD, 'USD')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          @${project.ratePerFile}/file
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Files Completed</div>
                      <div className="font-medium">{project.filesCompleted.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target Files</div>
                      <div className="font-medium">{project.filesTarget.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Daily Capacity</div>
                      <div className="font-medium">{project.dailyCapacity.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Est. Days Left</div>
                      <div className={`font-medium ${project.status === 'Completed' ? 'text-green-600' : 'text-blue-600'}`}>
                        {project.status === 'Completed' ? 'Done' : `${estimatedDays} days`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className={getProgressColor(project.filesCompleted, project.filesTarget)}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* User Performance Dashboard - Daily, Weekly, Monthly */}
      {user.role === 'user' && (
        <div className="space-y-6">
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Timer className="h-5 w-5" />
                  Daily Performance
                </CardTitle>
                <CardDescription>Today's file processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target</span>
                    <span className="font-medium">20,000 files</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-bold text-green-600">18,500 files</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Remaining</span>
                    <span className="font-medium text-orange-600">1,500 files</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="text-blue-600">92.5%</span>
                    </div>
                    <Progress value={92.5} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <Calendar className="h-5 w-5" />
                  Weekly Performance
                </CardTitle>
                <CardDescription>This week's progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target</span>
                    <span className="font-medium">140,000 files</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-bold text-green-600">128,500 files</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg/Day</span>
                    <span className="font-medium text-blue-600">18,357 files</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="text-purple-600">91.8%</span>
                    </div>
                    <Progress value={91.8} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Performance
                </CardTitle>
                <CardDescription>January 2024 summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target</span>
                    <span className="font-medium">600,000 files</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-bold text-green-600">545,250 files</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg/Day</span>
                    <span className="font-medium text-blue-600">17,588 files</span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span className="text-emerald-600">90.9%</span>
                    </div>
                    <Progress value={90.9} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your 7-Day Performance Trend
              </CardTitle>
              <CardDescription>
                Daily file processing over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { day: 'Mon', completed: 19200, target: 20000 },
                  { day: 'Tue', completed: 18800, target: 20000 },
                  { day: 'Wed', completed: 19500, target: 20000 },
                  { day: 'Thu', completed: 17900, target: 20000 },
                  { day: 'Fri', completed: 19100, target: 20000 },
                  { day: 'Sat', completed: 18500, target: 20000 },
                  { day: 'Sun', completed: 18500, target: 20000 }
                ]}>
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

          {/* Monthly Summary Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monthly Summary & Goals
              </CardTitle>
              <CardDescription>
                Track your performance metrics and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">31</div>
                  <div className="text-sm text-blue-700">Working Days</div>
                  <div className="text-xs text-muted-foreground">This month</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">28</div>
                  <div className="text-sm text-green-700">Days Achieved</div>
                  <div className="text-xs text-muted-foreground">Target met</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">95.2%</div>
                  <div className="text-sm text-purple-700">Efficiency</div>
                  <div className="text-xs text-muted-foreground">Average</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">B+</div>
                  <div className="text-sm text-orange-700">Grade</div>
                  <div className="text-xs text-muted-foreground">Performance</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Timer className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Auto-Update Reminder</p>
                <p className="text-xs text-muted-foreground">Daily counts will be automatically submitted at 8:00 PM IST</p>
              </div>
              <span className="text-xs text-muted-foreground">2 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
