import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Lock,
  Unlock,
  Key,
  UserCheck,
  Settings,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
  createdAt: string;
}

interface RoleAssignment {
  userId: string;
  userName: string;
  email: string;
  currentRole: string;
  assignedProjects: number;
  lastLogin: string;
}

const mockPermissions: Permission[] = [
  { id: 'user_create', name: 'Create Users', description: 'Ability to create new user accounts', module: 'User Management', action: 'create', isActive: true },
  { id: 'user_read', name: 'View Users', description: 'Ability to view user information', module: 'User Management', action: 'read', isActive: true },
  { id: 'user_update', name: 'Edit Users', description: 'Ability to modify user accounts', module: 'User Management', action: 'update', isActive: true },
  { id: 'user_delete', name: 'Delete Users', description: 'Ability to delete user accounts', module: 'User Management', action: 'delete', isActive: true },
  { id: 'project_create', name: 'Create Projects', description: 'Ability to create new projects', module: 'Project Management', action: 'create', isActive: true },
  { id: 'project_read', name: 'View Projects', description: 'Ability to view project information', module: 'Project Management', action: 'read', isActive: true },
  { id: 'project_update', name: 'Edit Projects', description: 'Ability to modify projects', module: 'Project Management', action: 'update', isActive: true },
  { id: 'project_delete', name: 'Delete Projects', description: 'Ability to delete projects', module: 'Project Management', action: 'delete', isActive: true },
  { id: 'count_submit', name: 'Submit Counts', description: 'Ability to submit daily counts', module: 'Daily Counts', action: 'create', isActive: true },
  { id: 'count_approve', name: 'Approve Counts', description: 'Ability to approve/reject daily counts', module: 'Daily Counts', action: 'approve', isActive: true },
  { id: 'reports_view', name: 'View Reports', description: 'Ability to access reports and analytics', module: 'Reports', action: 'read', isActive: true },
  { id: 'settings_manage', name: 'Manage Settings', description: 'Ability to configure system settings', module: 'Settings', action: 'manage', isActive: true }
];

const mockRoles: Role[] = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    permissions: mockPermissions.map(p => p.id),
    userCount: 1,
    isDefault: true,
    createdAt: '2024-01-01'
  },
  {
    id: 'project_manager',
    name: 'Project Manager',
    description: 'Manage projects and team performance',
    permissions: ['project_create', 'project_read', 'project_update', 'user_read', 'count_approve', 'reports_view'],
    userCount: 2,
    isDefault: true,
    createdAt: '2024-01-01'
  },
  {
    id: 'user',
    name: 'User',
    description: 'Basic user with limited access',
    permissions: ['project_read', 'count_submit'],
    userCount: 3,
    isDefault: true,
    createdAt: '2024-01-01'
  },
  {
    id: 'quality_analyst',
    name: 'Quality Analyst',
    description: 'Review and analyze work quality',
    permissions: ['project_read', 'count_approve', 'reports_view'],
    userCount: 0,
    isDefault: false,
    createdAt: '2024-01-15'
  }
];

const mockRoleAssignments: RoleAssignment[] = [
  { userId: '1', userName: 'Super Admin', email: 'admin@websyntactic.com', currentRole: 'super_admin', assignedProjects: 0, lastLogin: '2024-01-15 10:30' },
  { userId: '2', userName: 'John Smith', email: 'john.smith@websyntactic.com', currentRole: 'project_manager', assignedProjects: 3, lastLogin: '2024-01-15 09:15' },
  { userId: '3', userName: 'Sarah Johnson', email: 'sarah.johnson@websyntactic.com', currentRole: 'user', assignedProjects: 2, lastLogin: '2024-01-15 08:45' },
  { userId: '4', userName: 'Mike Davis', email: 'mike.davis@websyntactic.com', currentRole: 'user', assignedProjects: 1, lastLogin: '2024-01-12 16:20' },
  { userId: '5', userName: 'Emily Wilson', email: 'emily.wilson@websyntactic.com', currentRole: 'project_manager', assignedProjects: 2, lastLogin: '2024-01-15 11:00' }
];

export default function Permissions() {
  const { user: currentUser } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>(mockRoleAssignments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const modules = Array.from(new Set(permissions.map(p => p.module)));

  const filteredPermissions = permissions.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || permission.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const canManagePermissions = currentUser?.role === 'super_admin';

  if (!canManagePermissions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access Permissions Management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleCreateRole = () => {
    const role: Role = {
      id: newRole.name.toLowerCase().replace(/\s+/g, '_'),
      ...newRole,
      userCount: 0,
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setRoles([...roles, role]);
    setNewRole({ name: '', description: '', permissions: [] });
    setIsCreateRoleDialogOpen(false);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setNewRole({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
  };

  const handleUpdateRole = () => {
    if (!editingRole) return;
    
    setRoles(roles.map(r => 
      r.id === editingRole.id 
        ? { ...r, ...newRole }
        : r
    ));
    setEditingRole(null);
    setNewRole({ name: '', description: '', permissions: [] });
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(r => r.id !== roleId));
  };

  const togglePermission = (permissionId: string) => {
    setPermissions(permissions.map(p => 
      p.id === permissionId 
        ? { ...p, isActive: !p.isActive }
        : p
    ));
  };

  const handleRoleAssignment = (userId: string, newRoleId: string) => {
    setRoleAssignments(roleAssignments.map(assignment =>
      assignment.userId === userId
        ? { ...assignment, currentRole: newRoleId }
        : assignment
    ));
  };

  const getRoleBadgeColor = (roleId: string) => {
    switch (roleId) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'project_manager': return 'bg-blue-100 text-blue-800';
      case 'quality_analyst': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Permissions Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure role-based access control and permissions.
          </p>
        </div>
        <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with specific permissions and access levels.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the role responsibilities"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-4 space-y-3">
                  {modules.map((module) => (
                    <div key={module} className="space-y-2">
                      <h4 className="font-medium text-sm">{module}</h4>
                      <div className="space-y-2 ml-4">
                        {permissions.filter(p => p.module === module).map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={newRole.permissions.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewRole({
                                    ...newRole,
                                    permissions: [...newRole.permissions, permission.id]
                                  });
                                } else {
                                  setNewRole({
                                    ...newRole,
                                    permissions: newRole.permissions.filter(p => p !== permission.id)
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={permission.id} className="text-sm">
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole} disabled={!newRole.name}>
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.filter(p => p.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.filter(r => !r.isDefault).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="assignments">User Assignments</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Roles</CardTitle>
              <CardDescription>
                Manage roles and their associated permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="font-medium">{role.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {role.description}
                        </div>
                      </TableCell>
                      <TableCell>{role.userCount}</TableCell>
                      <TableCell>{role.permissions.length}</TableCell>
                      <TableCell>
                        <Badge variant={role.isDefault ? 'default' : 'secondary'}>
                          {role.isDefault ? 'System' : 'Custom'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          {!role.isDefault && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the "{role.name}" role? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteRole(role.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Permissions</CardTitle>
              <CardDescription>
                Configure individual permissions and their availability.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Used in Roles</TableHead>
                    <TableHead className="text-right">Toggle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.map((permission) => {
                    const usedInRoles = roles.filter(r => r.permissions.includes(permission.id)).length;
                    
                    return (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {permission.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.module}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{permission.action}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {permission.isActive ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-red-600">Inactive</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{usedInRoles} roles</TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={permission.isActive}
                            onCheckedChange={() => togglePermission(permission.id)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Role Assignments</CardTitle>
              <CardDescription>
                Manage role assignments for individual users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Current Role</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleAssignments.map((assignment) => (
                    <TableRow key={assignment.userId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(assignment.currentRole)}>
                          {roles.find(r => r.id === assignment.currentRole)?.name || assignment.currentRole}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.assignedProjects}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(assignment.lastLogin).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={assignment.currentRole}
                          onValueChange={(value) => handleRoleAssignment(assignment.userId, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Modify role permissions and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-4 space-y-3">
                {modules.map((module) => (
                  <div key={module} className="space-y-2">
                    <h4 className="font-medium text-sm">{module}</h4>
                    <div className="space-y-2 ml-4">
                      {permissions.filter(p => p.module === module).map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-${permission.id}`}
                            checked={newRole.permissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewRole({
                                  ...newRole,
                                  permissions: [...newRole.permissions, permission.id]
                                });
                              } else {
                                setNewRole({
                                  ...newRole,
                                  permissions: newRole.permissions.filter(p => p !== permission.id)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                            {permission.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
