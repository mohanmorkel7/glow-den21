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
  MoreHorizontal
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
  fileName: string;
  totalRows: number;
  headerRows: number;
  processedRows: number;
  availableRows: number;
  uploadDate: string;
  status: 'active' | 'completed' | 'paused';
  createdBy: string;
  activeUsers: number;
}

interface FileRequest {
  id: string;
  userId: string;
  userName: string;
  fileProcessId: string;
  requestedCount: number;
  requestedDate: string;
  status: 'pending' | 'assigned' | 'completed';
  assignedBy?: string;
  assignedDate?: string;
  assignedCount?: number;
  startRow?: number;
  endRow?: number;
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
    activeUsers: 3
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
    activeUsers: 0
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
    uploadedFile: null as File | null
  });

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
    setNewProcess({ name: '', projectId: '', fileName: '', totalRows: 0, uploadedFile: null });

    // Clear file input
    const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

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
      fileName: newProcess.fileName,
      totalRows: newProcess.totalRows,
      headerRows: 0,
      processedRows: 0,
      availableRows: availableRows,
      uploadDate: new Date().toISOString(),
      status: 'active',
      createdBy: currentUser?.name || 'Unknown',
      activeUsers: 0
    };
    
    setFileProcesses([process, ...fileProcesses]);
    resetForm();
    setIsCreateDialogOpen(false);
  };

  const generateCSVFile = (process: FileProcess, startRow: number, endRow: number, userName: string) => {
    // Generate sample CSV content based on row range
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'Country', 'Status'];
    let csvContent = headers.join(',') + '\n';

    // Generate rows with realistic data
    for (let i = startRow; i <= endRow; i++) {
      const row = [
        i,
        `User ${i}`,
        `user${i}@example.com`,
        `+1234567${String(i).padStart(4, '0')}`,
        `${i} Main Street`,
        `City ${Math.floor(i / 100) + 1}`,
        'USA',
        i % 2 === 0 ? 'Active' : 'Pending'
      ];
      csvContent += row.join(',') + '\n';
    }

    // Create downloadable file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const fileName = `${userName.toLowerCase().replace(/\s+/g, '_')}_${process.name.toLowerCase().replace(/\s+/g, '_')}_${startRow}_${endRow}.csv`;

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return `/downloads/${fileName}`;
  };

  const handleApproveRequest = (requestId: string, processId: string, assignedCount: number) => {
    const process = fileProcesses.find(p => p.id === processId);
    const request = fileRequests.find(r => r.id === requestId);

    if (!process || !request) return;

    const startRow = process.processedRows + 1;
    const endRow = process.processedRows + assignedCount;

    // Generate CSV file for the user
    const downloadLink = generateCSVFile(process, startRow, endRow, request.userName);

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
                  placeholder="e.g., Aug-2025-File"
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
                        : '⚠️ Could not auto-detect row count. Please enter the total number of data rows manually.'
                    }
                  </p>
                </div>
              )}
              {newProcess.totalRows > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Available for processing:</strong> {newProcess.totalRows.toLocaleString()} rows
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    This will be the total number of data rows available for user allocation.
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
                disabled={!newProcess.name || !newProcess.projectId || !newProcess.uploadedFile || !newProcess.totalRows || newProcess.totalRows <= 0}
              >
                Create Process
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
              
              return (
                <Card key={process.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openProcessOverview(process)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{process.name}</h4>
                        <p className="text-sm text-muted-foreground">{process.projectName}</p>
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
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{process.activeUsers} users</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>View Details</span>
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
              {/* Process Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {selectedProcess.totalRows.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-700">Total Rows</div>
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
                    {selectedProcess.activeUsers}
                  </div>
                  <div className="text-xs text-purple-700">Active Users</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{((selectedProcess.processedRows / (selectedProcess.totalRows - selectedProcess.headerRows)) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(selectedProcess.processedRows / (selectedProcess.totalRows - selectedProcess.headerRows)) * 100} className="h-3" />
              </div>

              {/* Request History with Full Status Tracking */}
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOverviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
