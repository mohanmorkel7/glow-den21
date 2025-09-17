import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings,
  TrendingUp,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api";

interface Project {
  id: string;
  name: string;
  client: string;
  status: "active" | "inactive";
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
  status: "pending" | "active" | "in_progress" | "completed" | "paused";
  createdBy: string;
  activeUsers: number;
  type: "automation" | "manual";
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
  status: "pending" | "assigned" | "completed" | "in_progress" | "received";
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
  {
    id: "1",
    name: "MO Project - Data Processing",
    client: "Mobius Dataservice",
    status: "active",
  },
  {
    id: "2",
    name: "Customer Support Processing",
    client: "TechCorp Solutions",
    status: "active",
  },
  {
    id: "3",
    name: "Invoice Processing",
    client: "Mobius Dataservice",
    status: "inactive",
  },
];

const mockFileProcesses: FileProcess[] = [
  {
    id: "fp_1",
    name: "Aug-2025-File",
    projectId: "1",
    projectName: "MO Project - Data Processing",
    fileName: "customer_data_aug_2025.xlsx",
    totalRows: 300000,
    headerRows: 1,
    processedRows: 45000,
    availableRows: 255000,
    uploadDate: "2024-01-20T09:00:00Z",
    status: "active",
    createdBy: "John Smith",
    activeUsers: 3,
    type: "manual",
  },
  {
    id: "fp_2",
    name: "July-2025-Invoice",
    projectId: "3",
    projectName: "Invoice Processing",
    fileName: "invoice_data_july_2025.csv",
    totalRows: 150000,
    headerRows: 1,
    processedRows: 150000,
    availableRows: 0,
    uploadDate: "2024-01-15T14:30:00Z",
    status: "completed",
    createdBy: "Emily Wilson",
    activeUsers: 0,
    type: "manual",
  },
  {
    id: "fp_3",
    name: "Automation-DataSync-Jan2025",
    projectId: "1",
    projectName: "MO Project - Data Processing",
    totalRows: 500000,
    headerRows: 0,
    processedRows: 125000,
    availableRows: 375000,
    uploadDate: "2024-01-10T08:00:00Z",
    status: "in_progress",
    createdBy: "John Smith",
    activeUsers: 0,
    type: "automation",
    dailyTarget: 25000,
    automationConfig: {
      toolName: "DataSync Pro",
      lastUpdate: "2024-01-20T23:59:00Z",
      dailyCompletions: [
        { date: "2024-01-15", completed: 25000 },
        { date: "2024-01-16", completed: 24800 },
        { date: "2024-01-17", completed: 25200 },
        { date: "2024-01-18", completed: 24900 },
        { date: "2024-01-19", completed: 25100 },
      ],
    },
  },
  {
    id: "fp_5",
    name: "Automation-EmailCampaign-Jan2025",
    projectId: "2",
    projectName: "Customer Support Processing",
    totalRows: 75000,
    headerRows: 0,
    processedRows: 0,
    availableRows: 75000,
    uploadDate: "2024-01-22T09:00:00Z",
    status: "pending",
    createdBy: "Sarah Johnson",
    activeUsers: 0,
    type: "automation",
    dailyTarget: 5000,
    automationConfig: {
      toolName: "Email Automation Pro",
      lastUpdate: "2024-01-22T09:00:00Z",
      dailyCompletions: [],
    },
  },
  {
    id: "fp_4",
    name: "Automation-LeadGen-Dec2024",
    projectId: "2",
    projectName: "Customer Support Processing",
    totalRows: 200000,
    headerRows: 0,
    processedRows: 200000,
    availableRows: 0,
    uploadDate: "2024-12-01T10:00:00Z",
    status: "completed",
    createdBy: "Emily Wilson",
    activeUsers: 0,
    type: "automation",
    dailyTarget: 8000,
    automationConfig: {
      toolName: "Lead Generator AI",
      lastUpdate: "2024-12-25T23:59:00Z",
      dailyCompletions: [
        { date: "2024-12-20", completed: 8000 },
        { date: "2024-12-21", completed: 8000 },
        { date: "2024-12-22", completed: 8000 },
        { date: "2024-12-23", completed: 8000 },
        { date: "2024-12-24", completed: 8000 },
      ],
    },
  },
];

const mockFileRequests: FileRequest[] = [
  {
    id: "1",
    userId: "3",
    userName: "Sarah Johnson",
    fileProcessId: "fp_1",
    requestedCount: 1000,
    requestedDate: "2024-01-20T10:30:00Z",
    status: "pending",
  },
  {
    id: "2",
    userId: "4",
    userName: "Mike Davis",
    fileProcessId: "fp_1",
    requestedCount: 800,
    requestedDate: "2024-01-20T11:15:00Z",
    status: "assigned",
    assignedBy: "John Smith",
    assignedDate: "2024-01-20T12:00:00Z",
    assignedCount: 800,
    startRow: 44201,
    endRow: 45000,
  },
];

const mockHistoricalProcesses: HistoricalFileProcess[] = [
  {
    id: "hfp_1",
    name: "June-2024-DataEntry",
    projectName: "MO Project - Data Processing",
    fileName: "customer_data_june_2024.xlsx",
    totalRows: 250000,
    processedRows: 250000,
    createdDate: "2024-06-01T09:00:00Z",
    completedDate: "2024-06-15T17:30:00Z",
    createdBy: "John Smith",
    duration: "14 days",
    totalUsers: 8,
    avgProcessingRate: 1190,
  },
  {
    id: "hfp_2",
    name: "May-2024-Invoice",
    projectName: "Invoice Processing",
    fileName: "invoice_data_may_2024.csv",
    totalRows: 180000,
    processedRows: 180000,
    createdDate: "2024-05-01T08:00:00Z",
    completedDate: "2024-05-12T16:45:00Z",
    createdBy: "Emily Wilson",
    duration: "11 days",
    totalUsers: 6,
    avgProcessingRate: 1364,
  },
  {
    id: "hfp_3",
    name: "April-2024-Support",
    projectName: "Customer Support Processing",
    fileName: "support_tickets_april_2024.xlsx",
    totalRows: 75000,
    processedRows: 75000,
    createdDate: "2024-04-01T10:00:00Z",
    completedDate: "2024-04-08T14:20:00Z",
    createdBy: "John Smith",
    duration: "7 days",
    totalUsers: 4,
    avgProcessingRate: 1339,
  },
];

const mockHistoricalAssignments: HistoricalAssignment[] = [
  {
    id: "ha_1",
    processName: "June-2024-DataEntry",
    userName: "Sarah Johnson",
    assignedCount: 15000,
    completedCount: 15000,
    assignedDate: "2024-06-02T09:00:00Z",
    completedDate: "2024-06-07T16:30:00Z",
    processingTime: "5.5 days",
    efficiency: 95.2,
  },
  {
    id: "ha_2",
    processName: "June-2024-DataEntry",
    userName: "Mike Davis",
    assignedCount: 12000,
    completedCount: 12000,
    assignedDate: "2024-06-03T10:15:00Z",
    completedDate: "2024-06-08T15:45:00Z",
    processingTime: "5.2 days",
    efficiency: 98.1,
  },
  {
    id: "ha_3",
    processName: "May-2024-Invoice",
    userName: "Lisa Chen",
    assignedCount: 20000,
    completedCount: 19500,
    assignedDate: "2024-05-02T08:30:00Z",
    completedDate: "2024-05-09T17:00:00Z",
    processingTime: "7.3 days",
    efficiency: 97.5,
  },
  {
    id: "ha_4",
    processName: "May-2024-Invoice",
    userName: "John Williams",
    assignedCount: 18000,
    completedCount: 18000,
    assignedDate: "2024-05-01T09:00:00Z",
    completedDate: "2024-05-07T14:30:00Z",
    processingTime: "6.2 days",
    efficiency: 100,
  },
  {
    id: "ha_5",
    processName: "April-2024-Support",
    userName: "Emma Rodriguez",
    assignedCount: 8500,
    completedCount: 8500,
    assignedDate: "2024-04-02T11:00:00Z",
    completedDate: "2024-04-05T16:15:00Z",
    processingTime: "3.2 days",
    efficiency: 100,
  },
];

// Mock verification requests - files uploaded by users awaiting approval
const mockVerificationRequests = [
  {
    id: "vr_1",
    userId: "3",
    userName: "Sarah Johnson",
    userEmail: "sarah.johnson@websyntactic.com",
    fileProcessId: "fp_1",
    fileProcessName: "Aug-2025-File",
    requestedCount: 1000,
    startRow: 1001,
    endRow: 2000,
    uploadedFile: {
      name: "sarah_johnson_completed_work.zip",
      size: 15728640, // 15MB
      uploadDate: "2024-01-21T16:30:00Z",
    },
    status: "pending_verification",
    submittedDate: "2024-01-21T16:30:00Z",
    notes:
      "Completed all 1000 records with data validation and quality checks.",
    assignedBy: "John Smith",
    assignedDate: "2024-01-20T11:00:00Z",
  },
  {
    id: "vr_2",
    userId: "4",
    userName: "Mike Davis",
    userEmail: "mike.davis@websyntactic.com",
    fileProcessId: "fp_1",
    fileProcessName: "Aug-2025-File",
    requestedCount: 800,
    startRow: 2001,
    endRow: 2800,
    uploadedFile: {
      name: "mike_davis_processed_files.zip",
      size: 12582912, // 12MB
      uploadDate: "2024-01-21T18:45:00Z",
    },
    status: "pending_verification",
    submittedDate: "2024-01-21T18:45:00Z",
    notes:
      "All files processed according to specifications. Included summary report.",
    assignedBy: "Emily Wilson",
    assignedDate: "2024-01-20T14:30:00Z",
  },
  {
    id: "vr_3",
    userId: "5",
    userName: "David Chen",
    userEmail: "david.chen@websyntactic.com",
    fileProcessId: "fp_2",
    fileProcessName: "July-2025-Invoice",
    requestedCount: 1200,
    startRow: 1,
    endRow: 1200,
    uploadedFile: {
      name: "david_chen_invoice_processing.zip",
      size: 8388608, // 8MB
      uploadDate: "2024-01-20T20:15:00Z",
    },
    status: "verified",
    submittedDate: "2024-01-20T20:15:00Z",
    verifiedDate: "2024-01-21T10:00:00Z",
    verifiedBy: "Emily Wilson",
    verificationNotes:
      "Excellent work. All invoices processed correctly with proper formatting.",
    notes: "Processed all invoice data with accuracy checks. Ready for review.",
    assignedBy: "John Smith",
    assignedDate: "2024-01-19T09:00:00Z",
  },
];

export default function FileProcess() {
  const { user: currentUser } = useAuth();
  const [fileProcesses, setFileProcesses] = useState<FileProcess[]>([]);
  const [fileRequests, setFileRequests] = useState<FileRequest[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const processes = await apiClient.getFileProcesses({
        page: 1,
        limit: 200,
      });
      const list = Array.isArray(processes)
        ? processes
        : (processes as any) || [];

      // Normalize file_processes fields from server (snake_case) to client camelCase
      const normalizedProcesses = (list as any[]).map((p: any) => ({
        id: p.id,
        name: p.name,
        projectId: p.project_id || p.projectId || null,
        projectName: p.project_name || p.projectName || null,
        fileName: p.file_name || p.fileName || null,
        totalRows: p.total_rows ?? p.totalRows ?? 0,
        headerRows: p.header_rows ?? p.headerRows ?? 0,
        processedRows: p.processed_rows ?? p.processedRows ?? 0,
        availableRows:
          p.available_rows ??
          p.availableRows ??
          p.total_rows ??
          p.totalRows ??
          0,
        uploadDate: p.upload_date || p.uploadDate || null,
        status: p.status || "pending",
        createdBy: p.created_by || p.createdBy || null,
        activeUsers: p.active_users ?? p.activeUsers ?? 0,
        type: p.type || "manual",
        dailyTarget: p.daily_target ?? p.dailyTarget ?? null,
        automationConfig: p.automation_config || p.automationConfig || null,
        createdAt: p.created_at || p.createdAt || null,
        updatedAt: p.updated_at || p.updatedAt || null,
      }));

      setFileProcesses(normalizedProcesses as any);

      const requests = await apiClient.getFileRequests({ page: 1, limit: 500 });
      const reqList = Array.isArray(requests)
        ? requests
        : (requests as any) || [];

      // Normalize server field names (snake_case) to client camelCase and provide defaults
      const normalized = (reqList as any[]).map((r: any) => ({
        id: r.id,
        userId: r.user_id || r.userId || null,
        userName: r.user_name || r.userName || "",
        requestedCount: r.requested_count ?? r.requestedCount ?? 0,
        requestedDate:
          r.requested_date ||
          r.requestedDate ||
          r.created_at ||
          new Date().toISOString(),
        status: r.status || "pending",
        fileProcessId: r.file_process_id || r.fileProcessId || null,
        fileProcessName: r.file_process_name || r.fileProcessName || null,
        assignedBy: r.assigned_by || r.assignedBy || null,
        assignedDate: r.assigned_date || r.assignedDate || null,
        downloadLink: r.download_link || r.downloadLink || null,
        completedDate: r.completed_date || r.completedDate || null,
        startRow: r.start_row ?? r.startRow ?? null,
        endRow: r.end_row ?? r.endRow ?? null,
        notes: r.notes || null,
        verificationStatus:
          r.verification_status || r.verificationStatus || null,
        verifiedBy: r.verified_by || r.verifiedBy || null,
        verifiedDate: r.verified_date || r.verifiedDate || null,
        outputFile: r.output_file || r.outputFile || null,
      }));

      setFileRequests(normalized as any);
      // Load active projects
      try {
        const projs = await apiClient.getProjects({
          status: "active",
          limit: 200,
        });
        const projList =
          (projs as any)?.data || (Array.isArray(projs) ? projs : []);
        setProjects(projList as any);
      } catch (e) {
        console.warn("Failed to load projects", e);
      }
    } catch (err: any) {
      console.error("Failed to load file process data", err);
      setError(String(err?.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Use live data from API for verification requests
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [selectedProcessForRequest, setSelectedProcessForRequest] = useState<
    Record<string, string>
  >({});
  const [selectedProcess, setSelectedProcess] = useState<FileProcess | null>(
    null,
  );
  const [isOverviewDialogOpen, setIsOverviewDialogOpen] = useState(false);
  const [newProcess, setNewProcess] = useState({
    name: "",
    projectId: "",
    fileName: "",
    totalRows: 0,
    uploadedFile: null as File | null,
    type: "manual" as "automation" | "manual",
    dailyTarget: 0,
    automationToolName: "",
  });
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedAutomationProcess, setSelectedAutomationProcess] =
    useState<FileProcess | null>(null);
  const [dailyUpdate, setDailyUpdate] = useState({
    completed: 0,
    date: new Date().toISOString().split("T")[0],
  });
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [selectedProcessStatus, setSelectedProcessStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [isBreakdownDialogOpen, setIsBreakdownDialogOpen] = useState(false);
  const [selectedHistoricalProcess, setSelectedHistoricalProcess] =
    useState<HistoricalFileProcess | null>(null);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] =
    useState(false);
  const [selectedVerificationRequest, setSelectedVerificationRequest] =
    useState<any>(null);
  const [verificationNotes, setVerificationNotes] = useState("");

  // Only allow admin/project_manager to access this page
  if (
    currentUser?.role !== "super_admin" &&
    currentUser?.role !== "project_manager"
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            This page is only accessible to administrators and project managers.
          </p>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setNewProcess({
      name: "",
      projectId: "",
      fileName: "",
      totalRows: 0,
      uploadedFile: null,
      type: "manual",
      dailyTarget: 0,
      automationToolName: "",
    });
    setSelectedProcessStatus("");

    // Clear file input
    const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleDailyAutomationUpdate = (
    processId: string,
    editDate?: string,
  ) => {
    const process = fileProcesses.find((p) => p.id === processId);
    if (!process || process.type !== "automation") return;

    // Check if process allows updates
    if (!canUpdateAutomation(process)) {
      if (process.status === "completed") {
        alert(
          `Process "${process.name}" is completed. Updates are no longer allowed to maintain data integrity.`,
        );
      } else if (process.status === "pending") {
        alert(
          `Process "${process.name}" is pending. Please change status to 'In Progress' before updating counts.`,
        );
      } else {
        alert(
          `Process "${process.name}" cannot be updated in its current state.`,
        );
      }
      return;
    }

    const targetDate = editDate || new Date().toISOString().split("T")[0];
    const existingCompletion = process.automationConfig?.dailyCompletions.find(
      (d) => d.date === targetDate,
    );

    setSelectedAutomationProcess(process);
    setDailyUpdate({
      completed: existingCompletion
        ? existingCompletion.completed
        : process.dailyTarget || 0,
      date: targetDate,
    });
    setIsEditingExisting(!!existingCompletion);
    setIsUpdateDialogOpen(true);
  };

  const submitDailyUpdate = () => {
    if (!selectedAutomationProcess) return;

    const updatedProcesses = fileProcesses.map((p) => {
      if (
        p.id === selectedAutomationProcess.id &&
        p.type === "automation" &&
        p.automationConfig
      ) {
        // Check if there's already an entry for this date
        const existingEntryIndex =
          p.automationConfig.dailyCompletions.findIndex(
            (d) => d.date === dailyUpdate.date,
          );
        let updatedCompletions = [...p.automationConfig.dailyCompletions];
        let processedRowsDiff = dailyUpdate.completed;

        if (existingEntryIndex >= 0) {
          // Update existing entry
          const oldCompleted = updatedCompletions[existingEntryIndex].completed;
          updatedCompletions[existingEntryIndex] = {
            date: dailyUpdate.date,
            completed: dailyUpdate.completed,
          };
          processedRowsDiff = dailyUpdate.completed - oldCompleted;
        } else {
          // Add new entry
          updatedCompletions = [
            ...updatedCompletions,
            { date: dailyUpdate.date, completed: dailyUpdate.completed },
          ].slice(-30); // Keep last 30 days
        }

        const newProcessedRows = p.processedRows + processedRowsDiff;
        const newAvailableRows = p.totalRows - newProcessedRows;

        return {
          ...p,
          processedRows: Math.max(0, newProcessedRows),
          availableRows: Math.max(0, newAvailableRows),
          status: newAvailableRows <= 0 ? ("completed" as const) : p.status,
          automationConfig: {
            ...p.automationConfig,
            lastUpdate: new Date().toISOString(),
            dailyCompletions: updatedCompletions,
          },
        };
      }
      return p;
    });

    setFileProcesses(updatedProcesses);
    setIsUpdateDialogOpen(false);
    setSelectedAutomationProcess(null);
  };

  const getAutomationStats = () => {
    const automationProcesses = fileProcesses.filter(
      (p) => p.type === "automation",
    );
    const totalAutomationRows = automationProcesses.reduce(
      (sum, p) => sum + p.totalRows,
      0,
    );
    const totalAutomationProcessed = automationProcesses.reduce(
      (sum, p) => sum + p.processedRows,
      0,
    );
    const activeAutomationProcesses = automationProcesses.filter(
      (p) => p.status === "active" || p.status === "in_progress",
    ).length;

    return {
      totalProcesses: automationProcesses.length,
      activeProcesses: activeAutomationProcesses,
      totalRows: totalAutomationRows,
      processedRows: totalAutomationProcessed,
      efficiency:
        totalAutomationRows > 0
          ? (totalAutomationProcessed / totalAutomationRows) * 100
          : 0,
    };
  };

  const automationStats = getAutomationStats();

  // Build history from real data
  const getCurrentMonthCompletedProcesses = () => {
    const currentMonth = new Date().toISOString().substring(0, 7);
    return fileProcesses
      .filter((p: any) => p.status === "completed")
      .filter((p: any) => (p.updatedAt || p.uploadDate || "").substring(0, 7) === currentMonth)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        projectName: p.projectName,
        fileName: p.fileName || "",
        totalRows: p.totalRows,
        processedRows: p.processedRows,
        createdDate: p.uploadDate || p.createdAt || new Date().toISOString(),
        completedDate: p.updatedAt || new Date().toISOString(),
        createdBy: p.createdBy || "",
        duration: "",
        totalUsers: p.activeUsers || 0,
        avgProcessingRate: 0,
      }));
  };

  const getProcessesByMonth = () => {
    const completed = fileProcesses.filter((p: any) => p.status === "completed");
    const map = new Map<string, any[]>();
    completed.forEach((p: any) => {
      const month = (p.updatedAt || p.uploadDate || "").substring(0, 7) || "unknown";
      const item = {
        id: p.id,
        name: p.name,
        projectName: p.projectName,
        fileName: p.fileName || "",
        totalRows: p.totalRows,
        processedRows: p.processedRows,
        createdDate: p.uploadDate || p.createdAt || new Date().toISOString(),
        completedDate: p.updatedAt || new Date().toISOString(),
        createdBy: p.createdBy || "",
        duration: "",
        totalUsers: p.activeUsers || 0,
        avgProcessingRate: 0,
      };
      map.set(month, [...(map.get(month) || []), item]);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, processes]) => ({
        month,
        monthName: new Date((month || "1970-01") + "-01").toLocaleDateString("en-US", { year: "numeric", month: "long" }),
        processes,
      }));
  };

  const getAssignmentsByMonth = () => {
    const enrich = (r: any) => ({
      id: r.id,
      processName:
        r.file_process_name || r.fileProcessName ||
        fileProcesses.find((p) => p.id === (r.file_process_id || r.fileProcessId))?.name ||
        "",
      userName: r.user_name || r.userName || "",
      assignedCount: r.assigned_count || r.requested_count || r.requestedCount || 0,
      completedCount: r.status === "verified" || r.status === "completed" ? (r.assigned_count || r.requested_count || r.requestedCount || 0) : 0,
      assignedDate: r.assigned_date || r.requested_date || r.requestedDate || new Date().toISOString(),
      completedDate: r.completed_date || r.updated_at || new Date().toISOString(),
      processingTime: "",
      efficiency: 100,
    });
    const history = fileRequests.filter((r: any) => ["completed", "verified", "pending_verification", "in_progress"].includes(r.status)).map(enrich);
    if (selectedMonth === "all") return history;
    return history.filter((h: any) => (h.completedDate || "").substring(0, 7) === selectedMonth);
  };

  const currentMonthProcesses = getCurrentMonthCompletedProcesses();
  const processesByMonth = getProcessesByMonth();
  const filteredAssignments = getAssignmentsByMonth();

  const handleProcessBreakdown = (process: HistoricalFileProcess) => {
    setSelectedHistoricalProcess(process);
    setIsBreakdownDialogOpen(true);
  };

  const handleVerificationReview = (request: any) => {
    setSelectedVerificationRequest(request);
    setVerificationNotes(request.verificationNotes || "");
    setIsVerificationDialogOpen(true);
  };

  const handleVerificationApproval = async (
    requestId: string,
    action: "approve" | "reject",
  ) => {
    try {
      await apiClient.updateFileRequest(requestId, {
        status: action === "approve" ? "verified" : "rejected",
        notes: verificationNotes || undefined,
      } as any);
      await loadData();
    } catch (e) {
      console.error("Failed to update verification status", e);
      alert("Failed to update verification status");
    }

    setIsVerificationDialogOpen(false);
    setSelectedVerificationRequest(null);
    setVerificationNotes("");
  };

  const getPendingVerifications = () =>
    fileRequests.filter((req: any) => req.status === "pending_verification");

  const getVerifiedFiles = () =>
    fileRequests.filter(
      (req: any) => req.status === "verified" || req.status === "rejected",
    );

  const handleStatusChange = (processId: string, newStatus: string) => {
    const updatedProcesses = fileProcesses.map((p) => {
      if (p.id === processId) {
        return {
          ...p,
          status: newStatus as FileProcess["status"],
        };
      }
      return p;
    });

    setFileProcesses(updatedProcesses);

    // Update the selected process if it's currently being viewed
    if (selectedProcess?.id === processId) {
      const updatedProcess = updatedProcesses.find((p) => p.id === processId);
      setSelectedProcess(updatedProcess || null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // Handle Excel files differently since they're binary ZIP archives
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      console.log("Excel file detected - requires manual row count entry");
      setNewProcess({
        ...newProcess,
        fileName: file.name,
        totalRows: 0, // Must be entered manually for Excel files
        uploadedFile: file,
      });
      return;
    }

    // For CSV and other text files, attempt to read and count rows
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      if (!text || text.startsWith("PK")) {
        // If file can't be read as text or is binary, require manual entry
        console.log(
          "Binary file detected or read failed - requires manual entry",
        );
        setNewProcess({
          ...newProcess,
          fileName: file.name,
          totalRows: 0,
          uploadedFile: file,
        });
        return;
      }

      // Count rows for text-based files
      const lines = text.split(/\r?\n/);
      const nonEmptyLines = lines.filter((line) => line.trim() !== "");
      const rowCount = nonEmptyLines.length;

      console.log("File content preview:", text.substring(0, 100));
      console.log("Total lines found:", lines.length);
      console.log("Non-empty lines:", rowCount);

      setNewProcess({
        ...newProcess,
        fileName: file.name,
        totalRows: rowCount,
        uploadedFile: file,
      });
    };

    reader.onerror = () => {
      console.log("File reading error - requires manual entry");
      setNewProcess({
        ...newProcess,
        fileName: file.name,
        totalRows: 0,
        uploadedFile: file,
      });
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleCreateProcess = async () => {
    try {
      const project = projects.find((p: any) => p.id === newProcess.projectId);
      const payload: any = {
        name: newProcess.name,
        projectId: newProcess.projectId || null,
        projectName: project?.name || null,
        fileName: newProcess.type === "manual" ? newProcess.fileName : null,
        totalRows: newProcess.totalRows,
        type: newProcess.type,
        dailyTarget:
          newProcess.type === "automation" ? newProcess.dailyTarget : null,
        automationConfig:
          newProcess.type === "automation"
            ? {
                toolName: newProcess.automationToolName,
                lastUpdate: new Date().toISOString(),
                dailyCompletions: [],
              }
            : null,
      };

      if (editingProcessId) {
        await apiClient.updateFileProcess(editingProcessId, payload);
      } else {
        await apiClient.createFileProcess(payload);
      }
      await loadData();
      resetForm();
      setEditingProcessId(null);
      setIsCreateDialogOpen(false);
    } catch (e) {
      alert("Failed to save file process");
      console.error(e);
    }
  };

  const generateDownloadLink = (
    process: FileProcess,
    startRow: number,
    endRow: number,
    userName: string,
  ) => {
    // Generate filename without triggering download
    const fileName = `${userName.toLowerCase().replace(/\s+/g, "_")}_${process.name.toLowerCase().replace(/\s+/g, "_")}_${startRow}_${endRow}.csv`;
    return `/downloads/${fileName}`;
  };

  const handleApproveRequest = async (
    requestId: string,
    processId: string,
    assignedCount: number,
  ) => {
    const process = fileProcesses.find((p) => p.id === processId);
    const request = fileRequests.find((r) => r.id === requestId);

    if (!process || !request) return;

    const startRow = process.processedRows + 1;
    const endRow = process.processedRows + assignedCount;

    // Generate download link for the user (no auto-download)
    const downloadLink = generateDownloadLink(
      process,
      startRow,
      endRow,
      request.userName,
    );

    try {
      await apiClient.approveFileRequest(requestId, {
        assignedCount,
        processId,
        startRow,
        endRow,
        assignedBy: currentUser?.name,
      });
      await loadData();
      alert(
        `File generated and assigned to ${request.userName}!\nRows ${startRow}-${endRow} (${assignedCount} files)\nDownload will be available in their Request Files page.`,
      );
    } catch (e) {
      console.error("Failed to approve request", e);
      alert("Failed to approve request");
    }
  };

  const getPendingRequests = () => {
    return fileRequests.filter((r) => r.status === "pending");
  };

  const getProcessRequests = (processId: string) => {
    return fileRequests.filter((r) => r.fileProcessId === processId);
  };

  const getProcessStatusCounts = (processId: string) => {
    const requests = getProcessRequests(processId);
    return {
      completed: requests.filter((r) => r.status === "completed").length,
      inProgress: requests.filter((r) => r.status === "in_progress").length,
      pending: requests.filter((r) => r.status === "pending").length,
      assigned: requests.filter((r) => r.status === "assigned").length,
    };
  };

  const openProcessOverview = (process: FileProcess) => {
    setSelectedProcess(process);
    setIsOverviewDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canUpdateAutomation = (process: FileProcess) => {
    return (
      process.type === "automation" &&
      (process.status === "in_progress" || process.status === "active") &&
      (currentUser?.role === "super_admin" ||
        currentUser?.role === "project_manager")
    );
  };

  const getStatusOptions = (currentStatus: string) => {
    const allStatuses = [
      { value: "pending", label: "Pending", description: "Waiting to start" },
      {
        value: "in_progress",
        label: "In Progress",
        description: "Currently processing",
      },
      {
        value: "completed",
        label: "Completed",
        description: "All work finished",
      },
      { value: "paused", label: "Paused", description: "Temporarily stopped" },
    ];

    // Return all status options - allow admin/PM to change to any status
    return allStatuses;
  };

  const getRequestStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            File Process Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage file processing workflows for project data
            allocation.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingProcessId(null);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create File Process
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[720px] max-h-[75vh] overflow-y-auto">
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
                  onChange={(e) =>
                    setNewProcess({ ...newProcess, name: e.target.value })
                  }
                  placeholder="e.g., Aug-2025-File or Automation-DataSync-Jan2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={newProcess.projectId}
                  onValueChange={(value) =>
                    setNewProcess({ ...newProcess, projectId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex flex-col">
                          <span>{project.name}</span>
                          {project.description && (
                            <span className="text-xs text-muted-foreground">
                              {project.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="processType">Process Type</Label>
                <Select
                  value={newProcess.type}
                  onValueChange={(value: "automation" | "manual") =>
                    setNewProcess({
                      ...newProcess,
                      type: value,
                      fileName: "",
                      totalRows: 0,
                      uploadedFile: null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select process type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>Manual Processing</span>
                          <span className="text-xs text-muted-foreground">
                            Users work with uploaded files
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="automation">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span>Automation Tool</span>
                          <span className="text-xs text-muted-foreground">
                            Automated processing with daily updates
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newProcess.type === "manual" ? (
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
                        onChange={(e) =>
                          setNewProcess({
                            ...newProcess,
                            totalRows: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Enter row count"
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground">
                        {newProcess.totalRows > 0
                          ? `✅ Auto-detected: ${newProcess.totalRows.toLocaleString()} rows. You can modify this count if needed.`
                          : newProcess.fileName
                                ?.toLowerCase()
                                .endsWith(".xlsx") ||
                              newProcess.fileName
                                ?.toLowerCase()
                                .endsWith(".xls")
                            ? "📊 Excel files require manual row count entry. Please enter the total number of data rows."
                            : "⚠��� Could not auto-detect row count. Please enter the total number of data rows manually."}
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
                      onChange={(e) =>
                        setNewProcess({
                          ...newProcess,
                          automationToolName: e.target.value,
                        })
                      }
                      placeholder="e.g., DataSync Pro, Lead Generator AI"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalCount">Total Count to Process</Label>
                    <Input
                      id="totalCount"
                      type="number"
                      value={newProcess.totalRows}
                      onChange={(e) =>
                        setNewProcess({
                          ...newProcess,
                          totalRows: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter total count"
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Total number of items to be processed by the automation
                      tool.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dailyTarget">Daily Target</Label>
                    <Input
                      id="dailyTarget"
                      type="number"
                      value={newProcess.dailyTarget}
                      onChange={(e) =>
                        setNewProcess({
                          ...newProcess,
                          dailyTarget: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Enter daily processing target"
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Expected number of items to be processed daily by the
                      automation tool.
                    </p>
                  </div>
                </>
              )}
              {newProcess.totalRows > 0 && (
                <div
                  className={`p-3 border rounded-lg ${
                    newProcess.type === "automation"
                      ? "bg-purple-50 border-purple-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      newProcess.type === "automation"
                        ? "text-purple-700"
                        : "text-blue-700"
                    }`}
                  >
                    <strong>Available for processing:</strong>{" "}
                    {newProcess.totalRows.toLocaleString()}{" "}
                    {newProcess.type === "automation" ? "items" : "rows"}
                  </p>
                  {newProcess.type === "automation" &&
                    newProcess.dailyTarget > 0 && (
                      <p className="text-xs text-purple-600 mt-1">
                        Estimated completion:{" "}
                        {Math.ceil(
                          newProcess.totalRows / newProcess.dailyTarget,
                        )}{" "}
                        days
                      </p>
                    )}
                  <p
                    className={`text-xs mt-1 ${
                      newProcess.type === "automation"
                        ? "text-purple-600"
                        : "text-blue-600"
                    }`}
                  >
                    {newProcess.type === "automation"
                      ? "This will be processed automatically with daily updates."
                      : "This will be the total number of data rows available for user allocation."}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProcess}
                disabled={
                  !newProcess.name ||
                  !newProcess.projectId ||
                  !newProcess.totalRows ||
                  newProcess.totalRows <= 0 ||
                  (newProcess.type === "manual" && !newProcess.uploadedFile) ||
                  (newProcess.type === "automation" &&
                    (!newProcess.automationToolName ||
                      !newProcess.dailyTarget ||
                      newProcess.dailyTarget <= 0))
                }
              >
                Create Process
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs for Active Processes and File History */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Month Process</TabsTrigger>
          <TabsTrigger value="verification">File Verification</TabsTrigger>
          <TabsTrigger value="all-history">
            All History (Month-wise)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Processes
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    fileProcesses.filter(
                      (p) =>
                        p.status === "active" || p.status === "in_progress",
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently running
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Rows
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fileProcesses
                    .reduce((sum, p) => sum + p.totalRows, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all processes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Processed Rows
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {fileProcesses
                    .reduce((sum, p) => sum + p.processedRows, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully processed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Requests
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getPendingRequests().length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
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
                    {fileRequests.filter((r) => r.status === "pending").length}
                  </div>
                  <div className="text-xs text-yellow-700">
                    Pending Approval
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {fileRequests.filter((r) => r.status === "assigned").length}
                  </div>
                  <div className="text-xs text-blue-700">Files Ready</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {fileRequests.filter((r) => r.status === "received").length}
                  </div>
                  <div className="text-xs text-purple-700">Downloaded</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {
                      fileRequests.filter((r) => r.status === "in_progress")
                        .length
                    }
                  </div>
                  <div className="text-xs text-orange-700">In Progress</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      fileRequests.filter((r) => r.status === "completed")
                        .length
                    }
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
                  {getPendingRequests().map((request) => {
                    const process = fileProcesses.find(
                      (p) => p.id === request.fileProcessId,
                    );

                    return (
                      <Card
                        key={request.id}
                        className="border-l-4 border-l-orange-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {request.userName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Requested{" "}
                                {request.requestedCount.toLocaleString()} rows
                                from {process?.name || "Unknown Process"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  request.requestedDate,
                                ).toLocaleString()}
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
                              <Select
                                value={selectedProcessForRequest[request.id] || request.fileProcessId || ""}
                                onValueChange={(value) =>
                                  setSelectedProcessForRequest((prev) => ({
                                    ...prev,
                                    [request.id]: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fileProcesses
                                    .filter(
                                      (p) =>
                                        (p.status === "active" ||
                                          p.status === "in_progress") &&
                                        p.availableRows > 0,
                                    )
                                    .map((proc) => (
                                      <SelectItem key={proc.id} value={proc.id}>
                                        {proc.name} (
                                        {proc.availableRows.toLocaleString()}{" "}
                                        available)
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button
                                onClick={() => {
                                  const countInput = document.getElementById(
                                    `count-${request.id}`,
                                  ) as HTMLInputElement;
                                  const assignedCount =
                                    parseInt(countInput.value) ||
                                    request.requestedCount;
                                  const chosenProcessId =
                                    selectedProcessForRequest[request.id] ||
                                    request.fileProcessId;
                                  if (!chosenProcessId) return;
                                  handleApproveRequest(
                                    request.id,
                                    chosenProcessId,
                                    assignedCount,
                                  );
                                }}
                                disabled={(() => {
                                  const chosenProcessId =
                                    selectedProcessForRequest[request.id] ||
                                    request.fileProcessId;
                                  const chosenProcess = fileProcesses.find(
                                    (p) => p.id === chosenProcessId,
                                  );
                                  return !chosenProcess || chosenProcess.availableRows <= 0;
                                })()}
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
                  const progress =
                    process.totalRows > 0
                      ? (process.processedRows /
                          (process.totalRows - process.headerRows)) *
                        100
                      : 0;
                  const processRequests = getProcessRequests(process.id);
                  const statusCounts = getProcessStatusCounts(process.id);

                  return (
                    <Card
                      key={process.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{process.name}</h4>
                              {process.type === "automation" ? (
                                <Badge
                                  variant="outline"
                                  className="text-purple-600 border-purple-300"
                                >
                                  <Bot className="h-3 w-3 mr-1" />
                                  AUTO
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-blue-600 border-blue-300"
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  MANUAL
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {process.projectName}
                            </p>
                            {process.type === "automation" &&
                              process.automationConfig && (
                                <p className="text-xs text-purple-600">
                                  Tool: {process.automationConfig.toolName}
                                </p>
                              )}
                          </div>
                          <Badge
                            className={getStatusBadgeColor(process.status)}
                          >
                            {process.status.toUpperCase().replace("_", " ")}
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
                              <div className="text-xs text-muted-foreground">
                                Processed
                              </div>
                              <div className="font-medium text-green-600">
                                {process.processedRows.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">
                                Available
                              </div>
                              <div className="font-medium text-blue-600">
                                {process.availableRows.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {process.type === "automation" &&
                            process.dailyTarget && (
                              <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                                <div className="flex justify-between">
                                  <span className="text-purple-700">
                                    Daily Target:
                                  </span>
                                  <span className="font-medium text-purple-600">
                                    {process.dailyTarget.toLocaleString()}
                                  </span>
                                </div>
                                {process.automationConfig?.dailyCompletions
                                  .length > 0 && (
                                  <div className="flex justify-between mt-1">
                                    <span className="text-purple-700">
                                      Last Update:
                                    </span>
                                    <span className="text-purple-600">
                                      {new Date(
                                        process.automationConfig.lastUpdate,
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                          {/* User Status Counts */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-medium text-green-600">
                                {statusCounts.completed}
                              </div>
                              <div className="text-green-700">Completed</div>
                            </div>
                            <div className="text-center p-2 bg-orange-50 rounded">
                              <div className="font-medium text-orange-600">
                                {statusCounts.inProgress}
                              </div>
                              <div className="text-orange-700">In Progress</div>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 rounded">
                              <div className="font-medium text-yellow-600">
                                {statusCounts.pending + statusCounts.assigned}
                              </div>
                              <div className="text-yellow-700">Pending</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              {process.type === "automation" ? (
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
                              {process.type === "automation" &&
                              (currentUser?.role === "super_admin" ||
                                currentUser?.role === "project_manager") ? (
                                <>
                                  {canUpdateAutomation(process) ? (
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
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        process.status === "completed"
                                          ? "text-green-600 border-green-300"
                                          : process.status === "pending"
                                            ? "text-yellow-600 border-yellow-300"
                                            : "text-gray-600 border-gray-300"
                                      }`}
                                    >
                                      {process.status === "completed" && (
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                      )}
                                      {process.status === "pending" && (
                                        <Clock className="h-3 w-3 mr-1" />
                                      )}
                                      {process.status.charAt(0).toUpperCase() +
                                        process.status
                                          .slice(1)
                                          .replace("_", " ")}
                                    </Badge>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingProcessId(process.id);
                                          setIsCreateDialogOpen(true);
                                          setNewProcess({
                                            name: process.name,
                                            projectId: process.projectId || "",
                                            fileName: process.fileName || "",
                                            totalRows: process.totalRows,
                                            uploadedFile: null,
                                            type: process.type,
                                            dailyTarget: process.dailyTarget || 0,
                                            automationToolName: process.automationConfig?.toolName || "",
                                          });
                                        }}
                                      >
                                        <Edit className="h-3 w-3 mr-2" /> Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (!confirm("Delete this file process?")) return;
                                          try {
                                            await apiClient.deleteFileProcess(process.id);
                                            await loadData();
                                          } catch (err) {
                                            alert("Failed to delete process");
                                            console.error(err);
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3 mr-2" /> Delete
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openProcessOverview(process);
                                        }}
                                      >
                                        <Eye className="h-3 w-3 mr-2" /> View Details
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
          <Dialog
            open={isOverviewDialogOpen}
            onOpenChange={setIsOverviewDialogOpen}
          >
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedProcess?.name} Overview</DialogTitle>
                <DialogDescription>
                  Detailed view of file processing progress and user assignments
                </DialogDescription>
              </DialogHeader>
              {selectedProcess && (
                <div className="space-y-6">
                  {/* Process Type Header with Status */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {selectedProcess.type === "automation" ? (
                        <>
                          <Bot className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-purple-600">
                            Automation Process
                          </span>
                          {selectedProcess.automationConfig && (
                            <Badge
                              variant="outline"
                              className="text-purple-600"
                            >
                              {selectedProcess.automationConfig.toolName}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <>
                          <User className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-blue-600">
                            Manual Process
                          </span>
                          <Badge variant="outline" className="text-blue-600">
                            {selectedProcess.fileName}
                          </Badge>
                        </>
                      )}
                    </div>

                    {/* Status Management for Automation Processes */}
                    {selectedProcess.type === "automation" &&
                      (currentUser?.role === "super_admin" ||
                        currentUser?.role === "project_manager") && (
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor="processStatus"
                            className="text-sm font-medium"
                          >
                            Status:
                          </Label>
                          <Select
                            value={selectedProcess.status}
                            onValueChange={(value) =>
                              handleStatusChange(selectedProcess.id, value)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getStatusOptions(selectedProcess.status).map(
                                (option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    <div className="flex flex-col">
                                      <span>{option.label}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {option.description}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                  </div>

                  {/* Process Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {selectedProcess.totalRows.toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-700">
                        {selectedProcess.type === "automation"
                          ? "Total Items"
                          : "Total Rows"}
                      </div>
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
                        {selectedProcess.type === "automation"
                          ? selectedProcess.dailyTarget?.toLocaleString() ||
                            "N/A"
                          : selectedProcess.activeUsers}
                      </div>
                      <div className="text-xs text-purple-700">
                        {selectedProcess.type === "automation"
                          ? "Daily Target"
                          : "Active Users"}
                      </div>
                    </div>
                  </div>

                  {/* Automation Daily Progress */}
                  {selectedProcess.type === "automation" &&
                    selectedProcess.automationConfig?.dailyCompletions && (
                      <>
                        {/* Today's Status and Quick Update */}
                        {(currentUser?.role === "super_admin" ||
                          currentUser?.role === "project_manager") && (
                          <Card
                            className={`border-l-4 ${
                              selectedProcess.status === "completed"
                                ? "border-l-green-500 bg-green-50"
                                : selectedProcess.status === "pending"
                                  ? "border-l-yellow-500 bg-yellow-50"
                                  : "border-l-purple-500"
                            }`}
                          >
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {selectedProcess.status === "completed" ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : selectedProcess.status === "pending" ? (
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-purple-500" />
                                  )}
                                  {selectedProcess.status === "completed"
                                    ? "Process Completed"
                                    : selectedProcess.status === "pending"
                                      ? "Awaiting Start"
                                      : "Today's Progress"}
                                </div>
                                {canUpdateAutomation(selectedProcess) && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleDailyAutomationUpdate(
                                        selectedProcess.id,
                                      )
                                    }
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Update Today
                                  </Button>
                                )}
                              </CardTitle>
                              <CardDescription>
                                {selectedProcess.status === "completed"
                                  ? `All processing completed for ${selectedProcess.automationConfig.toolName}`
                                  : selectedProcess.status === "pending"
                                    ? `Process is pending - change status to 'In Progress' to start updating counts`
                                    : `Manage today's completion count for ${selectedProcess.automationConfig.toolName}`}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <div className="text-lg font-bold text-green-600">
                                    {(() => {
                                      const today = new Date()
                                        .toISOString()
                                        .split("T")[0];
                                      const todayCompletion =
                                        selectedProcess.automationConfig?.dailyCompletions.find(
                                          (d) => d.date === today,
                                        );
                                      return todayCompletion
                                        ? todayCompletion.completed.toLocaleString()
                                        : "0";
                                    })()}
                                  </div>
                                  <div className="text-xs text-green-700">
                                    Completed Today
                                  </div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                  <div className="text-lg font-bold text-purple-600">
                                    {selectedProcess.dailyTarget?.toLocaleString() ||
                                      "0"}
                                  </div>
                                  <div className="text-xs text-purple-700">
                                    Daily Target
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Today's Progress</span>
                                  <span>
                                    {(() => {
                                      const today = new Date()
                                        .toISOString()
                                        .split("T")[0];
                                      const todayCompletion =
                                        selectedProcess.automationConfig?.dailyCompletions.find(
                                          (d) => d.date === today,
                                        );
                                      const completed = todayCompletion
                                        ? todayCompletion.completed
                                        : 0;
                                      const target =
                                        selectedProcess.dailyTarget || 1;
                                      return (
                                        (completed / target) *
                                        100
                                      ).toFixed(1);
                                    })()}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  value={(() => {
                                    const today = new Date()
                                      .toISOString()
                                      .split("T")[0];
                                    const todayCompletion =
                                      selectedProcess.automationConfig?.dailyCompletions.find(
                                        (d) => d.date === today,
                                      );
                                    const completed = todayCompletion
                                      ? todayCompletion.completed
                                      : 0;
                                    const target =
                                      selectedProcess.dailyTarget || 1;
                                    return Math.min(
                                      (completed / target) * 100,
                                      100,
                                    );
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
                              Recent daily completions by{" "}
                              {selectedProcess.automationConfig.toolName}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {selectedProcess.automationConfig.dailyCompletions
                                .length > 0 ? (
                                selectedProcess.automationConfig.dailyCompletions
                                  .slice(-7)
                                  .map((day, index) => {
                                    const isToday =
                                      day.date ===
                                      new Date().toISOString().split("T")[0];
                                    const canEdit =
                                      canUpdateAutomation(selectedProcess);
                                    return (
                                      <div
                                        key={index}
                                        className={`flex items-center justify-between p-2 rounded ${
                                          isToday
                                            ? "bg-purple-100 border border-purple-300"
                                            : "bg-purple-50"
                                        } ${!canUpdateAutomation(selectedProcess) ? "opacity-75" : ""}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">
                                            {new Date(
                                              day.date,
                                            ).toLocaleDateString()}
                                          </span>
                                          {isToday && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              Today
                                            </Badge>
                                          )}
                                          {selectedProcess.status ===
                                            "completed" && (
                                            <Badge
                                              variant="outline"
                                              className="text-xs text-green-600 border-green-300"
                                            >
                                              Final
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-purple-600">
                                            {day.completed.toLocaleString()}{" "}
                                            items
                                          </span>
                                          <Badge
                                            variant={
                                              day.completed >=
                                              (selectedProcess.dailyTarget || 0)
                                                ? "default"
                                                : "secondary"
                                            }
                                          >
                                            {day.completed >=
                                            (selectedProcess.dailyTarget || 0)
                                              ? "Target Met"
                                              : "Below Target"}
                                          </Badge>
                                          {canEdit && (
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() =>
                                                handleDailyAutomationUpdate(
                                                  selectedProcess.id,
                                                  day.date,
                                                )
                                              }
                                              className="h-6 w-6 p-0 text-purple-600 hover:bg-purple-100"
                                              title={`Edit count for ${new Date(day.date).toLocaleDateString()}`}
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                              ) : (
                                <div className="text-center py-4 text-muted-foreground">
                                  <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                                  <p>No completion data yet.</p>
                                  <p className="text-xs">
                                    Change status to 'In Progress' and start
                                    updating daily counts.
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>
                        {(
                          (selectedProcess.processedRows /
                            (selectedProcess.totalRows -
                              selectedProcess.headerRows)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        (selectedProcess.processedRows /
                          (selectedProcess.totalRows -
                            selectedProcess.headerRows)) *
                        100
                      }
                      className="h-3"
                    />
                  </div>

                  {/* Request History with Full Status Tracking */}
                  {selectedProcess.type === "manual" && (
                    <div>
                      <h4 className="font-medium mb-3">
                        File Assignment & Status Tracking
                      </h4>
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
                          {getProcessRequests(selectedProcess.id).map(
                            (request) => (
                              <TableRow key={request.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {request.userName}
                                    </div>
                                    {request.assignedBy && (
                                      <div className="text-xs text-muted-foreground">
                                        Assigned by: {request.assignedBy}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {(
                                    request.assignedCount ||
                                    request.requestedCount
                                  ).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {request.startRow && request.endRow ? (
                                    <span className="text-sm font-mono">
                                      {request.startRow.toLocaleString()} -{" "}
                                      {request.endRow.toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Pending
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <Badge
                                      className={getRequestStatusBadgeColor(
                                        request.status,
                                      )}
                                    >
                                      {request.status
                                        .replace("_", " ")
                                        .toUpperCase()}
                                    </Badge>
                                    {request.status === "assigned" && (
                                      <div className="text-xs text-blue-600">
                                        File ready for download
                                      </div>
                                    )}
                                    {request.status === "in_progress" && (
                                      <div className="text-xs text-orange-600">
                                        Currently working
                                      </div>
                                    )}
                                    {request.status === "completed" && (
                                      <div className="text-xs text-green-600">
                                        Work completed
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>
                                      {new Date(
                                        request.assignedDate ||
                                          request.requestedDate,
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(
                                        request.assignedDate ||
                                          request.requestedDate,
                                      ).toLocaleTimeString()}
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
                                          const link =
                                            document.createElement("a");
                                          link.href =
                                            request.downloadLink || "";
                                          link.download =
                                            request.downloadLink
                                              ?.split("/")
                                              .pop() || "file.csv";
                                          link.click();
                                        }}
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        View File
                                      </Button>
                                    )}
                                    {request.status === "completed" && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Done
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ),
                          )}
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
                <Button
                  variant="outline"
                  onClick={() => setIsOverviewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6 mt-6">
          {/* Verification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Verification
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {getPendingVerifications().length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Files awaiting review
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Verified Today
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {
                    getVerifiedFiles().filter(
                      (v) =>
                        v.verifiedDate &&
                        new Date(v.verifiedDate).toDateString() ===
                          new Date().toDateString(),
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">Approved today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Verified
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {getVerifiedFiles().length}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time verified
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average File Size
                </CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const files = fileRequests.filter((r: any) => r.outputFile?.size).map((r: any) => r.outputFile!.size);
                    if (files.length === 0) return "0";
                    const avg = files.reduce((a, b) => a + b, 0) / files.length / 1024 / 1024;
                    return avg.toFixed(1);
                  })()} MB
                </div>
                <p className="text-xs text-muted-foreground">
                  Per uploaded file
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Verifications */}
          {getPendingVerifications().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Pending File Verifications ({getPendingVerifications().length}
                  )
                </CardTitle>
                <CardDescription>
                  Review and approve files uploaded by users for task completion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getPendingVerifications().map((request) => (
                    <Card
                      key={request.id}
                      className="border-l-4 border-l-orange-500"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-lg">
                                {request.userName}
                              </h4>
                              <Badge className="bg-orange-100 text-orange-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Review
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p>
                                  <strong>Email:</strong> {request.userEmail}
                                </p>
                                <p>
                                  <strong>File Process:</strong>{" "}
                                  {request.fileProcessName}
                                </p>
                                <p>
                                  <strong>Assigned by:</strong>{" "}
                                  {request.assignedBy}
                                </p>
                              </div>
                              <div>
                                <p>
                                  <strong>File Count:</strong>{" "}
                                  {request.requestedCount.toLocaleString()}
                                </p>
                                <p>
                                  <strong>Row Range:</strong>{" "}
                                  {request.startRow.toLocaleString()} -{" "}
                                  {request.endRow.toLocaleString()}
                                </p>
                                <p>
                                  <strong>Submitted:</strong>{" "}
                                  {new Date(
                                    request.submittedDate,
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Uploaded File Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <h5 className="font-medium text-blue-800 mb-2">
                            Uploaded File
                          </h5>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">
                                {request.outputFile?.name || "No file attached"}
                              </span>
                            </div>
                            {request.outputFile && (
                              <div className="text-sm text-blue-600">
                                {(
                                  (request.outputFile.size || 0) /
                                  1024 /
                                  1024
                                ).toFixed(2)} MB
                              </div>
                            )}
                          </div>
                          {request.outputFile?.uploadDate && (
                            <p className="text-xs text-blue-700 mt-1">
                              Uploaded: {new Date(request.outputFile.uploadDate).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* User Notes */}
                        {request.notes && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                            <h5 className="font-medium text-gray-700 mb-1">
                              User Notes
                            </h5>
                            <p className="text-sm text-gray-600">
                              {request.notes}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          {request.outputFile && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = "#";
                                link.download = request.outputFile!.name;
                                link.click();
                              }}
                              className="mr-2"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download File
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleVerificationReview(request)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review & Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recently Verified Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Recently Verified Files
              </CardTitle>
              <CardDescription>
                Files that have been reviewed and approved/rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getVerifiedFiles().length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    No Verified Files
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verified files will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getVerifiedFiles()
                    .slice(0, 5)
                    .map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              request.status === "verified"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          ></div>
                          <div>
                            <p className="font-medium">{request.userName}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.fileProcessName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              request.status === "verified"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {request.status === "verified"
                              ? "Approved"
                              : "Rejected"}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.verifiedBy} •{" "}
                            {new Date(
                              request.verifiedDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-history" className="space-y-6 mt-6">
          {/* Month Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Label htmlFor="month-select">Filter by Month:</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {processesByMonth.map((monthData) => (
                      <SelectItem key={monthData.month} value={monthData.month}>
                        {monthData.monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

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
                {selectedMonth === "all"
                  ? // Show all processes grouped by month
                    processesByMonth.map((monthData) => (
                      <div key={monthData.month} className="space-y-4">
                        <div className="flex items-center gap-2 pt-4 border-t first:border-t-0 first:pt-0">
                          <h3 className="text-lg font-semibold text-blue-600">
                            {monthData.monthName}
                          </h3>
                          <Badge variant="outline">
                            {monthData.processes.length} processes
                          </Badge>
                        </div>
                        {monthData.processes.map((process) => (
                          <Card
                            key={process.id}
                            className="border-l-4 border-l-green-500 ml-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleProcessBreakdown(process)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium">
                                    {process.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {process.projectName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Created by: {process.createdBy}
                                  </p>
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
                                  <div className="text-xs text-blue-700">
                                    Total Rows
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-green-50 rounded">
                                  <div className="text-lg font-bold text-green-600">
                                    {process.totalUsers}
                                  </div>
                                  <div className="text-xs text-green-700">
                                    Users
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-purple-50 rounded">
                                  <div className="text-lg font-bold text-purple-600">
                                    {process.duration}
                                  </div>
                                  <div className="text-xs text-purple-700">
                                    Duration
                                  </div>
                                </div>
                                <div className="text-center p-2 bg-orange-50 rounded">
                                  <div className="text-lg font-bold text-orange-600">
                                    {process.avgProcessingRate}
                                  </div>
                                  <div className="text-xs text-orange-700">
                                    Avg/Day
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                  Started:{" "}
                                  {new Date(
                                    process.createdDate,
                                  ).toLocaleDateString()}
                                </span>
                                <span>
                                  Completed:{" "}
                                  {new Date(
                                    process.completedDate,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ))
                  : // Show processes for selected month only
                    processesByMonth
                      .find((monthData) => monthData.month === selectedMonth)
                      ?.processes?.map((process) => (
                        <Card
                          key={process.id}
                          className="border-l-4 border-l-green-500 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleProcessBreakdown(process)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{process.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {process.projectName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Created by: {process.createdBy}
                                </p>
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
                                <div className="text-xs text-blue-700">
                                  Total Rows
                                </div>
                              </div>
                              <div className="text-center p-2 bg-green-50 rounded">
                                <div className="text-lg font-bold text-green-600">
                                  {process.totalUsers}
                                </div>
                                <div className="text-xs text-green-700">
                                  Users
                                </div>
                              </div>
                              <div className="text-center p-2 bg-purple-50 rounded">
                                <div className="text-lg font-bold text-purple-600">
                                  {process.duration}
                                </div>
                                <div className="text-xs text-purple-700">
                                  Duration
                                </div>
                              </div>
                              <div className="text-center p-2 bg-orange-50 rounded">
                                <div className="text-lg font-bold text-orange-600">
                                  {process.avgProcessingRate}
                                </div>
                                <div className="text-xs text-orange-700">
                                  Avg/Day
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>
                                Started:{" "}
                                {new Date(
                                  process.createdDate,
                                ).toLocaleDateString()}
                              </span>
                              <span>
                                Completed:{" "}
                                {new Date(
                                  process.completedDate,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )) || (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          No Processes Found
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          No completed processes found for the selected month.
                        </p>
                      </div>
                    )}
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
                  {filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="font-medium">
                          {assignment.processName}
                        </div>
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
                        {assignment.completedCount <
                          assignment.assignedCount && (
                          <div className="text-xs text-red-500">
                            (
                            {assignment.assignedCount -
                              assignment.completedCount}{" "}
                            incomplete)
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {assignment.processingTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`font-medium ${
                              assignment.efficiency >= 95
                                ? "text-green-600"
                                : assignment.efficiency >= 85
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {assignment.efficiency}%
                          </div>
                          {assignment.efficiency >= 95 && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(
                            assignment.completedDate,
                          ).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(
                            assignment.completedDate,
                          ).toLocaleTimeString()}
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
                <CardTitle className="text-lg">
                  Total Processes Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {fileProcesses.filter((p) => p.status === "completed").length}
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
                  {mockHistoricalProcesses
                    .reduce((sum, p) => sum + p.processedRows, 0)
                    .toLocaleString()}
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
                  {(
                    mockHistoricalAssignments.reduce(
                      (sum, a) => sum + a.efficiency,
                      0,
                    ) / mockHistoricalAssignments.length
                  ).toFixed(1)}
                  %
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
                <h4 className="font-medium text-purple-700">
                  {selectedAutomationProcess.name}
                </h4>
                <p className="text-sm text-purple-600">
                  Tool: {selectedAutomationProcess.automationConfig?.toolName}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Daily Target:{" "}
                  {selectedAutomationProcess.dailyTarget?.toLocaleString()}{" "}
                  items
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="updateDate">Date</Label>
                <Input
                  id="updateDate"
                  type="date"
                  value={dailyUpdate.date}
                  onChange={(e) =>
                    setDailyUpdate({ ...dailyUpdate, date: e.target.value })
                  }
                  disabled={isEditingExisting}
                  className={isEditingExisting ? "bg-gray-100" : ""}
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
                  onChange={(e) =>
                    setDailyUpdate({
                      ...dailyUpdate,
                      completed: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter completed count"
                  min="0"
                  max={selectedAutomationProcess.availableRows}
                />
                <p className="text-xs text-muted-foreground">
                  Available:{" "}
                  {selectedAutomationProcess.availableRows.toLocaleString()}{" "}
                  items
                </p>
              </div>

              {dailyUpdate.completed > 0 && (
                <div
                  className={`p-3 border rounded-lg ${
                    isEditingExisting
                      ? "bg-blue-50 border-blue-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      isEditingExisting ? "text-blue-700" : "text-green-700"
                    }`}
                  >
                    <strong>
                      {isEditingExisting ? "Count Update:" : "Progress Update:"}
                    </strong>{" "}
                    {dailyUpdate.completed.toLocaleString()} items
                  </p>
                  {!isEditingExisting && (
                    <p className="text-xs text-green-600 mt-1">
                      New total:{" "}
                      {(
                        selectedAutomationProcess.processedRows +
                        dailyUpdate.completed
                      ).toLocaleString()}{" "}
                      / {selectedAutomationProcess.totalRows.toLocaleString()}
                    </p>
                  )}
                  {isEditingExisting && (
                    <p className="text-xs text-blue-600 mt-1">
                      This will update the existing entry for{" "}
                      {new Date(dailyUpdate.date).toLocaleDateString()}
                    </p>
                  )}
                  {dailyUpdate.completed >=
                    (selectedAutomationProcess.dailyTarget || 0) && (
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
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitDailyUpdate}
              disabled={!dailyUpdate.completed || dailyUpdate.completed <= 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Bot className="h-4 w-4 mr-2" />
              {isEditingExisting ? "Save Changes" : "Update Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Breakdown Dialog */}
      <Dialog
        open={isBreakdownDialogOpen}
        onOpenChange={setIsBreakdownDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Process Breakdown - {selectedHistoricalProcess?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed analysis and metrics for the completed file process
            </DialogDescription>
          </DialogHeader>

          {selectedHistoricalProcess && (
            <div className="space-y-6">
              {/* Process Overview */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Process Overview
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      COMPLETED
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Process Name
                        </Label>
                        <p className="text-lg font-semibold">
                          {selectedHistoricalProcess.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Project
                        </Label>
                        <p className="text-base">
                          {selectedHistoricalProcess.projectName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          File Name
                        </Label>
                        <p className="text-base font-mono text-blue-600">
                          {selectedHistoricalProcess.fileName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Created By
                        </Label>
                        <p className="text-base">
                          {selectedHistoricalProcess.createdBy}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Start Date
                        </Label>
                        <p className="text-base">
                          {new Date(
                            selectedHistoricalProcess.createdDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Completion Date
                        </Label>
                        <p className="text-base">
                          {new Date(
                            selectedHistoricalProcess.completedDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Total Duration
                        </Label>
                        <p className="text-base font-semibold text-purple-600">
                          {selectedHistoricalProcess.duration}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Team Size
                        </Label>
                        <p className="text-base">
                          {selectedHistoricalProcess.totalUsers} users
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedHistoricalProcess.totalRows.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total Rows
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedHistoricalProcess.processedRows.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Processed Rows
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedHistoricalProcess.avgProcessingRate}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Avg Files/Day
                    </p>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-orange-600">
                      {(
                        (selectedHistoricalProcess.processedRows /
                          selectedHistoricalProcess.totalRows) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Completion Rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Processing Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Process Started</span>
                      </div>
                      <span className="text-sm text-blue-600">
                        {new Date(
                          selectedHistoricalProcess.createdDate,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Process Completed</span>
                      </div>
                      <span className="text-sm text-green-600">
                        {new Date(
                          selectedHistoricalProcess.completedDate,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">
                          Average Daily Progress
                        </span>
                      </div>
                      <span className="text-sm text-purple-600 font-semibold">
                        {selectedHistoricalProcess.avgProcessingRate} files/day
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Team Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">
                        {selectedHistoricalProcess.totalUsers}
                      </div>
                      <p className="text-sm text-green-700">
                        Total Team Members
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">
                        {Math.round(
                          selectedHistoricalProcess.processedRows /
                            selectedHistoricalProcess.totalUsers,
                        ).toLocaleString()}
                      </div>
                      <p className="text-sm text-blue-700">
                        Avg Files per User
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">
                        {Math.round(
                          selectedHistoricalProcess.avgProcessingRate /
                            selectedHistoricalProcess.totalUsers,
                        )}
                      </div>
                      <p className="text-sm text-purple-700">
                        Avg Daily per User
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Processing Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    File Processing Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <Label className="text-sm font-medium text-muted-foreground">
                          File Information
                        </Label>
                        <p className="text-base font-mono text-blue-600 mt-1">
                          {selectedHistoricalProcess.fileName}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Total Records:{" "}
                          {selectedHistoricalProcess.totalRows.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <Label className="text-sm font-medium text-muted-foreground">
                          Processing Status
                        </Label>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>
                              {(
                                (selectedHistoricalProcess.processedRows /
                                  selectedHistoricalProcess.totalRows) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (selectedHistoricalProcess.processedRows /
                                selectedHistoricalProcess.totalRows) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Processing Summary
                      </Label>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Processed:
                          </span>
                          <span className="ml-2 font-semibold text-green-600">
                            {selectedHistoricalProcess.processedRows.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Remaining:
                          </span>
                          <span className="ml-2 font-semibold text-orange-600">
                            {(
                              selectedHistoricalProcess.totalRows -
                              selectedHistoricalProcess.processedRows
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBreakdownDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Verification Dialog */}
      <Dialog
        open={isVerificationDialogOpen}
        onOpenChange={setIsVerificationDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Review File Submission
            </DialogTitle>
            <DialogDescription>
              Review the uploaded file and approve or reject the user's work
              submission.
            </DialogDescription>
          </DialogHeader>

          {selectedVerificationRequest && (
            <div className="space-y-6">
              {/* User and Task Information */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-lg">Task Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          User
                        </Label>
                        <p className="text-base font-semibold">
                          {selectedVerificationRequest.userName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedVerificationRequest.userEmail}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          File Process
                        </Label>
                        <p className="text-base">
                          {selectedVerificationRequest.fileProcessName}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Assigned By
                        </Label>
                        <p className="text-base">
                          {selectedVerificationRequest.assignedBy}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          File Count
                        </Label>
                        <p className="text-base font-semibold">
                          {selectedVerificationRequest.requestedCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Row Range
                        </Label>
                        <p className="text-base">
                          {selectedVerificationRequest.startRow.toLocaleString()}{" "}
                          -{" "}
                          {selectedVerificationRequest.endRow.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Submitted Date
                        </Label>
                        <p className="text-base">
                          {new Date(
                            selectedVerificationRequest.submittedDate,
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uploaded File Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    Uploaded File
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          {selectedVerificationRequest.uploadedFile.name}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Simulate file download
                          const link = document.createElement("a");
                          link.href = "#";
                          link.download =
                            selectedVerificationRequest.uploadedFile.name;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-700">File Size:</span>
                        <span className="ml-2 font-medium">
                          {(
                            selectedVerificationRequest.uploadedFile.size /
                            1024 /
                            1024
                          ).toFixed(2)}{" "}
                          MB
                        </span>
                      </div>
                      <div>
                        <span className="text-green-700">Upload Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(
                            selectedVerificationRequest.uploadedFile.uploadDate,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Notes */}
              {selectedVerificationRequest.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm">
                        {selectedVerificationRequest.notes}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Verification Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Verification Notes</CardTitle>
                  <CardDescription>
                    Add notes about your review (required for rejection,
                    optional for approval)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={4}
                    placeholder="Enter your verification notes here..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  This action will notify the user of your decision via email.
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!verificationNotes.trim()) {
                        alert(
                          "Please provide verification notes for rejection.",
                        );
                        return;
                      }
                      handleVerificationApproval(
                        selectedVerificationRequest.id,
                        "reject",
                      );
                    }}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() =>
                      handleVerificationApproval(
                        selectedVerificationRequest.id,
                        "approve",
                      )
                    }
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsVerificationDialogOpen(false);
                setSelectedVerificationRequest(null);
                setVerificationNotes("");
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
