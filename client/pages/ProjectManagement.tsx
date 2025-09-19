import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  Calendar,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive" | "planning" | "on_hold" | "completed";
  priority: "low" | "medium" | "high";
  type?: "monthly" | "weekly" | "both";
  client?: string;
  customClient?: string;
  fileTargets?: any;
  fileCounts?: any;
  rates?: any;
  targetCount?: number;
  currentCount?: number;
  assignedUsers?: string[];
  assignedUsersCount?: number;
  createdBy?: string;
  createdAt?: string;
  ratePerFileUSD?: number | null;
}

export default function ProjectManagement() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectCharts, setProjectCharts] = useState<
    { name: string; files: number; amount: number }[]
  >([]);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    status: "active" as any,
    priority: "medium" as any,
    type: "both" as any,
    client: "mobius_dataservice",
    customClient: "",
    assignedUsers: [] as string[],
    ratePerFileUSD: "" as any,
  });

  const canManageProjects =
    currentUser?.role === "super_admin" ||
    currentUser?.role === "project_manager";

  const mapApiToProject = (p: any): Project => ({
    id: String(p.id),
    name: p.name || "",
    description: p.description || "",
    status: (p.status as Project["status"]) || "active",
    priority: (p.priority as Project["priority"]) || "medium",
    type: p.type,
    client: p.client,
    customClient: p.customClient,
    fileTargets: p.fileTargets,
    fileCounts: p.fileCounts,
    rates: p.rates,
    targetCount: p.target_count ?? p.targetCount ?? 0,
    currentCount: p.current_count ?? p.currentCount ?? 0,
    assignedUsers: p.assigned_users
      ? p.assigned_users.map((u: any) => String(u))
      : p.assignedUsers || [],
    assignedUsersCount: parseInt(
      p.assigned_users_count ?? p.assignedUsersCount ?? 0,
    ),
    createdBy:
      p.created_by?.name ||
      p.createdBy?.name ||
      p.createdBy ||
      p.created_by_name ||
      "",
    createdAt: p.created_at || p.createdAt,
    ratePerFileUSD: p.ratePerFileUSD ?? p.rate_per_file_usd ?? null,
  });

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getProjects({ page: 1, limit: 100 });
      // res is PaginatedResponse
      const items = (res && (res as any).data) || res || [];
      // If API returned paginated shape directly, handle both
      const list = Array.isArray(items) ? items : (items && items.data) || [];
      const mapped = list.map(mapApiToProject);
      setProjects(mapped);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setError(String(err.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // Load project-wise metrics for current month
    (async () => {
      try {
        const month = new Date().toISOString().substring(0, 7);
        const resp: any = await apiClient.getBillingSummary(month, 1);
        const summaries = (resp && (resp as any).data) || resp || [];
        const monthSummary = Array.isArray(summaries)
          ? summaries.find((s: any) => s.month === month)
          : null;
        const items =
          (monthSummary?.projects || monthSummary || []).projects ||
          monthSummary?.projects ||
          [];
        const charts = (items as any[]).map((p: any) => ({
          name: p.projectName || p.project_name || "Project",
          files: Number(p.totalFilesCompleted || 0),
          amount: Number(p.amountINR || p.amountUsd || 0),
        }));
        setProjectCharts(charts);
      } catch (e) {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetNewProject = () => {
    setNewProject({
      name: "",
      description: "",
      status: "active",
      priority: "medium",
      type: "both",
      client: "mobius_dataservice",
      customClient: "",
      assignedUsers: [] as string[],
      ratePerFileUSD: "",
    });
  };

  const handleAddProject = async () => {
    try {
      setIsLoading(true);
      const payload: any = {
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        priority: newProject.priority,
        ratePerFileUSD:
          newProject.ratePerFileUSD !== "" && newProject.ratePerFileUSD !== null
            ? Number(newProject.ratePerFileUSD)
            : undefined,
        // server expects startDate/endDate/targetCount optionally
      };
      const created = await apiClient.createProject(payload);
      // createProject returns created project inside data
      const createdProj = mapApiToProject(created as any);
      setProjects((p) => [createdProj, ...p]);
      resetNewProject();
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Create project failed", err);
      setError(String((err as any).message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name || "",
      description: project.description || "",
      status: project.status || "active",
      priority: project.priority || "medium",
      type: project.type || "both",
      client: project.client || "mobius_dataservice",
      customClient: project.customClient || "",
      assignedUsers: project.assignedUsers || [],
      ratePerFileUSD:
        project.ratePerFileUSD ?? (project as any).rate_per_file_usd ?? "",
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    try {
      setIsLoading(true);
      const payload: any = {
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        priority: newProject.priority,
        ratePerFileUSD:
          newProject.ratePerFileUSD !== "" && newProject.ratePerFileUSD !== null
            ? Number(newProject.ratePerFileUSD)
            : undefined,
      };
      const updated = await apiClient.updateProject(editingProject.id, payload);
      const mapped = mapApiToProject(updated as any);
      setProjects((ps) => ps.map((p) => (p.id === mapped.id ? mapped : p)));
      setEditingProject(null);
      resetNewProject();
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Update project failed", err);
      setError(String((err as any).message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      setIsLoading(true);
      await apiClient.deleteProject(projectId);
      setProjects((p) => p.filter((x) => x.id !== projectId));
    } catch (err) {
      console.error("Delete project failed", err);
      setError(String((err as any).message || err));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      (project.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || project.status === selectedStatus;

    if (currentUser?.role === "user") {
      return (
        matchesSearch &&
        matchesStatus &&
        (project.assignedUsers || []).includes(currentUser.id)
      );
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Project Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage file processing projects with rate tracking and
            daily targets.
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
                <DialogTitle>
                  {editingProject ? "Edit Project" : "Add New Project"}
                </DialogTitle>
                <DialogDescription>Create or edit a project.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newProject.name}
                    onChange={(e) =>
                      setNewProject({ ...newProject, name: e.target.value })
                    }
                    placeholder="e.g., MO Project - Data Processing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Project Type</Label>
                    <Select
                      value={newProject.type}
                      onValueChange={(value: any) =>
                        setNewProject({ ...newProject, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Both</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newProject.status}
                      onValueChange={(value: any) =>
                        setNewProject({ ...newProject, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newProject.priority}
                      onValueChange={(value: any) =>
                        setNewProject({ ...newProject, priority: value })
                      }
                    >
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
                  <div className="space-y-2">
                    <Label htmlFor="ratePerFileUSD">Cost per file ($)</Label>
                    <Input
                      id="ratePerFileUSD"
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 0.05"
                      value={newProject.ratePerFileUSD}
                      onChange={(e) =>
                        setNewProject({
                          ...newProject,
                          ratePerFileUSD: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <div className="flex gap-2 justify-end w-full">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setEditingProject(null);
                        resetNewProject();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        editingProject
                          ? handleUpdateProject()
                          : handleAddProject();
                      }}
                    >
                      {isLoading
                        ? "Saving..."
                        : editingProject
                          ? "Update Project"
                          : "Create Project"}
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && <div className="text-red-600">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>
            Manage your projects and assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Input
              placeholder="Search projects"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {projectCharts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Volume (Files Completed)</CardTitle>
                  <CardDescription>
                    Which projects processed the most files this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={projectCharts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide={false} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="files" name="Files" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Project Revenue (₹)</CardTitle>
                  <CardDescription>
                    Which projects generated the most this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={projectCharts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide={false} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" name="Amount (₹)" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {project.description}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Rate:{" "}
                      {project.ratePerFileUSD
                        ? `$${project.ratePerFileUSD}`
                        : "—"}
                    </div>
                    <div className="text-xs text-purple-600">
                      Assigned Users: {project.assignedUsersCount ?? 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize">{project.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize">{project.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <Progress
                      value={
                        project.currentCount && project.targetCount
                          ? Math.min(
                              (project.currentCount /
                                Math.max(1, project.targetCount)) *
                                100,
                              100,
                            )
                          : 0
                      }
                    />
                  </TableCell>
                  <TableCell>{project.createdAt?.split("T")[0]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {canManageProjects && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProject(project)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                const data: any =
                                  await apiClient.getProjectProgress(
                                    project.id,
                                  );
                                const d =
                                  (data && (data as any).data) || data || {};
                                alert(
                                  `Progress for ${project.name}:\nTarget: ${d.targetCount || 0}\nCurrent: ${d.currentCount || 0}\nEfficiency: ${(d.overallEfficiency || 0).toFixed ? (d.overallEfficiency || 0).toFixed(1) : d.overallEfficiency || 0}%`,
                                );
                              } catch (_) {}
                            }}
                          >
                            View Progress
                          </DropdownMenuItem>
                          {canManageProjects && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleEditProject(project)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {isLoading && (
            <div className="mt-4 text-sm text-muted-foreground">Loading...</div>
          )}
          {!isLoading && filteredProjects.length === 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              No projects found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
