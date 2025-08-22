import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Activity
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // Mock data for dashboard
  const dashboardStats = {
    totalProjects: 12,
    activeUsers: 45,
    todayTarget: 1500,
    todaySubmitted: 1230,
    completedToday: 8,
    pendingTasks: 23
  };

  const recentProjects = [
    { id: 1, name: 'Data Entry Project Alpha', progress: 85, deadline: '2024-01-15', status: 'On Track' },
    { id: 2, name: 'Customer Support Portal', progress: 62, deadline: '2024-01-20', status: 'Behind' },
    { id: 3, name: 'Invoice Processing System', progress: 95, deadline: '2024-01-12', status: 'Almost Done' },
  ];

  const userPerformance = [
    { name: 'John Doe', target: 100, submitted: 95, efficiency: 95 },
    { name: 'Jane Smith', target: 150, submitted: 165, efficiency: 110 },
    { name: 'Mike Johnson', target: 120, submitted: 98, efficiency: 82 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {user.role.replace('_', ' ')}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Online now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.todaySubmitted}/{dashboardStats.todayTarget}
            </div>
            <Progress 
              value={(dashboardStats.todaySubmitted / dashboardStats.todayTarget) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground">
              +5% from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Projects
            </CardTitle>
            <CardDescription>
              Overview of your current project assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{project.name}</h4>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{project.deadline}</span>
                      </div>
                      <Badge 
                        variant={project.status === 'On Track' ? 'default' : 
                                project.status === 'Behind' ? 'destructive' : 'secondary'}
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <Progress value={project.progress} className="mt-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        {user.role === 'super_admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Team Performance
              </CardTitle>
              <CardDescription>
                Daily performance metrics for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userPerformance.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{performer.name}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="text-sm text-muted-foreground">
                          Target: {performer.target}
                        </div>
                        <div className="text-sm">
                          Submitted: {performer.submitted}
                        </div>
                        <Badge 
                          variant={performer.efficiency >= 100 ? 'default' : 
                                  performer.efficiency >= 90 ? 'secondary' : 'destructive'}
                        >
                          {performer.efficiency}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Daily Count */}
        {user.role === 'user' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Daily Count
              </CardTitle>
              <CardDescription>
                Submit your daily work count here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Today's Target</h4>
                    <p className="text-2xl font-bold text-primary">100</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Submitted</h4>
                    <p className="text-2xl font-bold">85</p>
                  </div>
                </div>
                <Button className="w-full">
                  Submit Count
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Target Warning</p>
                <p className="text-xs text-muted-foreground">3 users are below today's target</p>
              </div>
              <span className="text-xs text-muted-foreground">5 min ago</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Project Completed</p>
                <p className="text-xs text-muted-foreground">Data Entry Project Beta finished ahead of schedule</p>
              </div>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
