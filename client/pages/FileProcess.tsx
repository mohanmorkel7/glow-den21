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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  FileText,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Users,
  Bot,
  Play,
  Pause,
  StopCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

interface FileProcessingJob {
  id: string;
  name: string;
  type: 'mo_monthly' | 'mo_weekly';
  description?: string;
  totalFileCount: number;
  completedFileCount: number;
  ratePerFile: number;
  totalValue: number;
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  assignmentType: 'automation' | 'manual';
  assignedUsers: string[];
  automationSettings?: {
    dailyCapacity: number;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: number[];
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  progress: number;
  estimatedCompletionDate?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserJobAssignment {
  userId: string;
  userName: string;
  jobId: string;
  jobName: string;
  assignedFileCount: number;
  completedFileCount: number;
  lastUpdated: string;
}

interface FileCountUpdate {
  jobId: string;
  completedCount: number;
  notes?: string;
}

const mockUsers: User[] = [
  { id: '2', name: 'John Smith', email: 'john.smith@websyntactic.com', role: 'project_manager' },
  { id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@websyntactic.com', role: 'user' },
  { id: '4', name: 'Mike Davis', email: 'mike.davis@websyntactic.com', role: 'user' },
  { id: '5', name: 'Emily Wilson', email: 'emily.wilson@websyntactic.com', role: 'project_manager' },
  { id: '6', name: 'David Chen', email: 'david.chen@websyntactic.com', role: 'user' }
];

const mockJobs: FileProcessingJob[] = [
  {
    id: '1',
    name: 'MO Monthly Batch #2024-001',
    type: 'mo_monthly',
    description: 'Monthly processing batch for Q1 2024',
    totalFileCount: 300000,
    completedFileCount: 187500,
    ratePerFile: 0.008,
    totalValue: 2400.00,
    startDate: '2024-01-01',
    targetEndDate: '2024-01-31',
    assignmentType: 'manual',
    assignedUsers: ['3', '4', '6'],
    status: 'active',
    progress: 62.5,
    estimatedCompletionDate: '2024-01-28',
    createdBy: {
      id: '1',
      name: 'Super Admin'
    },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'MO Weekly Batch #2024-W03',
    type: 'mo_weekly',
    description: 'Week 3 processing batch',
    totalFileCount: 75000,
    completedFileCount: 68200,
    ratePerFile: 0.008,
    totalValue: 600.00,
    startDate: '2024-01-15',
    targetEndDate: '2024-01-21',
    assignmentType: 'automation',
    assignedUsers: [],
    automationSettings: {
      dailyCapacity: 12000,
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      workingDays: [1, 2, 3, 4, 5] // Monday to Friday
    },
    status: 'active',
    progress: 91.0,
    estimatedCompletionDate: '2024-01-20',
    createdBy: {
      id: '2',
      name: 'John Smith'
    },
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'MO Monthly Batch #2023-012',
    type: 'mo_monthly',
    description: 'December 2023 processing batch',
    totalFileCount: 250000,
    completedFileCount: 250000,
    ratePerFile: 0.008,
    totalValue: 2000.00,
    startDate: '2023-12-01',
    targetEndDate: '2023-12-31',
    actualEndDate: '2023-12-30',
    assignmentType: 'manual',
    assignedUsers: ['3', '4'],
    status: 'completed',
    progress: 100,
    createdBy: {
      id: '1',
      name: 'Super Admin'
    },
    createdAt: '2023-12-01T00:00:00Z'
  }
];

export default function FileProcess() {
  const { user: currentUser } = useAuth();
  const [jobs, setJobs] = useState<FileProcessingJob[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<FileProcessingJob | null>(null);
  const [newJob, setNewJob] = useState({
    name: '',
    type: 'mo_monthly' as 'mo_monthly' | 'mo_weekly',
    description: '',
    totalFileCount: 0,
    targetEndDate: '',
    assignmentType: 'manual' as 'automation' | 'manual',
    assignedUsers: [] as string[],
    automationSettings: {
      dailyCapacity: 15000,
      workingHours: {
        start: '09:00',
        end: '18:00'
      },
      workingDays: [1, 2, 3, 4, 5]
    }
  });

  const canManageJobs = currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager';

  // Filter jobs based on user role and filters
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || job.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    
    // Users can only see jobs they're assigned to (if manual) or all automation jobs
    if (currentUser?.role === 'user') {
      const isAssigned = job.assignmentType === 'automation' || job.assignedUsers.includes(currentUser.id);
      return matchesSearch && matchesType && matchesStatus && isAssigned;
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateJob = () => {
    const ratePerFile = 0.008; // $0.008 per file for both MO projects
    const totalValue = newJob.totalFileCount * ratePerFile;
    
    const job: FileProcessingJob = {
      id: (jobs.length + 1).toString(),
      ...newJob,
      ratePerFile,
      totalValue,
      completedFileCount: 0,
      startDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      progress: 0,
      createdBy: {
        id: currentUser?.id || '',
        name: currentUser?.name || 'Unknown'
      },
      createdAt: new Date().toISOString()
    };
    
    setJobs([...jobs, job]);
    resetNewJob();
    setIsCreateDialogOpen(false);
  };

  const resetNewJob = () => {
    setNewJob({
      name: '',
      type: 'mo_monthly',
      description: '',
      totalFileCount: 0,
      targetEndDate: '',
      assignmentType: 'manual',
      assignedUsers: [],
      automationSettings: {
        dailyCapacity: 15000,
        workingHours: {
          start: '09:00',
          end: '18:00'
        },
        workingDays: [1, 2, 3, 4, 5]
      }
    });
  };

  const handleStartJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { ...job, status: 'active' as const, startDate: new Date().toISOString().split('T')[0] }
        : job
    ));
  };

  const handlePauseJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId 
        ? { ...job, status: 'paused' as const }
        : job
    ));
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter(job => job.id !== jobId));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'mo_monthly': return 'MO Monthly';
      case 'mo_weekly': return 'MO Weekly';
      default: return type;
    }
  };

  const calculateDailyTarget = (job: FileProcessingJob) => {
    if (job.status === 'completed') return 0;
    
    const today = new Date();
    const endDate = new Date(job.targetEndDate);
    const remainingDays = Math.max(1, differenceInDays(endDate, today));
    const remainingFiles = job.totalFileCount - job.completedFileCount;
    
    return Math.ceil(remainingFiles / remainingDays);
  };

  const getDaysRemaining = (targetEndDate: string) => {
    const today = new Date();
    const endDate = new Date(targetEndDate);
    return Math.max(0, differenceInDays(endDate, today));
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateStats = () => {
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalValue = jobs.reduce((sum, job) => sum + job.totalValue, 0);
    const completedValue = jobs.reduce((sum, job) => sum + (job.completedFileCount * job.ratePerFile), 0);
    const totalFiles = jobs.reduce((sum, job) => sum + job.totalFileCount, 0);
    const completedFiles = jobs.reduce((sum, job) => sum + job.completedFileCount, 0);
    
    return { activeJobs, totalValue, completedValue, totalFiles, completedFiles };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">File Process Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage MO project file processing jobs with automated tracking and user assignments.
          </p>
        </div>
        {canManageJobs && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create File Processing Job</DialogTitle>
                <DialogDescription>
                  Set up a new MO project batch with file count, deadline, and assignments.
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="assignment">Assignment</TabsTrigger>
                  <TabsTrigger value="automation">Automation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobName">Job Name</Label>
                    <Input
                      id="jobName"
                      value={newJob.name}
                      onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                      placeholder="e.g., MO Monthly Batch #2024-002"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobType">Project Type</Label>
                    <Select value={newJob.type} onValueChange={(value: any) => setNewJob({ ...newJob, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mo_monthly">MO Monthly</SelectItem>
                        <SelectItem value="mo_weekly">MO Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="Describe this processing batch"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fileCount">Total File Count</Label>
                      <Input
                        id="fileCount"
                        type="number"
                        value={newJob.totalFileCount}
                        onChange={(e) => setNewJob({ ...newJob, totalFileCount: parseInt(e.target.value) || 0 })}
                        placeholder="e.g., 300000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetEndDate">Target End Date</Label>
                      <Input
                        id="targetEndDate"
                        type="date"
                        value={newJob.targetEndDate}
                        onChange={(e) => setNewJob({ ...newJob, targetEndDate: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="assignment" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Assignment Type</Label>
                      <Select value={newJob.assignmentType} onValueChange={(value: any) => setNewJob({ ...newJob, assignmentType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>Manual Assignment</span>
                                <span className="text-xs text-muted-foreground">Assign to specific users</span>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="automation">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>Automation</span>
                                <span className="text-xs text-muted-foreground">Automated processing</span>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newJob.assignmentType === 'manual' && (
                      <div className="space-y-2">
                        <Label>Assign Users</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                          {mockUsers.map((user) => (
                            <div key={user.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={user.id}
                                checked={newJob.assignedUsers.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewJob({
                                      ...newJob,
                                      assignedUsers: [...newJob.assignedUsers, user.id]
                                    });
                                  } else {
                                    setNewJob({
                                      ...newJob,
                                      assignedUsers: newJob.assignedUsers.filter(id => id !== user.id)
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={user.id} className="text-sm font-normal cursor-pointer">
                                <div className="flex flex-col">
                                  <span>{user.name}</span>
                                  <span className="text-xs text-muted-foreground">{user.role} • {user.email}</span>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                        {newJob.assignedUsers.length > 0 && newJob.totalFileCount > 0 && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>Files per user:</strong> {Math.ceil(newJob.totalFileCount / newJob.assignedUsers.length).toLocaleString()} files
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="automation" className="space-y-4">
                  {newJob.assignmentType === 'automation' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyCapacity">Daily Processing Capacity</Label>
                        <Input
                          id="dailyCapacity"
                          type="number"
                          value={newJob.automationSettings.dailyCapacity}
                          onChange={(e) => setNewJob({
                            ...newJob,
                            automationSettings: {
                              ...newJob.automationSettings,
                              dailyCapacity: parseInt(e.target.value) || 0
                            }
                          })}
                          placeholder="e.g., 15000"
                        />
                        <p className="text-xs text-muted-foreground">
                          Number of files that can be processed per day
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Working Hours Start</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={newJob.automationSettings.workingHours.start}
                            onChange={(e) => setNewJob({
                              ...newJob,
                              automationSettings: {
                                ...newJob.automationSettings,
                                workingHours: {
                                  ...newJob.automationSettings.workingHours,
                                  start: e.target.value
                                }
                              }
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime">Working Hours End</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={newJob.automationSettings.workingHours.end}
                            onChange={(e) => setNewJob({
                              ...newJob,
                              automationSettings: {
                                ...newJob.automationSettings,
                                workingHours: {
                                  ...newJob.automationSettings.workingHours,
                                  end: e.target.value
                                }
                              }
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Working Days</Label>
                        <div className="grid grid-cols-7 gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <div key={day} className="flex items-center space-x-1">
                              <Checkbox
                                id={`day-${index}`}
                                checked={newJob.automationSettings.workingDays.includes(index)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewJob({
                                      ...newJob,
                                      automationSettings: {
                                        ...newJob.automationSettings,
                                        workingDays: [...newJob.automationSettings.workingDays, index].sort()
                                      }
                                    });
                                  } else {
                                    setNewJob({
                                      ...newJob,
                                      automationSettings: {
                                        ...newJob.automationSettings,
                                        workingDays: newJob.automationSettings.workingDays.filter(d => d !== index)
                                      }
                                    });
                                  }
                                }}
                              />
                              <Label htmlFor={`day-${index}`} className="text-xs">
                                {day}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {newJob.totalFileCount > 0 && newJob.automationSettings.dailyCapacity > 0 && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-medium text-purple-900 mb-2">Automation Estimate</h4>
                          <div className="space-y-1 text-sm text-purple-700">
                            <div className="flex justify-between">
                              <span>Estimated completion:</span>
                              <span>{Math.ceil(newJob.totalFileCount / newJob.automationSettings.dailyCapacity)} working days</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Processing hours per day:</span>
                              <span>{newJob.automationSettings.workingHours.start} - {newJob.automationSettings.workingHours.end}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Working days:</span>
                              <span>{newJob.automationSettings.workingDays.length} days/week</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert>
                      <Bot className="h-4 w-4" />
                      <AlertDescription>
                        Automation settings are only available when Assignment Type is set to "Automation". 
                        Switch to the Assignment tab to change the assignment type.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetNewJob(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob} disabled={!newJob.name || !newJob.totalFileCount || !newJob.targetEndDate}>
                  Create Job
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all jobs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Files</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFiles > 0 ? `${((stats.completedFiles / stats.totalFiles) * 100).toFixed(1)}% complete` : '0% complete'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">All jobs combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earned Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.completedValue)}</div>
            <p className="text-xs text-muted-foreground">Completed work</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="mo_monthly">MO Monthly</SelectItem>
                <SelectItem value="mo_weekly">MO Weekly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>File Processing Jobs ({filteredJobs.length})</CardTitle>
          <CardDescription>
            Manage MO project file processing jobs with progress tracking and assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Details</TableHead>
                <TableHead>Progress & Files</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                {canManageJobs && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => {
                const dailyTarget = calculateDailyTarget(job);
                const daysRemaining = getDaysRemaining(job.targetEndDate);
                const earnedValue = job.completedFileCount * job.ratePerFile;
                
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{job.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {getTypeDisplayName(job.type)}
                        </div>
                        {job.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {job.description.length > 50 ? `${job.description.substring(0, 50)}...` : job.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{job.completedFileCount.toLocaleString()} / {job.totalFileCount.toLocaleString()}</span>
                          <span className="text-muted-foreground">{job.progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                        {job.status === 'active' && (
                          <div className="text-xs text-muted-foreground">
                            Daily target: {dailyTarget.toLocaleString()} files
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {job.assignmentType === 'automation' ? (
                          <div className="flex items-center gap-1">
                            <Bot className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Automation</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{job.assignedUsers.length} users</span>
                          </div>
                        )}
                      </div>
                      {job.assignmentType === 'automation' && job.automationSettings && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {job.automationSettings.dailyCapacity.toLocaleString()}/day capacity
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                          {new Date(job.targetEndDate).toLocaleDateString()}
                        </div>
                        {job.status === 'active' && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                          </div>
                        )}
                        {job.status === 'completed' && job.actualEndDate && (
                          <div className="text-xs text-green-600 mt-1">
                            Completed: {new Date(job.actualEndDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-green-600">{formatCurrency(earnedValue)}</div>
                        <div className="text-xs text-muted-foreground">
                          of {formatCurrency(job.totalValue)}
                        </div>
                        <div className="text-xs text-blue-600">
                          ₹{(earnedValue * 83).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(job.status)}>
                        {job.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    {canManageJobs && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {job.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStartJob(job.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Start Job
                              </DropdownMenuItem>
                            )}
                            {job.status === 'active' && (
                              <DropdownMenuItem onClick={() => handlePauseJob(job.id)}>
                                <Pause className="mr-2 h-4 w-4" />
                                Pause Job
                              </DropdownMenuItem>
                            )}
                            {job.status === 'paused' && (
                              <DropdownMenuItem onClick={() => handleStartJob(job.id)}>
                                <Play className="mr-2 h-4 w-4" />
                                Resume Job
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Job
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteJob(job.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
