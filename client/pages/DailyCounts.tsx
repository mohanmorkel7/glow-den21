import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  Plus, 
  Search, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Clock,
  BarChart3,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { addDays, format } from 'date-fns';

interface DailyCount {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  date: string;
  targetCount: number;
  submittedCount: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  notes: string;
  submittedAt: string;
  approvedBy?: string;
}

interface Project {
  id: string;
  name: string;
  targetCount: number;
  isAssigned: boolean;
}

const mockDailyCounts: DailyCount[] = [
  {
    id: '1',
    userId: '3',
    userName: 'Sarah Johnson',
    projectId: '1',
    projectName: 'Data Entry Project Alpha',
    date: '2024-01-15',
    targetCount: 100,
    submittedCount: 95,
    status: 'submitted',
    notes: 'Completed all customer registration forms for the day',
    submittedAt: '2024-01-15 17:30',
    approvedBy: 'John Smith'
  },
  {
    id: '2',
    userId: '4',
    userName: 'Mike Davis',
    projectId: '1',
    projectName: 'Data Entry Project Alpha',
    date: '2024-01-15',
    targetCount: 80,
    submittedCount: 72,
    status: 'approved',
    notes: 'Some forms required additional verification',
    submittedAt: '2024-01-15 18:00',
    approvedBy: 'John Smith'
  },
  {
    id: '3',
    userId: '3',
    userName: 'Sarah Johnson',
    projectId: '2',
    projectName: 'Customer Support Portal',
    date: '2024-01-15',
    targetCount: 50,
    submittedCount: 0,
    status: 'pending',
    notes: '',
    submittedAt: ''
  },
  {
    id: '4',
    userId: '5',
    userName: 'Emily Wilson',
    projectId: '2',
    projectName: 'Customer Support Portal',
    date: '2024-01-14',
    targetCount: 75,
    submittedCount: 82,
    status: 'approved',
    notes: 'Exceeded target due to high ticket volume',
    submittedAt: '2024-01-14 16:45',
    approvedBy: 'Super Admin'
  }
];

const mockProjects: Project[] = [
  { id: '1', name: 'Data Entry Project Alpha', targetCount: 100, isAssigned: true },
  { id: '2', name: 'Customer Support Portal', targetCount: 50, isAssigned: true },
  { id: '3', name: 'Invoice Processing System', targetCount: 75, isAssigned: false }
];

export default function DailyCounts() {
  const { user: currentUser } = useAuth();
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>(mockDailyCounts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date()
  });
  const [newSubmission, setNewSubmission] = useState({
    projectId: '',
    count: 0,
    notes: ''
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const isUser = currentUser?.role === 'user';
  const canManageCounts = currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager';

  // Filter counts based on user role and filters
  const filteredCounts = dailyCounts.filter(count => {
    const matchesSearch = count.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         count.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || count.projectId === selectedProject;
    const matchesStatus = selectedStatus === 'all' || count.status === selectedStatus;
    
    // Users can only see their own counts
    if (isUser) {
      return matchesSearch && matchesProject && matchesStatus && count.userId === currentUser?.id;
    }
    
    return matchesSearch && matchesProject && matchesStatus;
  });

  // Get user's assigned projects
  const userProjects = mockProjects.filter(p => p.isAssigned);

  // Get today's submissions for current user
  const todaySubmissions = dailyCounts.filter(count => 
    count.date === today && count.userId === currentUser?.id
  );

  const handleSubmitCount = () => {
    const submission: DailyCount = {
      id: (dailyCounts.length + 1).toString(),
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      projectId: newSubmission.projectId,
      projectName: mockProjects.find(p => p.id === newSubmission.projectId)?.name || '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      targetCount: mockProjects.find(p => p.id === newSubmission.projectId)?.targetCount || 0,
      submittedCount: newSubmission.count,
      status: 'submitted',
      notes: newSubmission.notes,
      submittedAt: new Date().toISOString()
    };
    
    setDailyCounts([...dailyCounts, submission]);
    setNewSubmission({ projectId: '', count: 0, notes: '' });
    setIsSubmitDialogOpen(false);
  };

  const handleApproveCount = (countId: string) => {
    setDailyCounts(dailyCounts.map(count =>
      count.id === countId
        ? { ...count, status: 'approved' as const, approvedBy: currentUser?.name }
        : count
    ));
  };

  const handleRejectCount = (countId: string) => {
    setDailyCounts(dailyCounts.map(count =>
      count.id === countId
        ? { ...count, status: 'rejected' as const, approvedBy: currentUser?.name }
        : count
    ));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (submitted: number, target: number) => {
    const percentage = (submitted / target) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const calculateStats = () => {
    const todayCounts = dailyCounts.filter(count => count.date === today);
    const totalTarget = todayCounts.reduce((sum, count) => sum + count.targetCount, 0);
    const totalSubmitted = todayCounts.reduce((sum, count) => sum + count.submittedCount, 0);
    const pendingSubmissions = todayCounts.filter(count => count.status === 'pending').length;
    const approvedToday = todayCounts.filter(count => count.status === 'approved').length;

    return { totalTarget, totalSubmitted, pendingSubmissions, approvedToday };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Count Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage daily count submissions and targets.
          </p>
        </div>
        {isUser && (
          <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Submit Count
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Submit Daily Count</DialogTitle>
                <DialogDescription>
                  Submit your work count for today or a specific date.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={newSubmission.projectId} onValueChange={(value) => setNewSubmission({ ...newSubmission, projectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {userProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name} (Target: {project.targetCount})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="count">Count Completed</Label>
                  <Input
                    id="count"
                    type="number"
                    value={newSubmission.count}
                    onChange={(e) => setNewSubmission({ ...newSubmission, count: parseInt(e.target.value) || 0 })}
                    placeholder="Enter completed count"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={newSubmission.notes}
                    onChange={(e) => setNewSubmission({ ...newSubmission, notes: e.target.value })}
                    placeholder="Add any notes or comments..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitCount} disabled={!newSubmission.projectId}>
                  Submit Count
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Target</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTarget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all projects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmitted.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTarget > 0 ? `${((stats.totalSubmitted / stats.totalTarget) * 100).toFixed(1)}% of target` : 'No target set'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting submission
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">
              Today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Quick Actions for Users */}
      {isUser && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
            <CardDescription>Your assigned projects for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userProjects.map((project) => {
                const todayCount = todaySubmissions.find(ts => ts.projectId === project.id);
                const progress = todayCount ? (todayCount.submittedCount / project.targetCount) * 100 : 0;
                
                return (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{project.name}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="text-sm text-muted-foreground">
                          Target: {project.targetCount}
                        </div>
                        <div className="text-sm">
                          Submitted: {todayCount?.submittedCount || 0}
                        </div>
                        <Badge className={getStatusBadgeColor(todayCount?.status || 'pending')}>
                          {(todayCount?.status || 'pending').toUpperCase()}
                        </Badge>
                      </div>
                      <Progress value={progress} className="mt-2" />
                    </div>
                    {!todayCount && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setNewSubmission({ ...newSubmission, projectId: project.id });
                          setIsSubmitDialogOpen(true);
                        }}
                      >
                        Submit
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {mockProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Counts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daily Counts ({filteredCounts.length})</span>
            {canManageCounts && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription>
            Track daily count submissions and approvals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted At</TableHead>
                {canManageCounts && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCounts.map((count) => (
                <TableRow key={count.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{count.userName}</div>
                      {count.notes && (
                        <div className="text-sm text-muted-foreground">
                          {count.notes.length > 50 ? `${count.notes.substring(0, 50)}...` : count.notes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{count.projectName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                      {new Date(count.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{count.submittedCount}</span>
                        <span className="text-muted-foreground">
                          / {count.targetCount}
                        </span>
                      </div>
                      <Progress 
                        value={(count.submittedCount / count.targetCount) * 100} 
                        className="h-2"
                      />
                      <div className={`text-xs ${getProgressColor(count.submittedCount, count.targetCount)}`}>
                        {count.targetCount > 0 ? `${((count.submittedCount / count.targetCount) * 100).toFixed(1)}%` : '0%'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(count.status)}>
                      {count.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {count.submittedAt ? new Date(count.submittedAt).toLocaleString() : '-'}
                    </div>
                    {count.approvedBy && (
                      <div className="text-xs text-muted-foreground">
                        by {count.approvedBy}
                      </div>
                    )}
                  </TableCell>
                  {canManageCounts && (
                    <TableCell className="text-right">
                      {count.status === 'submitted' && (
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleApproveCount(count.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleRejectCount(count.id)}
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
