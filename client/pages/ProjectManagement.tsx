import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  FileText,
  DollarSign,
  Timer,
  BarChart3,
  Activity
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  priority: 'low' | 'medium' | 'high';
  type: 'monthly' | 'weekly' | 'both';
  client: string;
  customClient?: string;

  // File-based tracking
  fileTargets: {
    monthly?: number;
    weekly?: number;
    dailyCapacity: number;
  };
  fileCounts: {
    monthlyCompleted: number;
    weeklyCompleted: number;
    dailyCompleted: number;
    totalCompleted: number;
  };
  rates: {
    ratePerFile: number;
    currency: 'USD';
  };

  // Legacy counts for compatibility
  targetCount: number;
  currentCount: number;

  assignedUsers: string[];
  createdBy: string;
  createdAt: string;
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'MO Project - Data Processing',
    description: 'Monthly and weekly file processing with automated daily tracking',
    status: 'active',
    priority: 'high',
    type: 'both',
    client: 'Mobius Dataservice',
    fileTargets: {
      monthly: 300000,
      weekly: 50000,
      dailyCapacity: 20000
    },
    fileCounts: {
      monthlyCompleted: 187500,
      weeklyCompleted: 32000,
      dailyCompleted: 18500,
      totalCompleted: 187500
    },
    rates: {
      ratePerFile: 0.05,
      currency: 'USD'
    },
    targetCount: 300000,
    currentCount: 187500,
    assignedUsers: ['2', '3', '4'],
    createdBy: 'Super Admin',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Customer Support Processing',
    description: 'Weekly customer support ticket processing',
    status: 'active',
    priority: 'medium',
    type: 'weekly',
    client: 'TechCorp Solutions',
    customClient: 'TechCorp Solutions',
    fileTargets: {
      weekly: 25000,
      dailyCapacity: 5000
    },
    fileCounts: {
      monthlyCompleted: 0,
      weeklyCompleted: 18600,
      dailyCompleted: 4200,
      totalCompleted: 48600
    },
    rates: {
      ratePerFile: 0.08,
      currency: 'USD'
    },
    targetCount: 25000,
    currentCount: 18600,
    assignedUsers: ['2', '5'],
    createdBy: 'John Smith',
    createdAt: '2024-01-05'
  },
  {
    id: '3',
    name: 'Invoice Processing',
    description: 'Monthly invoice processing system',
    status: 'inactive',
    priority: 'high',
    type: 'monthly',
    client: 'Mobius Dataservice',
    fileTargets: {
      monthly: 150000,
      dailyCapacity: 10000
    },
    fileCounts: {
      monthlyCompleted: 150000,
      weeklyCompleted: 0,
      dailyCompleted: 10000,
      totalCompleted: 150000
    },
    rates: {
      ratePerFile: 0.12,
      currency: 'USD'
    },
    targetCount: 150000,
    currentCount: 150000,
    assignedUsers: ['3', '4'],
    createdBy: 'Emily Wilson',
    createdAt: '2023-12-01'
  }
];

const mockUsers: User[] = [
  { id: '2', name: 'John Smith', email: 'john.smith@websyntactic.com', role: 'project_manager' },
  { id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@websyntactic.com', role: 'user' },
  { id: '4', name: 'Mike Davis', email: 'mike.davis@websyntactic.com', role: 'user' },
  { id: '5', name: 'Emily Wilson', email: 'emily.wilson@websyntactic.com', role: 'project_manager' }
];

export default function ProjectManagement() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    priority: 'medium' as 'low' | 'medium' | 'high',
    type: 'both' as 'monthly' | 'weekly' | 'both',
    client: 'mobius_dataservice',
    customClient: ''
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    
    if (currentUser?.role === 'user') {
      return matchesSearch && matchesStatus && project.assignedUsers.includes(currentUser.id);
    }
    
    return matchesSearch && matchesStatus;
  });

  const handleAddProject = () => {
    const project: Project = {
      id: (projects.length + 1).toString(),
      ...newProject,
      client: newProject.client === 'other' && newProject.customClient ? newProject.customClient : newProject.client === 'mobius_dataservice' ? 'Mobius Dataservice' : newProject.client,
      fileTargets: {
        monthly: 0,
        weekly: 0,
        dailyCapacity: 0
      },
      fileCounts: {
        monthlyCompleted: 0,
        weeklyCompleted: 0,
        dailyCompleted: 0,
        totalCompleted: 0
      },
      rates: {
        ratePerFile: 0,
        currency: 'USD'
      },
      targetCount: 0,
      currentCount: 0,
      assignedUsers: [],
      createdBy: currentUser?.name || 'Unknown',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setProjects([...projects, project]);
    resetNewProject();
    setIsAddDialogOpen(false);
  };

  const resetNewProject = () => {
    setNewProject({
      name: '',
      description: '',
      status: 'active',
      priority: 'medium',
      type: 'both',
      client: 'mobius_dataservice',
      customClient: ''
    });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      type: project.type,
      client: project.client === 'Mobius Dataservice' ? 'mobius_dataservice' : project.customClient ? 'other' : project.client,
      customClient: project.customClient || ''
    });
  };

  const handleUpdateProject = () => {
    if (!editingProject) return;
    
    setProjects(projects.map(p => 
      p.id === editingProject.id 
        ? {
            ...p,
            ...newProject,
            client: newProject.client === 'other' && newProject.customClient ? newProject.customClient : newProject.client === 'mobius_dataservice' ? 'Mobius Dataservice' : newProject.client
          }
        : p
    ));
    setEditingProject(null);
    resetNewProject();
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (project: Project) => {
    const target = project.type === 'monthly' 
      ? project.fileTargets.monthly 
      : project.type === 'weekly' 
        ? project.fileTargets.weekly 
        : Math.max(project.fileTargets.monthly || 0, project.fileTargets.weekly || 0);
    
    const completed = project.type === 'monthly' 
      ? project.fileCounts.monthlyCompleted 
      : project.type === 'weekly' 
        ? project.fileCounts.weeklyCompleted 
        : project.fileCounts.totalCompleted;
    
    return target > 0 ? Math.min((completed / target) * 100, 100) : 0;
  };

  const calculateEarnings = (project: Project) => {
    const totalCompleted = project.fileCounts.totalCompleted;
    const ratePerFile = project.rates.ratePerFile;
    const usdAmount = totalCompleted * ratePerFile;
    const inrAmount = usdAmount * 83; // Assuming 1 USD = 83 INR
    return { usd: usdAmount, inr: inrAmount };
  };

  const canManageProjects = currentUser?.role === 'super_admin' || currentUser?.role === 'project_manager';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage file processing projects with rate tracking and daily targets.
          </p>
        </div>
        {canManageProjects && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogDescription>
                  Create a new project with basic information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g., MO Project - Data Processing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Describe the project goals and requirements"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Project Type</Label>
                    <Select value={newProject.type} onValueChange={(value: any) => setNewProject({ ...newProject, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newProject.status} onValueChange={(value: any) => setNewProject({ ...newProject, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newProject.priority} onValueChange={(value: any) => setNewProject({ ...newProject, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select value={newProject.client} onValueChange={(value: any) => setNewProject({ ...newProject, client: value, customClient: '' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobius_dataservice">Mobius Dataservice</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newProject.client === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="customClient">Client Name</Label>
                    <Input
                      id="customClient"
                      value={newProject.customClient}
                      onChange={(e) => setNewProject({ ...newProject, customClient: e.target.value })}
                      placeholder="Enter client name"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetNewProject(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAddProject}>Add Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Processed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((sum, p) => sum + p.fileCounts.totalCompleted, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.reduce((sum, p) => sum + calculateEarnings(p).usd, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Capacity</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'active').reduce((sum, p) => sum + p.fileTargets.dailyCapacity, 0).toLocaleString()}
            </div>
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
                placeholder="Search projects by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects ({filteredProjects.length})</CardTitle>
          <CardDescription>
            Manage file processing projects with real-time tracking and billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Details</TableHead>
                <TableHead>Status & Type</TableHead>
                <TableHead>File Targets</TableHead>
                <TableHead>Progress & Earnings</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Client</TableHead>
                {canManageProjects && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                const earnings = calculateEarnings(project);
                const progress = getProgressPercentage(project);
                
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.description.length > 50
                            ? `${project.description.substring(0, 50)}...`
                            : project.description
                          }
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getPriorityBadgeColor(project.priority)}>
                            {project.priority.toUpperCase()}
                          </Badge>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${project.rates.ratePerFile}/file
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={getStatusBadgeColor(project.status)}>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {project.type === 'both' ? 'Monthly + Weekly' : 
                           project.type === 'monthly' ? 'Monthly' : 'Weekly'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {project.fileTargets.monthly && (
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Monthly: {project.fileTargets.monthly.toLocaleString()}
                          </div>
                        )}
                        {project.fileTargets.weekly && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Weekly: {project.fileTargets.weekly.toLocaleString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Timer className="h-3 w-3" />
                          Daily: {project.fileTargets.dailyCapacity.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{project.fileCounts.totalCompleted.toLocaleString()} files</span>
                          <span className="text-muted-foreground">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="text-xs space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-green-600">USD: ${earnings.usd.toFixed(2)}</span>
                            <span className="text-blue-600">INR: ₹{earnings.inr.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{project.assignedUsers.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(project.endDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    {canManageProjects && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditProject(project)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Manage Team
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Project
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{project.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProject(project.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project information, targets, and assignments.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="targets">File Targets</TabsTrigger>
              <TabsTrigger value="team">Team & Rates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Project Type</Label>
                  <Select value={newProject.type} onValueChange={(value: any) => setNewProject({ ...newProject, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={newProject.status} onValueChange={(value: any) => setNewProject({ ...newProject, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={newProject.priority} onValueChange={(value: any) => setNewProject({ ...newProject, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="targets" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dailyCapacity">Daily Capacity (Files per Day)</Label>
                <Input
                  id="edit-dailyCapacity"
                  type="number"
                  value={newProject.fileTargets.dailyCapacity}
                  onChange={(e) => setNewProject({ 
                    ...newProject, 
                    fileTargets: { 
                      ...newProject.fileTargets, 
                      dailyCapacity: parseInt(e.target.value) || 0 
                    } 
                  })}
                />
              </div>
              {(newProject.type === 'monthly' || newProject.type === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="edit-monthlyTarget">Monthly Target (Files)</Label>
                  <Input
                    id="edit-monthlyTarget"
                    type="number"
                    value={newProject.fileTargets.monthly}
                    onChange={(e) => setNewProject({ 
                      ...newProject, 
                      fileTargets: { 
                        ...newProject.fileTargets, 
                        monthly: parseInt(e.target.value) || 0 
                      } 
                    })}
                  />
                </div>
              )}
              {(newProject.type === 'weekly' || newProject.type === 'both') && (
                <div className="space-y-2">
                  <Label htmlFor="edit-weeklyTarget">Weekly Target (Files)</Label>
                  <Input
                    id="edit-weeklyTarget"
                    type="number"
                    value={newProject.fileTargets.weekly}
                    onChange={(e) => setNewProject({ 
                      ...newProject, 
                      fileTargets: { 
                        ...newProject.fileTargets, 
                        weekly: parseInt(e.target.value) || 0 
                      } 
                    })}
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="team" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ratePerFile">Rate per File (USD)</Label>
                <Input
                  id="edit-ratePerFile"
                  type="number"
                  step="0.01"
                  value={newProject.rates.ratePerFile}
                  onChange={(e) => setNewProject({ 
                    ...newProject, 
                    rates: { 
                      ...newProject.rates, 
                      ratePerFile: parseFloat(e.target.value) || 0 
                    } 
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Users</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {mockUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${user.id}`}
                        checked={newProject.assignedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewProject({
                              ...newProject,
                              assignedUsers: [...newProject.assignedUsers, user.id]
                            });
                          } else {
                            setNewProject({
                              ...newProject,
                              assignedUsers: newProject.assignedUsers.filter(id => id !== user.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`edit-${user.id}`} className="text-sm font-normal">
                        {user.name} ({user.role})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingProject(null); resetNewProject(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject}>Update Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
