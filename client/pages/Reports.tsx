import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

// Mock data for analytics
const dailyProductivityData = [
  { date: '2024-01-08', target: 1500, actual: 1420, efficiency: 94.7 },
  { date: '2024-01-09', target: 1500, actual: 1380, efficiency: 92.0 },
  { date: '2024-01-10', target: 1500, actual: 1550, efficiency: 103.3 },
  { date: '2024-01-11', target: 1500, actual: 1480, efficiency: 98.7 },
  { date: '2024-01-12', target: 1500, actual: 1620, efficiency: 108.0 },
  { date: '2024-01-13', target: 1500, actual: 1340, efficiency: 89.3 },
  { date: '2024-01-14', target: 1500, actual: 1590, efficiency: 106.0 },
  { date: '2024-01-15', target: 1500, actual: 1450, efficiency: 96.7 }
];

const projectPerformanceData = [
  { name: 'Data Entry Alpha', completed: 4250, target: 5000, efficiency: 85, status: 'active' },
  { name: 'Customer Support', completed: 1860, target: 3000, efficiency: 62, status: 'active' },
  { name: 'Invoice Processing', completed: 2000, target: 2000, efficiency: 100, status: 'completed' },
  { name: 'Lead Generation', completed: 0, target: 1500, efficiency: 0, status: 'planning' }
];

const userPerformanceData = [
  { name: 'Sarah Johnson', completed: 1420, target: 1500, efficiency: 94.7, projects: 2, rating: 'Excellent' },
  { name: 'Mike Davis', completed: 1100, target: 1200, efficiency: 91.7, projects: 1, rating: 'Good' },
  { name: 'Emily Wilson', completed: 1680, target: 1500, efficiency: 112.0, projects: 2, rating: 'Outstanding' },
  { name: 'John Smith', completed: 980, target: 1000, efficiency: 98.0, projects: 3, rating: 'Excellent' }
];

const monthlyTrends = [
  { month: 'Sep', projects: 8, users: 32, efficiency: 88.5 },
  { month: 'Oct', projects: 10, users: 38, efficiency: 91.2 },
  { month: 'Nov', projects: 12, users: 42, efficiency: 94.8 },
  { month: 'Dec', projects: 11, users: 45, efficiency: 96.2 },
  { month: 'Jan', projects: 12, users: 45, efficiency: 97.1 }
];

const statusDistribution = [
  { name: 'Completed', value: 45, color: '#10b981' },
  { name: 'In Progress', value: 35, color: '#3b82f6' },
  { name: 'Pending', value: 15, color: '#f59e0b' },
  { name: 'Overdue', value: 5, color: '#ef4444' }
];

export default function Reports() {
  const { user: currentUser } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedProject, setSelectedProject] = useState('all');

  const canViewReports = currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager';

  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access Reports & Analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            View detailed reports and analytics for projects and performance.
          </p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">97.1%</div>
            <p className="text-xs text-muted-foreground">
              +2.9% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,110</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              2 completing this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Performance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Excellent</div>
            <p className="text-xs text-muted-foreground">
              Above industry average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="productivity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Productivity Trend</CardTitle>
                <CardDescription>Target vs Actual completion over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    />
                    <Area type="monotone" dataKey="target" stroke="#6b7280" fill="#6b7280" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="actual" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current status of all tasks</CardDescription>
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
                      <span className="text-sm">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Efficiency Trends</CardTitle>
              <CardDescription>Weekly efficiency percentage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyProductivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[80, 110]} />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [`${value}%`, 'Efficiency']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Performance Overview</CardTitle>
              <CardDescription>Progress and efficiency metrics for all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectPerformanceData.map((project, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={project.status === 'completed' ? 'default' : 
                                  project.status === 'active' ? 'secondary' : 'outline'}
                        >
                          {project.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{project.completed.toLocaleString()}</span>
                            <span className="text-muted-foreground">/ {project.target.toLocaleString()}</span>
                          </div>
                          <Progress value={(project.completed / project.target) * 100} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${
                          project.efficiency >= 100 ? 'text-green-600' :
                          project.efficiency >= 80 ? 'text-blue-600' :
                          project.efficiency >= 60 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {project.efficiency}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {((project.completed / project.target) * 100).toFixed(1)}%
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Completion Chart</CardTitle>
              <CardDescription>Visual representation of project progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
                  <Bar dataKey="target" fill="#e5e7eb" name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Performance Metrics</CardTitle>
              <CardDescription>Performance analysis for each team member</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userPerformanceData.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.completed.toLocaleString()}</TableCell>
                      <TableCell>{user.target.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className={`font-medium ${
                          user.efficiency >= 100 ? 'text-green-600' :
                          user.efficiency >= 90 ? 'text-blue-600' :
                          user.efficiency >= 80 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {user.efficiency}%
                        </div>
                      </TableCell>
                      <TableCell>{user.projects}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.rating === 'Outstanding' ? 'default' :
                                  user.rating === 'Excellent' ? 'secondary' : 'outline'}
                        >
                          {user.rating}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Efficiency Comparison</CardTitle>
              <CardDescription>Individual efficiency comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userPerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 120]} />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                  <Bar dataKey="efficiency" fill="#10b981" />
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
              <CardDescription>Organization growth over the past 5 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="projects" fill="#3b82f6" name="Projects" />
                  <Bar yAxisId="left" dataKey="users" fill="#10b981" name="Users" />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={3} name="Efficiency %" />
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
                <div className="text-2xl font-bold text-green-600">+18.5%</div>
                <p className="text-sm text-muted-foreground">Projects this quarter</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Capacity Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">94.2%</div>
                <p className="text-sm text-muted-foreground">Team capacity used</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">9.1/10</div>
                <p className="text-sm text-muted-foreground">Average quality rating</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
