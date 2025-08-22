import React, { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Upload,
  FileText,
  Timer,
  Zap,
  Bell,
  Settings,
  Activity,
  Minus
} from 'lucide-react';
import { addDays, format } from 'date-fns';

interface DailyCount {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  date: string;
  
  // File-based counts
  targetFileCount: number;
  submittedFileCount: number;
  completedFileCount: number;
  balanceFileCount: number;
  
  // Legacy compatibility
  targetCount: number;
  submittedCount: number;
  
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  notes: string;
  submittedAt: string;
  autoSubmittedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

interface Project {
  id: string;
  name: string;
  type: 'monthly' | 'weekly' | 'both';
  fileTargets: {
    monthly?: number;
    weekly?: number;
    dailyCapacity: number;
  };
  rates: {
    ratePerFile: number;
    currency: 'USD';
  };
  isAssigned: boolean;
  status: 'active' | 'completed' | 'on_hold';
}

interface FileProcessingJob {
  id: string;
  name: string;
  type: 'mo_monthly' | 'mo_weekly';
  totalFileCount: number;
  completedFileCount: number;
  ratePerFile: number;
  assignmentType: 'automation' | 'manual';
  assignedUsers: string[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  targetEndDate: string;
  dailyTarget?: number;
}

interface JobDailyUpdate {
  id: string;
  jobId: string;
  jobName: string;
  userId?: string;
  userName?: string;
  date: string;
  targetFiles: number;
  completedFiles: number;
  balanceFiles: number;
  notes?: string;
  submittedAt?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  assignmentType: 'automation' | 'manual';
}

const mockFileProcessingJobs: FileProcessingJob[] = [
  {
    id: 'job1',
    name: 'MO Monthly Batch #2024-001',
    type: 'mo_monthly',
    totalFileCount: 300000,
    completedFileCount: 187500,
    ratePerFile: 0.008,
    assignmentType: 'manual',
    assignedUsers: ['3', '4', '6'],
    status: 'active',
    targetEndDate: '2024-01-31',
    dailyTarget: 20000
  },
  {
    id: 'job2',
    name: 'MO Weekly Batch #2024-W03',
    type: 'mo_weekly',
    totalFileCount: 75000,
    completedFileCount: 68200,
    ratePerFile: 0.008,
    assignmentType: 'automation',
    assignedUsers: [],
    status: 'active',
    targetEndDate: '2024-01-21',
    dailyTarget: 12000
  }
];

const mockJobDailyUpdates: JobDailyUpdate[] = [
  {
    id: 'update1',
    jobId: 'job1',
    jobName: 'MO Monthly Batch #2024-001',
    userId: '3',
    userName: 'Sarah Johnson',
    date: '2024-01-15',
    targetFiles: 20000,
    completedFiles: 18500,
    balanceFiles: 1500,
    notes: 'Good progress on monthly batch',
    submittedAt: '2024-01-15T20:00:00Z',
    status: 'submitted',
    assignmentType: 'manual'
  },
  {
    id: 'update2',
    jobId: 'job2',
    jobName: 'MO Weekly Batch #2024-W03',
    date: '2024-01-15',
    targetFiles: 12000,
    completedFiles: 12000,
    balanceFiles: 0,
    notes: 'Automated processing completed successfully',
    submittedAt: '2024-01-15T20:00:00Z',
    status: 'approved',
    assignmentType: 'automation'
  }
];

const mockProjects: Project[] = [
  { 
    id: '1', 
    name: 'MO Project - Data Processing', 
    type: 'both',
    fileTargets: {
      monthly: 300000,
      weekly: 50000,
      dailyCapacity: 20000
    },
    rates: {
      ratePerFile: 0.05,
      currency: 'USD'
    },
    isAssigned: true,
    status: 'active'
  },
  { 
    id: '2', 
    name: 'Customer Support Processing', 
    type: 'weekly',
    fileTargets: {
      weekly: 25000,
      dailyCapacity: 5000
    },
    rates: {
      ratePerFile: 0.08,
      currency: 'USD'
    },
    isAssigned: true,
    status: 'active'
  },
  { 
    id: '3', 
    name: 'Invoice Processing', 
    type: 'monthly',
    fileTargets: {
      monthly: 150000,
      dailyCapacity: 10000
    },
    rates: {
      ratePerFile: 0.12,
      currency: 'USD'
    },
    isAssigned: false,
    status: 'completed'
  }
];

const mockDailyCounts: DailyCount[] = [
  {
    id: '1',
    userId: '3',
    userName: 'Sarah Johnson',
    projectId: '1',
    projectName: 'MO Project - Data Processing',
    date: '2024-01-15',
    targetFileCount: 20000,
    submittedFileCount: 18500,
    completedFileCount: 18500,
    balanceFileCount: 1500,
    targetCount: 20000,
    submittedCount: 18500,
    status: 'submitted',
    notes: 'Completed data processing files for the day. System was slightly slow in the afternoon.',
    submittedAt: '2024-01-15 20:00',
    autoSubmittedAt: '2024-01-15 20:00'
  },
  {
    id: '2',
    userId: '4',
    userName: 'Mike Davis',
    projectId: '1',
    projectName: 'MO Project - Data Processing',
    date: '2024-01-15',
    targetFileCount: 20000,
    submittedFileCount: 19200,
    completedFileCount: 19200,
    balanceFileCount: 800,
    targetCount: 20000,
    submittedCount: 19200,
    status: 'approved',
    notes: 'Good progress today. All files processed within quality standards.',
    submittedAt: '2024-01-15 20:00',
    autoSubmittedAt: '2024-01-15 20:00',
    approvedBy: 'John Smith'
  },
  {
    id: '3',
    userId: '3',
    userName: 'Sarah Johnson',
    projectId: '2',
    projectName: 'Customer Support Processing',
    date: '2024-01-15',
    targetFileCount: 5000,
    submittedFileCount: 0,
    completedFileCount: 3200,
    balanceFileCount: 1800,
    targetCount: 5000,
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
    projectName: 'Customer Support Processing',
    date: '2024-01-14',
    targetFileCount: 5000,
    submittedFileCount: 5420,
    completedFileCount: 5420,
    balanceFileCount: 0,
    targetCount: 5000,
    submittedCount: 5420,
    status: 'approved',
    notes: 'Exceeded target due to high ticket volume. Quality maintained.',
    submittedAt: '2024-01-14 20:00',
    autoSubmittedAt: '2024-01-14 20:00',
    approvedBy: 'Super Admin'
  }
];

export default function DailyCounts() {
  const { user: currentUser } = useAuth();
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>(mockDailyCounts);
  const [jobDailyUpdates, setJobDailyUpdates] = useState<JobDailyUpdate[]>(mockJobDailyUpdates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isJobSubmitDialogOpen, setIsJobSubmitDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date()
  });
  const [newSubmission, setNewSubmission] = useState({
    projectId: '',
    submittedFileCount: 0,
    completedFileCount: 0,
    notes: ''
  });
  const [newJobSubmission, setNewJobSubmission] = useState({
    jobId: '',
    completedFiles: 0,
    notes: ''
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-update settings (could come from settings/API)
  const autoUpdateTime = '20:00'; // 8 PM
  const autoUpdateTimezone = 'Asia/Kolkata';
  const autoUpdateEnabled = true;

  const today = format(new Date(), 'yyyy-MM-dd');
  const isUser = currentUser?.role === 'user';
  const canManageCounts = currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager';

  // Update current time every minute for auto-update check
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Check for auto-update time
  const isAutoUpdateTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const [targetHour, targetMinute] = autoUpdateTime.split(':').map(Number);
    
    return currentHour === targetHour && currentMinute === targetMinute;
  };

  // Filter counts based on user role and filters
  const filteredCounts = dailyCounts.filter(count => {
    const matchesSearch = count.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         count.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'all' || count.projectId === selectedProject;
    const matchesStatus = selectedStatus === 'all' || count.status === selectedStatus;
    
    if (isUser) {
      return matchesSearch && matchesProject && matchesStatus && count.userId === currentUser?.id;
    }
    
    return matchesSearch && matchesProject && matchesStatus;
  });

  // Get user's assigned projects
  const userProjects = mockProjects.filter(p => p.isAssigned && p.status === 'active');

  // Get today's submissions for current user
  const todaySubmissions = dailyCounts.filter(count => 
    count.date === today && count.userId === currentUser?.id
  );

  const handleSubmitCount = () => {
    const project = mockProjects.find(p => p.id === newSubmission.projectId);
    const submission: DailyCount = {
      id: (dailyCounts.length + 1).toString(),
      userId: currentUser?.id || '',
      userName: currentUser?.name || '',
      projectId: newSubmission.projectId,
      projectName: project?.name || '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      targetFileCount: project?.fileTargets.dailyCapacity || 0,
      submittedFileCount: newSubmission.submittedFileCount,
      completedFileCount: newSubmission.completedFileCount,
      balanceFileCount: (project?.fileTargets.dailyCapacity || 0) - newSubmission.completedFileCount,
      targetCount: project?.fileTargets.dailyCapacity || 0,
      submittedCount: newSubmission.submittedFileCount,
      status: 'submitted',
      notes: newSubmission.notes,
      submittedAt: new Date().toISOString()
    };
    
    setDailyCounts([...dailyCounts, submission]);
    setNewSubmission({ projectId: '', submittedFileCount: 0, completedFileCount: 0, notes: '' });
    setIsSubmitDialogOpen(false);
  };

  const handleApproveCount = (countId: string) => {
    setDailyCounts(dailyCounts.map(count =>
      count.id === countId
        ? { ...count, status: 'approved' as const, approvedBy: currentUser?.name }
        : count
    ));
  };

  const handleRejectCount = (countId: string, reason: string) => {
    setDailyCounts(dailyCounts.map(count =>
      count.id === countId
        ? { ...count, status: 'rejected' as const, approvedBy: currentUser?.name, rejectionReason: reason }
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

  const getProgressColor = (completed: number, target: number) => {
    const percentage = (completed / target) * 100;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const calculateStats = () => {
    const todayCounts = dailyCounts.filter(count => count.date === today);
    const totalTargetFiles = todayCounts.reduce((sum, count) => sum + count.targetFileCount, 0);
    const totalSubmittedFiles = todayCounts.reduce((sum, count) => sum + count.submittedFileCount, 0);
    const totalCompletedFiles = todayCounts.reduce((sum, count) => sum + count.completedFileCount, 0);
    const totalBalanceFiles = todayCounts.reduce((sum, count) => sum + count.balanceFileCount, 0);
    const pendingSubmissions = todayCounts.filter(count => count.status === 'pending').length;
    const approvedToday = todayCounts.filter(count => count.status === 'approved').length;

    return { 
      totalTargetFiles, 
      totalSubmittedFiles, 
      totalCompletedFiles,
      totalBalanceFiles,
      pendingSubmissions, 
      approvedToday 
    };
  };

  const calculateEarnings = (fileCount: number, ratePerFile: number) => {
    const usdAmount = fileCount * ratePerFile;
    const inrAmount = usdAmount * 83; // Assuming 1 USD = 83 INR
    return { usd: usdAmount, inr: inrAmount };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily File Counts</h1>
          <p className="text-muted-foreground mt-1">
            Track daily file processing progress with automatic updates at {autoUpdateTime} IST.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Auto-update status indicator */}
          {autoUpdateEnabled && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Auto-update: {autoUpdateTime} IST
            </Badge>
          )}
          {isUser && (
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Count
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Submit Daily File Count</DialogTitle>
                  <DialogDescription>
                    Submit your file processing count for today or a specific date.
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="submit" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="submit">Submit Count</TabsTrigger>
                    <TabsTrigger value="details">File Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="submit" className="space-y-4">
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
                      <Select value={newSubmission.projectId} onValueChange={(value) => {
                        const project = mockProjects.find(p => p.id === value);
                        setNewSubmission({ 
                          ...newSubmission, 
                          projectId: value,
                          completedFileCount: 0,
                          submittedFileCount: 0
                        });
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {userProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div className="flex flex-col">
                                <span>{project.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Daily Capacity: {project.fileTargets.dailyCapacity.toLocaleString()} files
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="completedFiles">Files Completed</Label>
                        <Input
                          id="completedFiles"
                          type="number"
                          value={newSubmission.completedFileCount}
                          onChange={(e) => setNewSubmission({ 
                            ...newSubmission, 
                            completedFileCount: parseInt(e.target.value) || 0 
                          })}
                          placeholder="e.g., 18500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="submittedFiles">Files Submitted</Label>
                        <Input
                          id="submittedFiles"
                          type="number"
                          value={newSubmission.submittedFileCount}
                          onChange={(e) => setNewSubmission({ 
                            ...newSubmission, 
                            submittedFileCount: parseInt(e.target.value) || 0 
                          })}
                          placeholder="e.g., 18500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={newSubmission.notes}
                        onChange={(e) => setNewSubmission({ ...newSubmission, notes: e.target.value })}
                        placeholder="Add any notes about today's work..."
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details" className="space-y-4">
                    {newSubmission.projectId ? (() => {
                      const project = mockProjects.find(p => p.id === newSubmission.projectId);
                      const earnings = calculateEarnings(newSubmission.completedFileCount, project?.rates.ratePerFile || 0);
                      const balanceFiles = (project?.fileTargets.dailyCapacity || 0) - newSubmission.completedFileCount;
                      
                      return (
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg space-y-3">
                            <h4 className="font-medium">Project: {project?.name}</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Daily Capacity</div>
                                <div className="font-medium">{project?.fileTargets.dailyCapacity.toLocaleString()} files</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Rate per File</div>
                                <div className="font-medium">${project?.rates.ratePerFile}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Files Completed</div>
                                <div className="font-medium">{newSubmission.completedFileCount.toLocaleString()} files</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Balance Files</div>
                                <div className={`font-medium ${balanceFiles > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {balanceFiles.toLocaleString()} files
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Earnings (USD)</div>
                                <div className="font-medium text-green-600">${earnings.usd.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Earnings (INR)</div>
                                <div className="font-medium text-blue-600">₹{earnings.inr.toFixed(0)}</div>
                              </div>
                            </div>
                            <Progress 
                              value={(newSubmission.completedFileCount / (project?.fileTargets.dailyCapacity || 1)) * 100} 
                              className="h-2"
                            />
                          </div>
                        </div>
                      );
                    })() : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Please select a project first to see file details.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>
                </Tabs>
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Files</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTargetFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Today's capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompletedFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTargetFiles > 0 ? `${((stats.totalCompletedFiles / stats.totalTargetFiles) * 100).toFixed(1)}% of target` : 'No target'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmittedFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Files submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Minus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBalanceFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Files remaining</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-update Alert */}
      {autoUpdateEnabled && isAutoUpdateTime() && (
        <Alert>
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Automatic daily update is scheduled for {autoUpdateTime} IST. Make sure to submit your counts before this time.
          </AlertDescription>
        </Alert>
      )}

      {/* Today's Progress for Users */}
      {isUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Today's File Processing Progress
            </CardTitle>
            <CardDescription>Your assigned projects and daily file targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userProjects.map((project) => {
                const todayCount = todaySubmissions.find(ts => ts.projectId === project.id);
                const completedFiles = todayCount?.completedFileCount || 0;
                const targetFiles = project.fileTargets.dailyCapacity;
                const balanceFiles = targetFiles - completedFiles;
                const progress = (completedFiles / targetFiles) * 100;
                const earnings = calculateEarnings(completedFiles, project.rates.ratePerFile);
                
                return (
                  <div key={project.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <div className="text-sm text-muted-foreground">
                          {project.type === 'both' ? 'Monthly + Weekly' : 
                           project.type === 'monthly' ? 'Monthly Project' : 'Weekly Project'}
                        </div>
                      </div>
                      {todayCount && (
                        <Badge className={getStatusBadgeColor(todayCount.status)}>
                          {todayCount.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Daily Target</div>
                        <div className="font-medium">{targetFiles.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Completed</div>
                        <div className={`font-medium ${getProgressColor(completedFiles, targetFiles)}`}>
                          {completedFiles.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Balance</div>
                        <div className={`font-medium ${balanceFiles > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {balanceFiles.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Earnings</div>
                        <div className="font-medium text-green-600">${earnings.usd.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className={getProgressColor(completedFiles, targetFiles)}>
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                    
                    {!todayCount && (
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setNewSubmission({ 
                              ...newSubmission, 
                              projectId: project.id,
                              completedFileCount: 0,
                              submittedFileCount: 0
                            });
                            setIsSubmitDialogOpen(true);
                          }}
                        >
                          Submit Count
                        </Button>
                      </div>
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
              <SelectTrigger className="w-full sm:w-[200px]">
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
            <span>Daily File Counts ({filteredCounts.length})</span>
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
            Track daily file processing counts with automatic submissions at {autoUpdateTime} IST.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User & Project</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>File Progress</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Status & Time</TableHead>
                {canManageCounts && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCounts.map((count) => {
                const project = mockProjects.find(p => p.id === count.projectId);
                const earnings = calculateEarnings(count.completedFileCount, project?.rates.ratePerFile || 0);
                
                return (
                  <TableRow key={count.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{count.userName}</div>
                        <div className="text-sm text-muted-foreground">{count.projectName}</div>
                        {count.notes && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {count.notes.length > 60 ? `${count.notes.substring(0, 60)}...` : count.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                        {new Date(count.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-muted-foreground">Target</div>
                            <div className="font-medium">{count.targetFileCount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Completed</div>
                            <div className="font-medium text-green-600">{count.completedFileCount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Balance</div>
                            <div className={`font-medium ${count.balanceFileCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              {count.balanceFileCount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Progress 
                          value={(count.completedFileCount / count.targetFileCount) * 100} 
                          className="h-2"
                        />
                        <div className={`text-xs ${getProgressColor(count.completedFileCount, count.targetFileCount)}`}>
                          {count.targetFileCount > 0 ? `${((count.completedFileCount / count.targetFileCount) * 100).toFixed(1)}%` : '0%'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-green-600">${earnings.usd.toFixed(2)}</div>
                        <div className="text-xs text-blue-600">₹{earnings.inr.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">
                          @${project?.rates.ratePerFile}/file
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getStatusBadgeColor(count.status)}>
                          {count.status.toUpperCase()}
                        </Badge>
                        {count.autoSubmittedAt && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="h-3 w-3" />
                            Auto-submitted
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {count.submittedAt ? new Date(count.submittedAt).toLocaleString() : '-'}
                        </div>
                        {count.approvedBy && (
                          <div className="text-xs text-muted-foreground">
                            by {count.approvedBy}
                          </div>
                        )}
                      </div>
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
                              onClick={() => handleRejectCount(count.id, 'Requires review')}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
