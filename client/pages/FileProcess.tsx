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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Plus,
  Upload,
  Download,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Bot,
  User,
  Settings
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'inactive';
}

interface FileProcess {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  fileName?: string;
  totalRows: number;
  headerRows: number;
  processedRows: number;
  availableRows: number;
  uploadDate: string;
  status: 'active' | 'completed' | 'paused';
  createdBy: string;
  activeUsers: number;
  type: 'automation' | 'manual';
  dailyTarget?: number;
  automationConfig?: {
    toolName: string;
    lastUpdate: string;
    dailyCompletions: { date: string; completed: number }[];
  };
}

interface FileRequest {
  id: string;
  userId: string;
  userName: string;
  fileProcessId: string;
  requestedCount: number;
  requestedDate: string;
  status: 'pending' | 'assigned' | 'completed' | 'in_progress' | 'received';
  assignedBy?: string;
  assignedDate?: string;
  assignedCount?: number;
  startRow?: number;
  endRow?: number;
  downloadLink?: string;
  completedDate?: string;
}

interface HistoricalFileProcess {
  id: string;
  name: string;
  projectName: string;
  fileName: string;
  totalRows: number;
  processedRows: number;
  createdDate: string;
  completedDate: string;
  createdBy: string;
  duration: string;
  totalUsers: number;
  avgProcessingRate: number;
}

interface HistoricalAssignment {
  id: string;
  processName: string;
  userName: string;
  assignedCount: number;
  completedCount: number;
  assignedDate: string;
  completedDate: string;
  processingTime: string;
  efficiency: number;
}

const mockProjects: Project[] = [
  { id: '1', name: 'MO Project - Data Processing', client: 'Mobius Dataservice', status: 'active' },
  { id: '2', name: 'Customer Support Processing', client: 'TechCorp Solutions', status: 'active' },
  { id: '3', name: 'Invoice Processing', client: 'Mobius Dataservice', status: 'inactive' }
];

const mockFileProcesses: FileProcess[] = [
  {
    id: 'fp_1',
    name: 'Aug-2025-File',
    projectId: '1',
    projectName: 'MO Project - Data Processing',
    fileName: 'customer_data_aug_2025.xlsx',
    totalRows: 300000,
    headerRows: 1,
    processedRows: 45000,
    availableRows: 255000,
    uploadDate: '2024-01-20T09:00:00Z',
    status: 'active',
    createdBy: 'John Smith',
    activeUsers: 3,
    type: 'manual'
  },
  {
    id: 'fp_2',
    name: 'July-2025-Invoice',
    projectId: '3',
    projectName: 'Invoice Processing',
    fileName: 'invoice_data_july_2025.csv',
    totalRows: 150000,
    headerRows: 1,
    processedRows: 150000,
    availableRows: 0,
    uploadDate: '2024-01-15T14:30:00Z',
    status: 'completed',
    createdBy: 'Emily Wilson',
    activeUsers: 0,
    type: 'manual'
  },
  {
    id: 'fp_3',
    name: 'Automation-DataSync-Jan2025',
    projectId: '1',
    projectName: 'MO Project - Data Processing',
    totalRows: 500000,
    headerRows: 0,
    processedRows: 125000,
    availableRows: 375000,
    uploadDate: '2024-01-10T08:00:00Z',
    status: 'active',
    createdBy: 'John Smith',
    activeUsers: 0,
    type: 'automation',
    dailyTarget: 25000,
    automationConfig: {
      toolName: 'DataSync Pro',
      lastUpdate: '2024-01-20T23:59:00Z',
      dailyCompletions: [
        { date: '2024-01-15', completed: 25000 },
        { date: '2024-01-16', completed: 24800 },
        { date: '2024-01-17', completed: 25200 },
        { date: '2024-01-18', completed: 24900 },
        { date: '2024-01-19', completed: 25100 }
      ]
    }
  },
  {
    id: 'fp_4',
    name: 'Automation-LeadGen-Dec2024',
    projectId: '2',
    projectName: 'Customer Support Processing',
    totalRows: 200000,
    headerRows: 0,
    processedRows: 200000,
    availableRows: 0,
    uploadDate: '2024-12-01T10:00:00Z',
    status: 'completed',
    createdBy: 'Emily Wilson',
    activeUsers: 0,
    type: 'automation',
    dailyTarget: 8000,
    automationConfig: {
      toolName: 'Lead Generator AI',
      lastUpdate: '2024-12-25T23:59:00Z',
      dailyCompletions: [
        { date: '2024-12-20', completed: 8000 },
        { date: '2024-12-21', completed: 8000 },
        { date: '2024-12-22', completed: 8000 },
        { date: '2024-12-23', completed: 8000 },
        { date: '2024-12-24', completed: 8000 }
      ]
    }
  }
];

const mockFileRequests: FileRequest[] = [
  {
    id: '1',
    userId: '3',
    userName: 'Sarah Johnson',
    fileProcessId: 'fp_1',
    requestedCount: 1000,
    requestedDate: '2024-01-20T10:30:00Z',
    status: 'pending'
  },
  {
    id: '2',
    userId: '4',
    userName: 'Mike Davis',
    fileProcessId: 'fp_1',
    requestedCount: 800,
    requestedDate: '2024-01-20T11:15:00Z',
    status: 'assigned',
    assignedBy: 'John Smith',
    assignedDate: '2024-01-20T12:00:00Z',
    assignedCount: 800,
    startRow: 44201,
    endRow: 45000
  }
];

const mockHistoricalProcesses: HistoricalFileProcess[] = [
  {
    id: 'hfp_1',
    name: 'June-2024-DataEntry',
    projectName: 'MO Project - Data Processing',
    fileName: 'customer_data_june_2024.xlsx',
    totalRows: 250000,
    processedRows: 250000,
    createdDate: '2024-06-01T09:00:00Z',
    completedDate: '2024-06-15T17:30:00Z',
    createdBy: 'John Smith',
    duration: '14 days',
    totalUsers: 8,
    avgProcessingRate: 1190
  },
  {
    id: 'hfp_2',
    name: 'May-2024-Invoice',
    projectName: 'Invoice Processing',
    fileName: 'invoice_data_may_2024.csv',
    totalRows: 180000,
    processedRows: 180000,
    createdDate: '2024-05-01T08:00:00Z',
    completedDate: '2024-05-12T16:45:00Z',
    createdBy: 'Emily Wilson',
    duration: '11 days',
    totalUsers: 6,
    avgProcessingRate: 1364
  },
  {
    id: 'hfp_3',
    name: 'April-2024-Support',
    projectName: 'Customer Support Processing',
    fileName: 'support_tickets_april_2024.xlsx',
    totalRows: 75000,
    processedRows: 75000,
    createdDate: '2024-04-01T10:00:00Z',
    completedDate: '2024-04-08T14:20:00Z',
    createdBy: 'John Smith',
    duration: '7 days',
    totalUsers: 4,
    avgProcessingRate: 1339
  }
];

const mockHistoricalAssignments: HistoricalAssignment[] = [
  {
    id: 'ha_1',
    processName: 'June-2024-DataEntry',
    userName: 'Sarah Johnson',
    assignedCount: 15000,
    completedCount: 15000,
    assignedDate: '2024-06-02T09:00:00Z',
    completedDate: '2024-06-07T16:30:00Z',
    processingTime: '5.5 days',
    efficiency: 95.2
  },
  {
    id: 'ha_2',
    processName: 'June-2024-DataEntry',
    userName: 'Mike Davis',
    assignedCount: 12000,
    completedCount: 12000,
    assignedDate: '2024-06-03T10:15:00Z',
    completedDate: '2024-06-08T15:45:00Z',
    processingTime: '5.2 days',
    efficiency: 98.1
  },
  {
    id: 'ha_3',
    processName: 'May-2024-Invoice',
    userName: 'Lisa Chen',
    assignedCount: 20000,
    completedCount: 19500,
    assignedDate: '2024-05-02T08:30:00Z',
    completedDate: '2024-05-09T17:00:00Z',
    processingTime: '7.3 days',
    efficiency: 97.5
  },
  {
    id: 'ha_4',
    processName: 'May-2024-Invoice',
    userName: 'John Williams',
    assignedCount: 18000,
    completedCount: 18000,
    assignedDate: '2024-05-01T09:00:00Z',
    completedDate: '2024-05-07T14:30:00Z',
    processingTime: '6.2 days',
    efficiency: 100
  },
  {
    id: 'ha_5',
    processName: 'April-2024-Support',
    userName: 'Emma Rodriguez',
    assignedCount: 8500,
    completedCount: 8500,
    assignedDate: '2024-04-02T11:00:00Z',
    completedDate: '2024-04-05T16:15:00Z',
    processingTime: '3.2 days',
    efficiency: 100
  }
];

export default function FileProcess() {
  const { user: currentUser } = useAuth();
  const [fileProcesses, setFileProcesses] = useState<FileProcess[]>(mockFileProcesses);
  const [fileRequests, setFileRequests] = useState<FileRequest[]>(mockFileRequests);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<FileProcess | null>(null);
  const [isOverviewDialogOpen, setIsOverviewDialogOpen] = useState(false);
  const [newProcess, setNewProcess] = useState({
    name: '',
    projectId: '',
    fileName: '',
    totalRows: 0,
    uploadedFile: null as File | null,
    type: 'manual' as 'automation' | 'manual',
    dailyTarget: 0,
    automationToolName: ''
  });
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedAutomationProcess, setSelectedAutomationProcess] = useState<FileProcess | null>(null);
  const [dailyUpdate, setDailyUpdate] = useState({ completed: 0, date: new Date().toISOString().split('T')[0] });
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Only allow admin/project_manager to access this page
  if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'project_manager') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
          <p className="text-sm text-muted-foreground">This page is only accessible to administrators and project managers.</p>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setNewProcess({
      name: '',
      projectId: '',
      fileName: '',
      totalRows: 0,
      uploadedFile: null,
      type: 'manual',
      dailyTarget: 0,
      automationToolName: ''
    });

    // Clear file input
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleDailyAutomationUpdate = (processId: string, editDate?: string) => {
    const process = fileProcesses.find(p => p.id === processId);
    if (!process || process.type !== 'automation') return;

    // Check if process is completed and prevent updates
    if (process.status === 'completed') {
      if (window.confirm(`This process "${process.name}" is marked as completed. Do you still want to view/edit historical data? Note: Any changes may affect final counts.`)) {
        // Allow viewing but show warning in dialog
      } else {
        return;
      }
    }

    const targetDate = editDate || new Date().toISOString().split('T')[0];
    const existingCompletion = process.automationConfig?.dailyCompletions.find(d => d.date === targetDate);

    setSelectedAutomationProcess(process);
    setDailyUpdate({
      completed: existingCompletion ? existingCompletion.completed : (process.dailyTarget || 0),
      date: targetDate
    });
    setIsEditingExisting(!!existingCompletion);
    setIsUpdateDialogOpen(true);
  };

  const submitDailyUpdate = () => {
    if (!selectedAutomationProcess) return;

    const updatedProcesses = fileProcesses.map(p => {
      if (p.id === selectedAutomationProcess.id && p.type === 'automation' && p.automationConfig) {
        // Check if there's already an entry for this date
        const existingEntryIndex = p.automationConfig.dailyCompletions.findIndex(d => d.date === dailyUpdate.date);
        let updatedCompletions = [...p.automationConfig.dailyCompletions];
        let processedRowsDiff = dailyUpdate.completed;

        if (existingEntryIndex >= 0) {
          // Update existing entry
          const oldCompleted = updatedCompletions[existingEntryIndex].completed;
          updatedCompletions[existingEntryIndex] = { date: dailyUpdate.date, completed: dailyUpdate.completed };
          processedRowsDiff = dailyUpdate.completed - oldCompleted;
        } else {
          // Add new entry
          updatedCompletions = [
            ...updatedCompletions,
            { date: dailyUpdate.date, completed: dailyUpdate.completed }
          ].slice(-30); // Keep last 30 days
        }

        const newProcessedRows = p.processedRows + processedRowsDiff;
        const newAvailableRows = p.totalRows - newProcessedRows;

        return {
          ...p,
          processedRows: Math.max(0, newProcessedRows),
          availableRows: Math.max(0, newAvailableRows),
          status: newAvailableRows <= 0 ? 'completed' as const : p.status,
          automationConfig: {
            ...p.automationConfig,
            lastUpdate: new Date().toISOString(),
            dailyCompletions: updatedCompletions
          }
        };
      }
      return p;
    });

    setFileProcesses(updatedProcesses);
    setIsUpdateDialogOpen(false);
    setSelectedAutomationProcess(null);
  };

  const getAutomationStats = () => {
    const automationProcesses = fileProcesses.filter(p => p.type === 'automation');
    const totalAutomationRows = automationProcesses.reduce((sum, p) => sum + p.totalRows, 0);
    const totalAutomationProcessed = automationProcesses.reduce((sum, p) => sum + p.processedRows, 0);
    const activeAutomationProcesses = automationProcesses.filter(p => p.status === 'active').length;

    return {
      totalProcesses: automationProcesses.length,
      activeProcesses: activeAutomationProcesses,
      totalRows: totalAutomationRows,
      processedRows: totalAutomationProcessed,
      efficiency: totalAutomationRows > 0 ? (totalAutomationProcessed / totalAutomationRows) * 100 : 0
    };
  };

  const automationStats = getAutomationStats();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // Handle Excel files differently since they're binary ZIP archives
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      console.log('Excel file detected - requires manual row count entry');
      setNewProcess({
        ...newProcess,
        fileName: file.name,
        totalRows: 0, // Must be entered manually for Excel files
        uploadedFile: file
      });
      return;
    }

    // For CSV and other text files, attempt to read and count rows
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      if (!text || text.startsWith('PK')) {
        // If file can't be read as text or is binary, require manual entry
        console.log('Binary file detected or read failed - requires manual entry');
        setNewProcess({
          ...newProcess,
          fileName: file.name,
          totalRows: 0,
          uploadedFile: file
        });
        return;
      }

      // Count rows for text-based files
      const lines = text.split(/\r?\n/);
      const nonEmptyLines = lines.filter(line => line.trim() !== '');
      const rowCount = nonEmptyLines.length;

      console.log('File content preview:', text.substring(0, 100));
      console.log('Total lines found:', lines.length);
      console.log('Non-empty lines:', rowCount);

      setNewProcess({
        ...newProcess,
        fileName: file.name,
        totalRows: rowCount,
        uploadedFile: file
      });
    };

    reader.onerror = () => {
      console.log('File reading error - requires manual entry');
      setNewProcess({
        ...newProcess,
        fileName: file.name,
        totalRows: 0,
        uploadedFile: file
      });
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleCreateProcess = () => {
    const availableRows = newProcess.totalRows;

    const process: FileProcess = {
      id: `fp_${fileProcesses.length + 1}`,
      name: newProcess.name,
      projectId: newProcess.projectId,
      projectName: mockProjects.find(p => p.id === newProcess.projectId)?.name || 'Unknown Project',
      fileName: newProcess.type === 'manual' ? newProcess.fileName : undefined,
      totalRows: newProcess.totalRows,
      headerRows: 0,
      processedRows: 0,
      availableRows: availableRows,
      uploadDate: new Date().toISOString(),
      status: 'active',
      createdBy: currentUser?.name || 'Unknown',
      activeUsers: newProcess.type === 'automation' ? 0 : 0,
      type: newProcess.type,
      dailyTarget: newProcess.type === 'automation' ? newProcess.dailyTarget : undefined,
      automationConfig: newProcess.type === 'automation' ? {
        toolName: newProcess.automationToolName,
        lastUpdate: new Date().toISOString(),
        dailyCompletions: []
      } : undefined
    };

    setFileProcesses([process, ...fileProcesses]);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const generateDownloadLink = (process: FileProcess, startRow: number, endRow: number, userName: string) => {
    // Generate filename without triggering download
    const fileName = `${userName.toLowerCase().replace(/\s+/g, '_')}_${process.name.toLowerCase().replace(/\s+/g, '_')}_${startRow}_${endRow}.csv`;
    return `/downloads/${fileName}`;
  };

  const handleApproveRequest = (requestId: string, processId: string, assignedCount: number) => {
    const process = fileProcesses.find(p => p.id === processId);
    const request = fileRequests.find(r => r.id === requestId);

    if (!process || !request) return;

    const startRow = process.processedRows + 1;
    const endRow = process.processedRows + assignedCount;

    // Generate download link for the user (no auto-download)
    const downloadLink = generateDownloadLink(process, startRow, endRow, request.userName);

    // Update request with download link and assignment details
    setFileRequests(fileRequests.map(r =>
      r.id === requestId
        ? {
            ...r,
            status: 'assigned',
            assignedBy: currentUser?.name,
            assignedDate: new Date().toISOString(),
            assignedCount,
            startRow,
            endRow,
            downloadLink,
            fileProcessId: processId,
            fileProcessName: process.name
          }
        : r
    ));

    // Update file process
    setFileProcesses(fileProcesses.map(p =>
      p.id === processId
        ? {
            ...p,
            processedRows: p.processedRows + assignedCount,
            availableRows: p.availableRows - assignedCount,
            activeUsers: p.activeUsers + 1
          }
        : p
    ));

    // Show success message
    alert(`File generated and assigned to ${request.userName}!\nRows ${startRow}-${endRow} (${assignedCount} files)\nDownload will be available in their Request Files page.`);
  };

  const getPendingRequests = () => {
    return fileRequests.filter(r => r.status === 'pending');
  };

  const getProcessRequests = (processId: string) => {
    return fileRequests.filter(r => r.fileProcessId === processId);
  };

  const getProcessStatusCounts = (processId: string) => {
    const requests = getProcessRequests(processId);
    return {
      completed: requests.filter(r => r.status === 'completed').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      pending: requests.filter(r => r.status === 'pending').length,
      assigned: requests.filter(r => r.status === 'assigned').length
    };
  };

  const openProcessOverview = (process: FileProcess) => {
    setSelectedProcess(process);
    setIsOverviewDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">File Process Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage file processing workflows for project data allocation.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create File Process
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New File Process</DialogTitle>
              <DialogDescription>
                Set up a new file processing workflow with project data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="processName">File Process Name</Label>
                <Input
                  id="processName"
                  value={newProcess.name}
                  onChange={(e) => setNewProcess({ ...newProcess, name: e.target.value })}
                  placeholder="e.g., Aug-2025-File or Automation-DataSync-Jan2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={newProcess.projectId} onValueChange={(value) => setNewProcess({ ...newProcess, projectId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProjects.filter(p => p.status === 'active').map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex flex-col">
                          <span>{project.name}</span>
                          <span className="text-xs text-muted-foreground">{project.client}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="processType">Process Type</Label>
                <Select value={newProcess.type} onValueChange={(value: 'automation' | 'manual') => setNewProcess({ ...newProcess, type: value, fileName: '', totalRows: 0, uploadedFile: null })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select process type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>Manual Processing</span>
                          <span className="text-xs text-muted-foreground">Users work with uploaded files</span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="automation">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>Automation Tool</span>
                          <span className="text-xs text-muted-foreground">Automated processing with daily updates</span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newProcess.type === 'manual' ? (
                // Manual File Upload
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fileUpload">Upload File (Excel/CSV)</Label>
                    <div className="space-y-2">
                      <Input
                        id="fileUpload"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="cursor-pointer"
                      />
                      {newProcess.uploadedFile && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                          <Upload className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700">
                            File uploaded: {newProcess.fileName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {newProcess.uploadedFile && (
                    <div className="space-y-2">
                      <Label htmlFor="totalRows">Total Rows (editable)</Label>
                      <Input
                        id="totalRows"
                        type="number"
                        value={newProcess.totalRows}
                        onChange={(e) => setNewProcess({ ...newProcess, totalRows: parseInt(e.target.value) || 0 })}
                        placeholder="Enter row count"
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground">
                        {newProcess.totalRows > 0
                          ? `✅ Auto-detected: ${newProcess.totalRows.toLocaleString()} rows. You can modify this count if needed.`
                          : newProcess.fileName?.toLowerCase().endsWith('.xlsx') || newProcess.fileName?.toLowerCase().endsWith('.xls')
                            ? '📊 Excel files require manual row count entry. Please enter the total number of data rows.'
                            : '⚠��� Could not auto-detect row count. Please enter the total number of data rows manually.'
                        }
                      </p>
                    </div>
                  )}
                </>
              ) : (
                // Automation Configuration
                <>
                  <div className="space-y-2">
                    <Label htmlFor="automationTool">Automation Tool Name</Label>
                    <Input
                      id="automationTool"
                      value={newProcess.automationToolName}
                      onChange={(e) => setNewProcess({ ...newProcess, automationToolName: e.target.value })}
                      placeholder="e.g., DataSync Pro, Lead Generator AI"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalCount">Total Count to Process</Label>
                    <Input
                      id="totalCount"
                      type="number"
                      value={newProcess.totalRows}
                      onChange={(e) => setNewProcess({ ...newProcess, totalRows: parseInt(e.target.value) || 0 })}
                      placeholder="Enter total count"
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Total number of items to be processed by the automation tool.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyTarget">Daily Target</Label>
                    <Input
                      id="dailyTarget"
                      type="number"
                      value={newProcess.dailyTarget}
                      onChange={(e) => setNewProcess({ ...newProcess, dailyTarget: parseInt(e.target.value) || 0 })}
                      placeholder="Enter daily processing target"
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Expected number of items to be processed daily by the automation tool.
                    </p>
                  </div>
                </>
              )}
              {newProcess.totalRows > 0 && (
                <div className={`p-3 border rounded-lg ${
                  newProcess.type === 'automation'
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm ${
                    newProcess.type === 'automation' ? 'text-purple-700' : 'text-blue-700'
                  }`}>
                    <strong>Available for processing:</strong> {newProcess.totalRows.toLocaleString()} {newProcess.type === 'automation' ? 'items' : 'rows'}
                  </p>
                  {newProcess.type === 'automation' && newProcess.dailyTarget > 0 && (
                    <p className="text-xs text-purple-600 mt-1">
                      Estimated completion: {Math.ceil(newProcess.totalRows / newProcess.dailyTarget)} days
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${
                    newProcess.type === 'automation' ? 'text-purple-600' : 'text-blue-600'
                  }`}>
                    {newProcess.type === 'automation'
                      ? 'This will be processed automatically with daily updates.'
                      : 'This will be the total number of data rows available for user allocation.'}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                resetForm();
                setIsCreateDialogOpen(false);
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateProcess}
                disabled={
                  !newProcess.name ||
                  !newProcess.projectId ||
                  !newProcess.totalRows ||
                  newProcess.totalRows <= 0 ||
                  (newProcess.type === 'manual' && !newProcess.uploadedFile) ||
                  (newProcess.type === 'automation' && (!newProcess.automationToolName || !newProcess.dailyTarget || newProcess.dailyTarget <= 0))
                }
              >
                Create Process
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Active Processes and File History */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Processes</TabsTrigger>
          <TabsTrigger value="history">File History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6 mt-6">
          {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileProcesses.filter(p => p.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fileProcesses.reduce((sum, p) => sum + p.totalRows, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Across all processes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Rows</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fileProcesses.reduce((sum, p) => sum + p.processedRows, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getPendingRequests().length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* File Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            File Assignment Summary
          </CardTitle>
          <CardDescription>
            Overview of all file assignments across all processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {fileRequests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-xs text-yellow-700">Pending Approval</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {fileRequests.filter(r => r.status === 'assigned').length}
              </div>
              <div className="text-xs text-blue-700">Files Ready</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {fileRequests.filter(r => r.status === 'received').length}
              </div>
              <div className="text-xs text-purple-700">Downloaded</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {fileRequests.filter(r => r.status === 'in_progress').length}
              </div>
              <div className="text-xs text-orange-700">In Progress</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {fileRequests.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-xs text-green-700">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {getPendingRequests().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Pending File Requests
            </CardTitle>
            <CardDescription>
              Review and approve user requests for file allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getPendingRequests().map(request => {
                const process = fileProcesses.find(p => p.id === request.fileProcessId);
                
                return (
                  <Card key={request.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{request.userName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Requested {request.requestedCount.toLocaleString()} rows from {process?.name || 'Unknown Process'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.requestedDate).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={request.requestedCount}
                            className="w-24"
                            id={`count-${request.id}`}
                            min="1"
                            max={process?.availableRows || 0}
                          />
                          <Select defaultValue={request.fileProcessId}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fileProcesses.filter(p => p.status === 'active' && p.availableRows > 0).map(proc => (
                                <SelectItem key={proc.id} value={proc.id}>
                                  {proc.name} ({proc.availableRows.toLocaleString()} available)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => {
                              const countInput = document.getElementById(`count-${request.id}`) as HTMLInputElement;
                              const assignedCount = parseInt(countInput.value) || request.requestedCount;
                              handleApproveRequest(request.id, request.fileProcessId, assignedCount);
                            }}
                            disabled={!process || process.availableRows <= 0}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Processes List */}
      <Card>
        <CardHeader>
          <CardTitle>File Processes ({fileProcesses.length})</CardTitle>
          <CardDescription>
            Manage your file processing workflows and track progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fileProcesses.map((process) => {
              const progress = process.totalRows > 0 ? (process.processedRows / (process.totalRows - process.headerRows)) * 100 : 0;
              const processRequests = getProcessRequests(process.id);
              const statusCounts = getProcessStatusCounts(process.id);

              return (
                <Card key={process.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{process.name}</h4>
                          {process.type === 'automation' ? (
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              <Bot className="h-3 w-3 mr-1" />
                              AUTO
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              <User className="h-3 w-3 mr-1" />
                              MANUAL
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{process.projectName}</p>
                        {process.type === 'automation' && process.automationConfig && (
                          <p className="text-xs text-purple-600">
                            Tool: {process.automationConfig.toolName}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusBadgeColor(process.status)}>
                        {process.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">Processed</div>
                          <div className="font-medium text-green-600">{process.processedRows.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Available</div>
                          <div className="font-medium text-blue-600">{process.availableRows.toLocaleString()}</div>
                        </div>
                      </div>

                      {process.type === 'automation' && process.dailyTarget && (
                        <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                          <div className="flex justify-between">
                            <span className="text-purple-700">Daily Target:</span>
                            <span className="font-medium text-purple-600">{process.dailyTarget.toLocaleString()}</span>
                          </div>
                          {process.automationConfig?.dailyCompletions.length > 0 && (
                            <div className="flex justify-between mt-1">
                              <span className="text-purple-700">Last Update:</span>
                              <span className="text-purple-600">
                                {new Date(process.automationConfig.lastUpdate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* User Status Counts */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-medium text-green-600">{statusCounts.completed}</div>
                          <div className="text-green-700">Completed</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="font-medium text-orange-600">{statusCounts.inProgress}</div>
                          <div className="text-orange-700">In Progress</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <div className="font-medium text-yellow-600">{statusCounts.pending + statusCounts.assigned}</div>
                          <div className="text-yellow-700">Pending</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          {process.type === 'automation' ? (
                            <>
                              <Bot className="h-3 w-3" />
                              <span>Automated</span>
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3" />
                              <span>{process.activeUsers} users</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {process.type === 'automation' && (currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager') ? (
                            <>
                              {process.status !== 'completed' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDailyAutomationUpdate(process.id);
                                  }}
                                  className="h-6 px-2 text-xs text-purple-600 border-purple-300 hover:bg-purple-50"
                                >
                                  <Settings className="h-3 w-3 mr-1" />
                                  Update
                                </Button>
                              ) : (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openProcessOverview(process);
                                }}
                                className="h-6 px-2 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openProcessOverview(process);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Process Overview Dialog */}
      <Dialog open={isOverviewDialogOpen} onOpenChange={setIsOverviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProcess?.name} Overview</DialogTitle>
            <DialogDescription>
              Detailed view of file processing progress and user assignments
            </DialogDescription>
          </DialogHeader>
          {selectedProcess && (
            <div className="space-y-6">
              {/* Process Type Header */}
              <div className="flex items-center gap-2 mb-4">
                {selectedProcess.type === 'automation' ? (
                  <>
                    <Bot className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-600">Automation Process</span>
                    {selectedProcess.automationConfig && (
                      <Badge variant="outline" className="text-purple-600">
                        {selectedProcess.automationConfig.toolName}
                      </Badge>
                    )}
                  </>
                ) : (
                  <>
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-600">Manual Process</span>
                    <Badge variant="outline" className="text-blue-600">
                      {selectedProcess.fileName}
                    </Badge>
                  </>
                )}
              </div>

              {/* Process Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {selectedProcess.totalRows.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700">{selectedProcess.type === 'automation' ? 'Total Items' : 'Total Rows'}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {selectedProcess.processedRows.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-700">Processed</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    {selectedProcess.availableRows.toLocaleString()}
                  </div>
                  <div className="text-xs text-orange-700">Available</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {selectedProcess.type === 'automation' ?
                      (selectedProcess.dailyTarget?.toLocaleString() || 'N/A') :
                      selectedProcess.activeUsers
                    }
                  </div>
                  <div className="text-xs text-purple-700">
                    {selectedProcess.type === 'automation' ? 'Daily Target' : 'Active Users'}
                  </div>
                </div>
              </div>

              {/* Automation Daily Progress */}
              {selectedProcess.type === 'automation' && selectedProcess.automationConfig?.dailyCompletions && (
                <>
                  {/* Today's Status and Quick Update */}
                  {(currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager') && (
                    <Card className={`border-l-4 ${
                      selectedProcess.status === 'completed'
                        ? 'border-l-green-500 bg-green-50'
                        : 'border-l-purple-500'
                    }`}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {selectedProcess.status === 'completed' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-purple-500" />
                            )}
                            {selectedProcess.status === 'completed' ? 'Process Completed' : "Today's Progress"}
                          </div>
                          {selectedProcess.status !== 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => handleDailyAutomationUpdate(selectedProcess.id)}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Settings className="h-4 w-4 mr-2" />
                              Update Today
                            </Button>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {selectedProcess.status === 'completed'
                            ? `All processing completed for ${selectedProcess.automationConfig.toolName}`
                            : `Manage today's completion count for ${selectedProcess.automationConfig.toolName}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-lg font-bold text-green-600">
                              {(() => {
                                const today = new Date().toISOString().split('T')[0];
                                const todayCompletion = selectedProcess.automationConfig?.dailyCompletions.find(d => d.date === today);
                                return todayCompletion ? todayCompletion.completed.toLocaleString() : '0';
                              })()}
                            </div>
                            <div className="text-xs text-green-700">Completed Today</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">
                              {selectedProcess.dailyTarget?.toLocaleString() || '0'}
                            </div>
                            <div className="text-xs text-purple-700">Daily Target</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Today's Progress</span>
                            <span>
                              {(() => {
                                const today = new Date().toISOString().split('T')[0];
                                const todayCompletion = selectedProcess.automationConfig?.dailyCompletions.find(d => d.date === today);
                                const completed = todayCompletion ? todayCompletion.completed : 0;
                                const target = selectedProcess.dailyTarget || 1;
                                return ((completed / target) * 100).toFixed(1);
                              })()}%
                            </span>
                          </div>
                          <Progress
                            value={(() => {
                              const today = new Date().toISOString().split('T')[0];
                              const todayCompletion = selectedProcess.automationConfig?.dailyCompletions.find(d => d.date === today);
                              const completed = todayCompletion ? todayCompletion.completed : 0;
                              const target = selectedProcess.dailyTarget || 1;
                              return Math.min((completed / target) * 100, 100);
                            })()}
                            className="h-2"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-purple-500" />
                        Daily Automation Progress
                      </CardTitle>
                      <CardDescription>
                        Recent daily completions by {selectedProcess.automationConfig.toolName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedProcess.automationConfig.dailyCompletions.slice(-7).map((day, index) => {
                          const isToday = day.date === new Date().toISOString().split('T')[0];
                          const canEdit = (currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager') && selectedProcess.status !== 'completed';
                          return (
                            <div key={index} className={`flex items-center justify-between p-2 rounded ${
                              isToday ? 'bg-purple-100 border border-purple-300' : 'bg-purple-50'
                            } ${selectedProcess.status === 'completed' ? 'opacity-75' : ''}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{new Date(day.date).toLocaleDateString()}</span>
                                {isToday && <Badge variant="outline" className="text-xs">Today</Badge>}
                                {selectedProcess.status === 'completed' && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                    Final
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-purple-600">{day.completed.toLocaleString()} items</span>
                                <Badge variant={day.completed >= (selectedProcess.dailyTarget || 0) ? 'default' : 'secondary'}>
                                  {day.completed >= (selectedProcess.dailyTarget || 0) ? 'Target Met' : 'Below Target'}
                                </Badge>
                                {canEdit && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDailyAutomationUpdate(selectedProcess.id, day.date)}
                                    className="h-6 w-6 p-0 text-purple-600 hover:bg-purple-100"
                                    title={`Edit count for ${new Date(day.date).toLocaleDateString()}`}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{((selectedProcess.processedRows / (selectedProcess.totalRows - selectedProcess.headerRows)) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(selectedProcess.processedRows / (selectedProcess.totalRows - selectedProcess.headerRows)) * 100} className="h-3" />
              </div>

              {/* Request History with Full Status Tracking */}
              {selectedProcess.type === 'manual' && (
                <div>
                  <h4 className="font-medium mb-3">File Assignment & Status Tracking</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Rows</TableHead>
                      <TableHead>Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getProcessRequests(selectedProcess.id).map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.userName}</div>
                            {request.assignedBy && (
                              <div className="text-xs text-muted-foreground">
                                Assigned by: {request.assignedBy}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{(request.assignedCount || request.requestedCount).toLocaleString()}</TableCell>
                        <TableCell>
                          {request.startRow && request.endRow ? (
                            <span className="text-sm font-mono">
                              {request.startRow.toLocaleString()} - {request.endRow.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={getRequestStatusBadgeColor(request.status)}>
                              {request.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {request.status === 'assigned' && (
                              <div className="text-xs text-blue-600">File ready for download</div>
                            )}
                            {request.status === 'in_progress' && (
                              <div className="text-xs text-orange-600">Currently working</div>
                            )}
                            {request.status === 'completed' && (
                              <div className="text-xs text-green-600">Work completed</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(request.assignedDate || request.requestedDate).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(request.assignedDate || request.requestedDate).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {request.downloadLink && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = request.downloadLink || '';
                                  link.download = request.downloadLink?.split('/').pop() || 'file.csv';
                                  link.click();
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                View File
                              </Button>
                            )}
                            {request.status === 'completed' && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Done
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                  {getProcessRequests(selectedProcess.id).length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      No requests for this process yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOverviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="history" className="space-y-6 mt-6">
          {/* Historical Process Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Completed File Processes
              </CardTitle>
              <CardDescription>
                Historical overview of completed file processing workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockHistoricalProcesses.map((process) => (
                  <Card key={process.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{process.name}</h4>
                          <p className="text-sm text-muted-foreground">{process.projectName}</p>
                          <p className="text-xs text-muted-foreground">Created by: {process.createdBy}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          COMPLETED
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="text-lg font-bold text-blue-600">
                            {process.totalRows.toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-700">Total Rows</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="text-lg font-bold text-green-600">
                            {process.totalUsers}
                          </div>
                          <div className="text-xs text-green-700">Users</div>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <div className="text-lg font-bold text-purple-600">
                            {process.duration}
                          </div>
                          <div className="text-xs text-purple-700">Duration</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="text-lg font-bold text-orange-600">
                            {process.avgProcessingRate}
                          </div>
                          <div className="text-xs text-orange-700">Avg/Day</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Started: {new Date(process.createdDate).toLocaleDateString()}</span>
                        <span>Completed: {new Date(process.completedDate).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Historical Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                User Assignment History
              </CardTitle>
              <CardDescription>
                Detailed history of file assignments and user performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Efficiency</TableHead>
                    <TableHead>Completion Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHistoricalAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-medium">{assignment.processName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{assignment.userName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-blue-600 font-medium">
                          {assignment.assignedCount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-green-600 font-medium">
                          {assignment.completedCount.toLocaleString()}
                        </div>
                        {assignment.completedCount < assignment.assignedCount && (
                          <div className="text-xs text-red-500">
                            ({assignment.assignedCount - assignment.completedCount} incomplete)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{assignment.processingTime}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`font-medium ${
                            assignment.efficiency >= 95 ? 'text-green-600' :
                            assignment.efficiency >= 85 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {assignment.efficiency}%
                          </div>
                          {assignment.efficiency >= 95 && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(assignment.completedDate).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(assignment.completedDate).toLocaleTimeString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Processes Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {mockHistoricalProcesses.length}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  All-time completed workflows
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Rows Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {mockHistoricalProcesses.reduce((sum, p) => sum + p.processedRows, 0).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Historical data processing volume
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {(mockHistoricalAssignments.reduce((sum, a) => sum + a.efficiency, 0) / mockHistoricalAssignments.length).toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Team performance average
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Daily Automation Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-600" />
              Daily Automation Update
            </DialogTitle>
            <DialogDescription>
              {isEditingExisting
                ? `Edit completion count for ${selectedAutomationProcess?.name} on ${new Date(dailyUpdate.date).toLocaleDateString()}`
                : `Record completion count for ${selectedAutomationProcess?.name} on ${new Date(dailyUpdate.date).toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          {selectedAutomationProcess && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-700">{selectedAutomationProcess.name}</h4>
                <p className="text-sm text-purple-600">
                  Tool: {selectedAutomationProcess.automationConfig?.toolName}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Daily Target: {selectedAutomationProcess.dailyTarget?.toLocaleString()} items
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="updateDate">Date</Label>
                <Input
                  id="updateDate"
                  type="date"
                  value={dailyUpdate.date}
                  onChange={(e) => setDailyUpdate({ ...dailyUpdate, date: e.target.value })}
                  disabled={isEditingExisting}
                  className={isEditingExisting ? 'bg-gray-100' : ''}
                />
                {isEditingExisting && (
                  <p className="text-xs text-muted-foreground">
                    Editing existing entry - date cannot be changed
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="completedCount">Completed Items Today</Label>
                <Input
                  id="completedCount"
                  type="number"
                  value={dailyUpdate.completed}
                  onChange={(e) => setDailyUpdate({ ...dailyUpdate, completed: parseInt(e.target.value) || 0 })}
                  placeholder="Enter completed count"
                  min="0"
                  max={selectedAutomationProcess.availableRows}
                />
                <p className="text-xs text-muted-foreground">
                  Available: {selectedAutomationProcess.availableRows.toLocaleString()} items
                </p>
              </div>

              {dailyUpdate.completed > 0 && (
                <div className={`p-3 border rounded-lg ${
                  isEditingExisting ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                }`}>
                  <p className={`text-sm ${
                    isEditingExisting ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    <strong>{isEditingExisting ? 'Count Update:' : 'Progress Update:'}</strong> {dailyUpdate.completed.toLocaleString()} items
                  </p>
                  {!isEditingExisting && (
                    <p className="text-xs text-green-600 mt-1">
                      New total: {(selectedAutomationProcess.processedRows + dailyUpdate.completed).toLocaleString()} / {selectedAutomationProcess.totalRows.toLocaleString()}
                    </p>
                  )}
                  {isEditingExisting && (
                    <p className="text-xs text-blue-600 mt-1">
                      This will update the existing entry for {new Date(dailyUpdate.date).toLocaleDateString()}
                    </p>
                  )}
                  {dailyUpdate.completed >= (selectedAutomationProcess.dailyTarget || 0) && (
                    <Badge className="mt-1" variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Daily Target Achieved!
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitDailyUpdate}
              disabled={!dailyUpdate.completed || dailyUpdate.completed <= 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Bot className="h-4 w-4 mr-2" />
              {isEditingExisting ? 'Save Changes' : 'Update Progress'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
