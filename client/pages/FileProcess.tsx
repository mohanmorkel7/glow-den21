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
  Upload,
  BarChart3
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

interface FileAllocation {
  id: string;
  fileName: string;
  uploadDate: string;
  totalRecords: number;
  recordsPerUser: number;
  availableRecords: number;
  allocatedRecords: number;
  status: 'uploaded' | 'allocating' | 'allocated' | 'completed';
  uploadedBy: {
    id: string;
    name: string;
  };
}

interface UserFileRequest {
  id: string;
  userId: string;
  userName: string;
  allocationId: string;
  requestedCount: number;
  requestedDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'downloaded' | 'completed';
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedDate?: string;
  downloadLink?: string;
  taskId?: string;
  completedDate?: string;
  notes?: string;
}

interface FileTask {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  fileName: string;
  recordCount: number;
  assignedDate: string;
  dueDate: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  completedDate?: string;
  completedCount?: number;
  notes?: string;
}

interface AllocationAnalytics {
  totalFiles: number;
  totalRecords: number;
  completedRecords: number;
  activeUsers: number;
  averageCompletion: number;
  dailyProgress: {
    date: string;
    completed: number;
    assigned: number;
  }[];
  userProgress: {
    userId: string;
    userName: string;
    assigned: number;
    completed: number;
    inProgress: number;
  }[];
}

const mockUsers: User[] = [
  { id: '2', name: 'John Smith', email: 'john.smith@websyntactic.com', role: 'project_manager' },
  { id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@websyntactic.com', role: 'user' },
  { id: '4', name: 'Mike Davis', email: 'mike.davis@websyntactic.com', role: 'user' },
  { id: '5', name: 'Emily Wilson', email: 'emily.wilson@websyntactic.com', role: 'project_manager' },
  { id: '6', name: 'David Chen', email: 'david.chen@websyntactic.com', role: 'user' }
];

const mockUserAssignments: UserJobAssignment[] = [
  {
    userId: '3',
    userName: 'Sarah Johnson',
    jobId: '1',
    jobName: 'MO Monthly Batch #2024-001',
    assignedFileCount: 100000,
    completedFileCount: 62500,
    lastUpdated: '2024-01-20T14:30:00Z'
  },
  {
    userId: '4',
    userName: 'Mike Davis',
    jobId: '1',
    jobName: 'MO Monthly Batch #2024-001',
    assignedFileCount: 100000,
    completedFileCount: 62500,
    lastUpdated: '2024-01-20T16:45:00Z'
  },
  {
    userId: '6',
    userName: 'David Chen',
    jobId: '1',
    jobName: 'MO Monthly Batch #2024-001',
    assignedFileCount: 100000,
    completedFileCount: 62500,
    lastUpdated: '2024-01-20T15:20:00Z'
  },
  {
    userId: '3',
    userName: 'Sarah Johnson',
    jobId: '3',
    jobName: 'MO Monthly Batch #2023-012',
    assignedFileCount: 125000,
    completedFileCount: 125000,
    lastUpdated: '2023-12-30T18:00:00Z'
  },
  {
    userId: '4',
    userName: 'Mike Davis',
    jobId: '3',
    jobName: 'MO Monthly Batch #2023-012',
    assignedFileCount: 125000,
    completedFileCount: 125000,
    lastUpdated: '2023-12-30T17:30:00Z'
  }
];

const mockFileAllocations: FileAllocation[] = [
  {
    id: '1',
    fileName: 'customer_data_2024_01_20.xlsx',
    uploadDate: '2024-01-20T09:00:00Z',
    totalRecords: 300000,
    recordsPerUser: 800,
    availableRecords: 276000,
    allocatedRecords: 24000,
    status: 'allocating',
    uploadedBy: {
      id: '2',
      name: 'John Smith'
    }
  },
  {
    id: '2',
    fileName: 'invoice_processing_2024_01_19.csv',
    uploadDate: '2024-01-19T08:30:00Z',
    totalRecords: 300000,
    recordsPerUser: 600,
    availableRecords: 0,
    allocatedRecords: 300000,
    status: 'allocated',
    uploadedBy: {
      id: '5',
      name: 'Emily Wilson'
    }
  }
];

const mockUserRequests: UserFileRequest[] = [
  {
    id: '1',
    userId: '3',
    userName: 'Sarah Johnson',
    allocationId: '1',
    requestedCount: 800,
    requestedDate: '2024-01-20T10:30:00Z',
    status: 'approved',
    approvedBy: {
      id: '2',
      name: 'John Smith'
    },
    approvedDate: '2024-01-20T11:00:00Z',
    downloadLink: '/downloads/sarah_johnson_20-01-2024_set1.xlsx',
    taskId: 'task_1'
  },
  {
    id: '2',
    userId: '4',
    userName: 'Mike Davis',
    allocationId: '1',
    requestedCount: 600,
    requestedDate: '2024-01-20T11:15:00Z',
    status: 'pending'
  },
  {
    id: '3',
    userId: '6',
    userName: 'David Chen',
    allocationId: '2',
    requestedCount: 600,
    requestedDate: '2024-01-19T14:20:00Z',
    status: 'completed',
    approvedBy: {
      id: '5',
      name: 'Emily Wilson'
    },
    approvedDate: '2024-01-19T15:00:00Z',
    downloadLink: '/downloads/david_chen_19-01-2024_set1.xlsx',
    taskId: 'task_2',
    completedDate: '2024-01-19T18:30:00Z'
  }
];

const mockFileTasks: FileTask[] = [
  {
    id: 'task_1',
    requestId: '1',
    userId: '3',
    userName: 'Sarah Johnson',
    fileName: 'sarah_johnson_20-01-2024_set1.xlsx',
    recordCount: 800,
    assignedDate: '2024-01-20T11:00:00Z',
    dueDate: '2024-01-21T18:00:00Z',
    status: 'in_progress',
    completedCount: 450
  },
  {
    id: 'task_2',
    requestId: '3',
    userId: '6',
    userName: 'David Chen',
    fileName: 'david_chen_19-01-2024_set1.xlsx',
    recordCount: 600,
    assignedDate: '2024-01-19T15:00:00Z',
    dueDate: '2024-01-20T18:00:00Z',
    status: 'completed',
    completedDate: '2024-01-19T18:30:00Z',
    completedCount: 600
  }
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

// File Allocation Component
function FileAllocationTab() {
  const { user: currentUser } = useAuth();
  const [fileAllocations, setFileAllocations] = useState<FileAllocation[]>(mockFileAllocations);
  const [userRequests, setUserRequests] = useState<UserFileRequest[]>(mockUserRequests);
  const [fileTasks, setFileTasks] = useState<FileTask[]>(mockFileTasks);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<FileAllocation | null>(null);
  const [requestCount, setRequestCount] = useState(500);
  const [uploadFile, setUploadFile] = useState<{
    fileName: string;
    totalRecords: number;
    recordsPerUser: number;
  }>({
    fileName: '',
    totalRecords: 0,
    recordsPerUser: 800
  });

  const canManageAllocations = currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager';

  const handleFileUpload = () => {
    const newAllocation: FileAllocation = {
      id: (fileAllocations.length + 1).toString(),
      fileName: uploadFile.fileName,
      uploadDate: new Date().toISOString(),
      totalRecords: uploadFile.totalRecords,
      recordsPerUser: uploadFile.recordsPerUser,
      availableRecords: uploadFile.totalRecords,
      allocatedRecords: 0,
      status: 'uploaded',
      uploadedBy: {
        id: currentUser?.id || '',
        name: currentUser?.name || 'Unknown'
      }
    };

    setFileAllocations([newAllocation, ...fileAllocations]);
    setUploadFile({ fileName: '', totalRecords: 0, recordsPerUser: 800 });
    setIsUploadDialogOpen(false);
  };

  const handleRequestFile = () => {
    if (!selectedAllocation) return;

    const newRequest: UserFileRequest = {
      id: (userRequests.length + 1).toString(),
      userId: currentUser?.id || '',
      userName: currentUser?.name || 'Unknown',
      allocationId: selectedAllocation.id,
      requestedCount: requestCount,
      requestedDate: new Date().toISOString(),
      status: 'pending'
    };

    setUserRequests([newRequest, ...userRequests]);
    setIsRequestDialogOpen(false);
    setSelectedAllocation(null);
    setRequestCount(500);
  };

  const handleApproveRequest = (requestId: string) => {
    const request = userRequests.find(r => r.id === requestId);
    if (!request) return;

    const fileName = `${request.userName.toLowerCase().replace(' ', '_')}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}_set1.xlsx`;

    setUserRequests(userRequests.map(r =>
      r.id === requestId
        ? {
            ...r,
            status: 'approved',
            approvedBy: {
              id: currentUser?.id || '',
              name: currentUser?.name || 'Unknown'
            },
            approvedDate: new Date().toISOString(),
            downloadLink: `/downloads/${fileName}`,
            taskId: `task_${Date.now()}`
          }
        : r
    ));

    // Create task
    const newTask: FileTask = {
      id: `task_${Date.now()}`,
      requestId,
      userId: request.userId,
      userName: request.userName,
      fileName,
      recordCount: request.requestedCount,
      assignedDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      status: 'assigned',
      completedCount: 0
    };

    setFileTasks([newTask, ...fileTasks]);

    // Update allocation
    setFileAllocations(fileAllocations.map(alloc =>
      alloc.id === request.allocationId
        ? {
            ...alloc,
            availableRecords: alloc.availableRecords - request.requestedCount,
            allocatedRecords: alloc.allocatedRecords + request.requestedCount
          }
        : alloc
    ));
  };

  const getUserRequests = () => {
    if (currentUser?.role === 'user') {
      return userRequests.filter(req => req.userId === currentUser.id);
    }
    return userRequests;
  };

  const getUserTasks = () => {
    if (currentUser?.role === 'user') {
      return fileTasks.filter(task => task.userId === currentUser.id);
    }
    return fileTasks;
  };

  return (
    <div className="space-y-6">
      {/* Analytics Dashboard for Managers */}
      {canManageAllocations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Dashboard
            </CardTitle>
            <CardDescription>
              Track file allocation progress and user performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {fileAllocations.reduce((sum, alloc) => sum + alloc.totalRecords, 0).toLocaleString()}
                </div>
                <div className="text-sm text-blue-700">Total Records</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {fileTasks.filter(task => task.status === 'completed').reduce((sum, task) => sum + task.recordCount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Completed Records</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {fileTasks.filter(task => task.status === 'in_progress').length}
                </div>
                <div className="text-sm text-orange-700">Active Tasks</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(fileTasks.map(task => task.userId)).size}
                </div>
                <div className="text-sm text-purple-700">Active Users</div>
              </div>
            </div>

            {/* User Performance Table */}
            <div className="mt-6">
              <h4 className="font-medium mb-4">User Performance Summary</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Total Assigned</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>In Progress</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.filter(user => user.role === 'user').map(user => {
                    const userTasks = fileTasks.filter(task => task.userId === user.id);
                    const completedTasks = userTasks.filter(task => task.status === 'completed');
                    const inProgressTasks = userTasks.filter(task => task.status === 'in_progress');
                    const totalAssigned = userTasks.reduce((sum, task) => sum + task.recordCount, 0);
                    const totalCompleted = completedTasks.reduce((sum, task) => sum + task.recordCount, 0);
                    const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{totalAssigned.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {totalCompleted.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          {inProgressTasks.reduce((sum, task) => sum + task.recordCount, 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              completionRate >= 80 ? 'text-green-600' :
                              completionRate >= 60 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {completionRate.toFixed(1)}%
                            </span>
                            <Progress value={completionRate} className="h-2 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            inProgressTasks.length > 0 ? 'bg-blue-100 text-blue-800' :
                            completedTasks.length > 0 ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {inProgressTasks.length > 0 ? 'Active' :
                             completedTasks.length > 0 ? 'Available' : 'Idle'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section for Managers */}
      {canManageAllocations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              File Upload & Management
            </CardTitle>
            <CardDescription>
              Upload Excel/CSV files for user allocation (300k records per file, 500-1000 per user)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload New File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Files for Users */}
      {currentUser?.role === 'user' && (
        <Card>
          <CardHeader>
            <CardTitle>Request File Allocation</CardTitle>
            <CardDescription>
              Request your daily file allocation from available uploads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fileAllocations.filter(alloc => alloc.availableRecords > 0).map(allocation => (
                <div key={allocation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{allocation.fileName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Available: {allocation.availableRecords.toLocaleString()} records
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedAllocation(allocation);
                        setIsRequestDialogOpen(true);
                      }}
                      disabled={allocation.availableRecords < 500}
                    >
                      Request Files
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Progress Tracking */}
      {currentUser?.role === 'user' && (
        <Card>
          <CardHeader>
            <CardTitle>My Active Tasks</CardTitle>
            <CardDescription>
              Track progress on your assigned file processing tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getUserTasks().filter(task => task.status !== 'completed').map(task => {
                const progress = task.completedCount ? (task.completedCount / task.recordCount) * 100 : 0;
                const isOverdue = new Date() > new Date(task.dueDate);

                return (
                  <Card key={task.id} className={`border-l-4 ${
                    isOverdue ? 'border-l-red-500' : 'border-l-blue-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{task.fileName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {task.recordCount.toLocaleString()} records assigned
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const completed = prompt(`Enter completed count (max ${task.recordCount}):`, task.completedCount?.toString() || '0');
                              if (completed && parseInt(completed) >= 0 && parseInt(completed) <= task.recordCount) {
                                const completedCount = parseInt(completed);
                                setFileTasks(fileTasks.map(t =>
                                  t.id === task.id
                                    ? {
                                        ...t,
                                        completedCount,
                                        status: completedCount >= task.recordCount ? 'completed' : 'in_progress',
                                        completedDate: completedCount >= task.recordCount ? new Date().toISOString() : undefined
                                      }
                                    : t
                                ));

                                // Update request status if task is completed
                                if (completedCount >= task.recordCount) {
                                  setUserRequests(userRequests.map(req =>
                                    req.id === task.requestId
                                      ? { ...req, status: 'completed', completedDate: new Date().toISOString() }
                                      : req
                                  ));
                                }
                              }
                            }}
                          >
                            Update Progress
                          </Button>
                          {task.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Progress</div>
                          <div className="font-medium">{progress.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                          <div className="font-medium text-green-600">{task.completedCount || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Due Date</div>
                          <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <Progress value={progress} className="h-2" />

                      {isOverdue && task.status !== 'completed' && (
                        <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Task is overdue
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {getUserTasks().filter(task => task.status !== 'completed').length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No active tasks</h3>
                  <p className="text-sm text-muted-foreground">Request file allocation to get started.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Requests & Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentUser?.role === 'user' ? 'My Requests & Tasks' : 'All User Requests'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {canManageAllocations && <TableHead>User</TableHead>}
                <TableHead>File</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getUserRequests().map(request => (
                <TableRow key={request.id}>
                  {canManageAllocations && (
                    <TableCell>{request.userName}</TableCell>
                  )}
                  <TableCell>
                    {fileAllocations.find(a => a.id === request.allocationId)?.fileName || 'Unknown'}
                  </TableCell>
                  <TableCell>{request.requestedCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={
                      request.status === 'completed' ? 'bg-green-100 text-green-800' :
                      request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {request.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.requestedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && canManageAllocations && (
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {request.status === 'approved' && request.downloadLink && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File for Allocation</DialogTitle>
            <DialogDescription>
              Upload Excel/CSV file with customer data for user allocation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={uploadFile.fileName}
                onChange={(e) => setUploadFile({ ...uploadFile, fileName: e.target.value })}
                placeholder="customer_data_2024_01_21.xlsx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalRecords">Total Records</Label>
              <Input
                id="totalRecords"
                type="number"
                value={uploadFile.totalRecords}
                onChange={(e) => setUploadFile({ ...uploadFile, totalRecords: parseInt(e.target.value) || 0 })}
                placeholder="300000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recordsPerUser">Records Per User (500-1000)</Label>
              <Input
                id="recordsPerUser"
                type="number"
                min="500"
                max="1000"
                value={uploadFile.recordsPerUser}
                onChange={(e) => setUploadFile({ ...uploadFile, recordsPerUser: parseInt(e.target.value) || 800 })}
                placeholder="800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFileUpload}>
              Upload File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request File Allocation</DialogTitle>
            <DialogDescription>
              Request your daily allocation from {selectedAllocation?.fileName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Available Records</Label>
              <div className="text-2xl font-bold text-green-600">
                {selectedAllocation?.availableRecords.toLocaleString()}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestCount">Request Count (500-1000)</Label>
              <Input
                id="requestCount"
                type="number"
                min="500"
                max={Math.min(1000, selectedAllocation?.availableRecords || 0)}
                value={requestCount}
                onChange={(e) => setRequestCount(parseInt(e.target.value) || 500)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestFile}>
              Request Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FileProcess() {
  const { user: currentUser } = useAuth();
  const [jobs, setJobs] = useState<FileProcessingJob[]>(mockJobs);
  const [userAssignments, setUserAssignments] = useState<UserJobAssignment[]>(mockUserAssignments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<FileProcessingJob | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<UserJobAssignment | null>(null);
  const [fileCountUpdate, setFileCountUpdate] = useState<FileCountUpdate>({
    jobId: '',
    completedCount: 0,
    notes: ''
  });

  const [activeTab, setActiveTab] = useState('processing');
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

  const handleUpdateFileCount = () => {
    if (!selectedAssignment) return;

    // Update user assignment
    setUserAssignments(userAssignments.map(assignment =>
      assignment.userId === selectedAssignment.userId && assignment.jobId === selectedAssignment.jobId
        ? {
            ...assignment,
            completedFileCount: fileCountUpdate.completedCount,
            lastUpdated: new Date().toISOString()
          }
        : assignment
    ));

    // Update job total completed count
    const jobAssignments = userAssignments.filter(a => a.jobId === selectedAssignment.jobId);
    const totalCompleted = jobAssignments.reduce((sum, a) => {
      if (a.userId === selectedAssignment.userId) {
        return sum + fileCountUpdate.completedCount;
      }
      return sum + a.completedFileCount;
    }, 0);

    setJobs(jobs.map(job =>
      job.id === selectedAssignment.jobId
        ? {
            ...job,
            completedFileCount: totalCompleted,
            progress: (totalCompleted / job.totalFileCount) * 100
          }
        : job
    ));

    setIsUpdateDialogOpen(false);
    setSelectedAssignment(null);
    setFileCountUpdate({ jobId: '', completedCount: 0, notes: '' });
  };

  const openUpdateDialog = (assignment: UserJobAssignment) => {
    setSelectedAssignment(assignment);
    setFileCountUpdate({
      jobId: assignment.jobId,
      completedCount: assignment.completedFileCount,
      notes: ''
    });
    setIsUpdateDialogOpen(true);
  };

  const getUserAssignments = () => {
    if (currentUser?.role === 'user') {
      return userAssignments.filter(assignment => assignment.userId === currentUser.id);
    }
    return userAssignments;
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

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="processing">Job Processing</TabsTrigger>
          <TabsTrigger value="allocation">File Allocation</TabsTrigger>
        </TabsList>

        <TabsContent value="processing" className="space-y-6">
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

      {/* User View - My Assignments */}
      {currentUser?.role === 'user' && (
        <Card>
          <CardHeader>
            <CardTitle>My Assigned Tasks</CardTitle>
            <CardDescription>
              Update your file processing progress and view assigned work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getUserAssignments().length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No tasks assigned</h3>
                <p className="text-sm text-muted-foreground">You don't have any file processing tasks assigned yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getUserAssignments().map((assignment) => {
                  const job = jobs.find(j => j.id === assignment.jobId);
                  const progress = (assignment.completedFileCount / assignment.assignedFileCount) * 100;
                  const remainingFiles = assignment.assignedFileCount - assignment.completedFileCount;

                  return (
                    <Card key={`${assignment.userId}-${assignment.jobId}`} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{assignment.jobName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job?.type === 'mo_monthly' ? 'Monthly' : 'Weekly'} Processing
                            </p>
                          </div>
                          <Button
                            onClick={() => openUpdateDialog(assignment)}
                            size="sm"
                            disabled={job?.status !== 'active'}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Update Count
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-muted-foreground">Assigned</div>
                            <div className="font-medium">{assignment.assignedFileCount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                            <div className="font-medium text-green-600">{assignment.completedFileCount.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Remaining</div>
                            <div className="font-medium text-orange-600">{remainingFiles.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Progress</div>
                            <div className="font-medium">{progress.toFixed(1)}%</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Progress value={progress} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Last updated: {new Date(assignment.lastUpdated).toLocaleString()}</span>
                            <span>Target: {job?.targetEndDate ? new Date(job.targetEndDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Manager View - All User Progress */}
      {canManageJobs && (
        <Card>
          <CardHeader>
            <CardTitle>User Progress Overview</CardTitle>
            <CardDescription>
              Monitor all users' file processing progress across active jobs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Assigned Files</TableHead>
                  <TableHead>Completed Files</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userAssignments.map((assignment) => {
                  const job = jobs.find(j => j.id === assignment.jobId);
                  const progress = (assignment.completedFileCount / assignment.assignedFileCount) * 100;
                  const isCompleted = assignment.completedFileCount >= assignment.assignedFileCount;
                  const isOverdue = job && new Date() > new Date(job.targetEndDate) && !isCompleted;

                  return (
                    <TableRow key={`${assignment.userId}-${assignment.jobId}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {mockUsers.find(u => u.id === assignment.userId)?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.jobName}</div>
                          <div className="text-xs text-muted-foreground">
                            {job?.type === 'mo_monthly' ? 'Monthly' : 'Weekly'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{assignment.assignedFileCount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{assignment.completedFileCount.toLocaleString()}</span>
                          <Progress value={progress} className="h-2 w-16" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          progress >= 100 ? 'text-green-600' :
                          progress >= 75 ? 'text-blue-600' :
                          progress >= 50 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {progress.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(assignment.lastUpdated).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(assignment.lastUpdated).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          isCompleted ? 'bg-green-100 text-green-800' :
                          isOverdue ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'In Progress'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Jobs Table */}
      {canManageJobs && (
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
      )}
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <FileAllocationTab />
        </TabsContent>
      </Tabs>

      {/* File Count Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update File Count</DialogTitle>
            <DialogDescription>
              Update your completed file count for {selectedAssignment?.jobName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assigned Files</Label>
                <div className="text-2xl font-bold text-muted-foreground">
                  {selectedAssignment?.assignedFileCount.toLocaleString()}
                </div>
              </div>
              <div>
                <Label>Current Completed</Label>
                <div className="text-2xl font-bold text-green-600">
                  {selectedAssignment?.completedFileCount.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="completedCount">New Completed Count</Label>
              <Input
                id="completedCount"
                type="number"
                value={fileCountUpdate.completedCount}
                onChange={(e) => setFileCountUpdate({
                  ...fileCountUpdate,
                  completedCount: parseInt(e.target.value) || 0
                })}
                min="0"
                max={selectedAssignment?.assignedFileCount || 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={fileCountUpdate.notes}
                onChange={(e) => setFileCountUpdate({
                  ...fileCountUpdate,
                  notes: e.target.value
                })}
                placeholder="Add any notes about this update..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateFileCount}>
              Update Count
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
