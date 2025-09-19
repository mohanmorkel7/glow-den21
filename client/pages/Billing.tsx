import React, { useState, useMemo, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/api";
import {
  DollarSign,
  Download,
  FileText,
  TrendingUp,
  Calendar,
  CreditCard,
  PieChart,
  Filter,
  Search,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Send,
  Bot,
  User,
  Activity,
} from "lucide-react";

// File Process interfaces from FileProcess.tsx
interface Project {
  id: string;
  name: string;
  client: string;
  status: "active" | "inactive";
  ratePerFile?: number; // USD per file
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

interface ProjectBilling {
  projectId: string;
  projectName: string;
  client: string;
  month: string;
  fileProcesses: FileProcessBilling[];
  totalFilesCompleted: number;
  ratePerFile: number;
  amountUSD: number;
  amountINR: number;
  conversionRate: number;
  status: "draft" | "finalized" | "paid";
  createdAt: string;
  finalizedAt?: string;
  paidAt?: string;
  type: "project";
}

interface FileProcessBilling {
  processId: string;
  processName: string;
  fileName?: string;
  type: "automation" | "manual";
  totalFiles: number;
  completedFiles: number;
  progressPercentage: number;
  completedDate?: string;
  dailyCompletions?: { date: string; completed: number }[];
}

interface MonthlyBillingSummary {
  month: string;
  totalFilesCompleted: number;
  totalAmountUSD: number;
  totalAmountINR: number;
  conversionRate: number;
  itemsCount: number;
  projects: ProjectBilling[];
  automationProcesses: number;
  manualProcesses: number;
}

// Mock file process data from FileProcess.tsx
const mockProjects: Project[] = [
  {
    id: "1",
    name: "MO Project - Data Processing",
    client: "Mobius Dataservice",
    status: "active",
    ratePerFile: 0.05,
  },
  {
    id: "2",
    name: "Customer Support Processing",
    client: "TechCorp Solutions",
    status: "active",
    ratePerFile: 0.08,
  },
  {
    id: "3",
    name: "Invoice Processing",
    client: "Mobius Dataservice",
    status: "inactive",
    ratePerFile: 0.12,
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
  {
    id: "fp_5",
    name: "Automation-EmailCampaign-Jan2025",
    projectId: "2",
    projectName: "Customer Support Processing",
    totalRows: 75000,
    headerRows: 0,
    processedRows: 68700,
    availableRows: 6300,
    uploadDate: "2024-01-22T09:00:00Z",
    status: "in_progress",
    createdBy: "Sarah Johnson",
    activeUsers: 0,
    type: "automation",
    dailyTarget: 5000,
    automationConfig: {
      toolName: "Email Automation Pro",
      lastUpdate: "2024-01-22T09:00:00Z",
      dailyCompletions: [
        { date: "2024-01-20", completed: 5000 },
        { date: "2024-01-21", completed: 4900 },
        { date: "2024-01-22", completed: 4800 },
      ],
    },
  },
];

// Calculate billing data from actual file process completion
const computeBillingData = (): MonthlyBillingSummary[] => {
  const conversionRate = 83.0; // USD to INR conversion rate
  const months = ["2024-01", "2024-02", "2024-03"]; // Current and historical months

  return months
    .map((month) => {
      // Get file processes that have activity in this month
      const monthProcesses = mockFileProcesses.filter((fp) => {
        const uploadMonth = fp.uploadDate.substring(0, 7);
        const completedThisMonth =
          fp.status === "completed" && uploadMonth === month;
        const inProgressThisMonth =
          (fp.status === "in_progress" || fp.status === "active") &&
          uploadMonth <= month;
        return completedThisMonth || inProgressThisMonth;
      });

      // Group processes by project
      const projectGroups = monthProcesses.reduce(
        (groups, fp) => {
          if (!groups[fp.projectId]) {
            groups[fp.projectId] = [];
          }
          groups[fp.projectId].push(fp);
          return groups;
        },
        {} as Record<string, FileProcess[]>,
      );

      // Calculate billing for each project
      const projects: ProjectBilling[] = Object.entries(projectGroups)
        .map(([projectId, processes]) => {
          const project = mockProjects.find((p) => p.id === projectId);
          if (!project) return null;

          const fileProcesses: FileProcessBilling[] = processes.map((fp) => {
            // Calculate completed files based on month and process status
            let completedFiles = 0;
            if (month === "2024-01") {
              // January completions
              if (fp.id === "fp_2") completedFiles = 150000; // Completed in January
              if (fp.id === "fp_3") completedFiles = 125000; // In progress in January
              if (fp.id === "fp_1") completedFiles = 45000; // Started in January
            } else if (month === "2024-02") {
              // February completions (additional progress)
              if (fp.id === "fp_3") completedFiles = 50000; // Additional progress
              if (fp.id === "fp_1") completedFiles = 25000; // Additional progress
            } else if (month === "2024-03") {
              // March completions (current month progress)
              if (fp.id === "fp_1") completedFiles = 15000; // Recent progress
              if (fp.id === "fp_5") completedFiles = 68700; // Recent automation progress
            }

            return {
              processId: fp.id,
              processName: fp.name,
              fileName: fp.fileName,
              type: fp.type,
              totalFiles: fp.totalRows,
              completedFiles,
              progressPercentage:
                fp.totalRows > 0 ? (fp.processedRows / fp.totalRows) * 100 : 0,
              completedDate:
                fp.status === "completed" ? fp.uploadDate : undefined,
              dailyCompletions: fp.automationConfig?.dailyCompletions,
            };
          });

          const totalFilesCompleted = fileProcesses.reduce(
            (sum, fp) => sum + fp.completedFiles,
            0,
          );
          const ratePerFile = project.ratePerFile || 0.05;
          const amountUSD = totalFilesCompleted * ratePerFile;
          const amountINR = amountUSD * conversionRate;

          // Determine status based on month
          let status: "draft" | "finalized" | "paid" = "draft";
          if (month === "2024-01") status = "paid";
          else if (month === "2024-02") status = "finalized";
          else status = "draft";

          return {
            projectId: project.id,
            projectName: project.name,
            client: project.client,
            month,
            fileProcesses,
            totalFilesCompleted,
            ratePerFile,
            amountUSD,
            amountINR,
            conversionRate,
            status,
            createdAt: new Date(month + "-28T18:00:00Z").toISOString(),
            finalizedAt:
              status !== "draft"
                ? new Date(month + "-28T18:00:00Z").toISOString()
                : undefined,
            paidAt:
              status === "paid"
                ? new Date(month + "-28T18:00:00Z").toISOString()
                : undefined,
            type: "project" as const,
          };
        })
        .filter(Boolean) as ProjectBilling[];

      // Calculate summary totals
      const totalFilesCompleted = projects.reduce(
        (sum, p) => sum + p.totalFilesCompleted,
        0,
      );
      const totalAmountUSD = projects.reduce((sum, p) => sum + p.amountUSD, 0);
      const totalAmountINR = totalAmountUSD * conversionRate;

      // Count automation vs manual processes
      const allProcesses = projects.flatMap((p) => p.fileProcesses);
      const automationProcesses = allProcesses.filter(
        (fp) => fp.type === "automation",
      ).length;
      const manualProcesses = allProcesses.filter(
        (fp) => fp.type === "manual",
      ).length;

      return {
        month,
        totalFilesCompleted,
        totalAmountUSD,
        totalAmountINR,
        conversionRate,
        itemsCount: projects.length,
        projects,
        automationProcesses,
        manualProcesses,
      };
    })
    .filter((summary) => summary.projects.length > 0); // Only include months with actual billing data
};

export default function Billing() {
  const { user: currentUser } = useAuth();
  const [usdToInrRate, setUsdToInrRate] = useState<number>(() => {
    const v = localStorage.getItem("usdToInrRate");
    const n = v ? parseFloat(v) : NaN;
    return Number.isFinite(n) ? n : 83;
  });
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBilling, setSelectedBilling] =
    useState<MonthlyBillingSummary | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [billingData, setBillingData] = useState<MonthlyBillingSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp: any = await apiClient.getBillingSummary(undefined, 6);
        const list = (resp && resp.data) || resp || [];
        setBillingData(list);
      } catch (e) {
        console.error("Failed to load billing summary", e);
        setBillingData([]);
      }
    };
    load();
  }, []);

  // Only allow super admin to access billing
  if (currentUser?.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            This page is only accessible to administrators.
          </p>
        </div>
      </div>
    );
  }

  const canManageBilling = currentUser?.role === "super_admin";

  // Filter billing data
  const filteredBillingData = billingData.filter((billing) => {
    const matchesMonth =
      selectedMonth === "all" || billing.month === selectedMonth;
    const matchesSearch = billing.projects.some(
      (project) =>
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (selectedStatus !== "all") {
      const hasMatchingStatus = billing.projects.some(
        (project) => project.status === selectedStatus,
      );
      return matchesMonth && matchesSearch && hasMatchingStatus;
    }

    return matchesMonth && matchesSearch;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "finalized":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="h-3 w-3" />;
      case "finalized":
        return <Clock className="h-3 w-3" />;
      case "paid":
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const calculateTotalStats = () => {
    const totalFiles = billingData.reduce(
      (sum, billing) => sum + billing.totalFilesCompleted,
      0,
    );
    const totalUSD = billingData.reduce(
      (sum, billing) => sum + billing.totalAmountUSD,
      0,
    );
    const totalINR = billingData.reduce(
      (sum, billing) => sum + billing.totalAmountINR,
      0,
    );
    const totalAutomationFiles = billingData.reduce(
      (sum, billing) => sum + billing.automationProcesses,
      0,
    );
    const totalManualFiles = billingData.reduce(
      (sum, billing) => sum + billing.manualProcesses,
      0,
    );

    const pendingUSD = billingData
      .flatMap((billing) => billing.projects)
      .filter((project) => project.status !== "paid")
      .reduce((sum, project) => sum + project.amountUSD, 0);
    const paidUSD = billingData
      .flatMap((billing) => billing.projects)
      .filter((project) => project.status === "paid")
      .reduce((sum, project) => sum + project.amountUSD, 0);

    return {
      totalFiles,
      totalUSD,
      totalINR,
      pendingUSD,
      paidUSD,
      totalAutomationFiles,
      totalManualFiles,
    };
  };

  const stats = calculateTotalStats();

  const handleViewDetails = (billing: MonthlyBillingSummary) => {
    setSelectedBilling(billing);
    setIsDetailsDialogOpen(true);
  };

  const handleExportBilling = async (
    format: "csv" | "excel" | "pdf",
    month?: string,
  ) => {
    try {
      const blob = await apiClient.exportBilling(format, month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `billing_${month || "summary"}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const formatCurrency = (amount: number, currency: "USD" | "INR") => {
    if (currency === "USD") {
      return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Billing Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Monthly billing reports with USD and INR calculations for all
            projects.
          </p>
        </div>
        {canManageBilling && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExportBilling("csv")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportBilling("excel")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => handleExportBilling("pdf")}>
              <Receipt className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Files Processed
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalFiles.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All file processes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Automation Processes
            </CardTitle>
            <Bot className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalAutomationFiles}
            </div>
            <p className="text-xs text-muted-foreground">Automated tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Manual Processes
            </CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalManualFiles}
            </div>
            <p className="text-xs text-muted-foreground">Manual tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings (USD)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalUSD, "USD")}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on file completion
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.paidUSD, "USD")}
            </div>
            <p className="text-xs text-muted-foreground">Received payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.pendingUSD, "USD")}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
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
                placeholder="Search by project name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {billingData.map((billing) => (
                  <SelectItem key={billing.month} value={billing.month}>
                    {new Date(billing.month + "-01").toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                      },
                    )}
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="finalized">Finalized</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Billing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Billing Summary</CardTitle>
          <CardDescription>
            Overview of billing for each month with project breakdowns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Files Completed</TableHead>
                <TableHead>Amount (USD)</TableHead>
                <TableHead>Amount (INR)</TableHead>
                <TableHead>Status Overview</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBillingData.map((billing) => {
                const statusCounts = billing.projects.reduce(
                  (acc, project) => {
                    acc[project.status] = (acc[project.status] || 0) + 1;
                    return acc;
                  },
                  {} as Record<string, number>,
                );

                return (
                  <TableRow key={billing.month}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(billing.month + "-01").toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                              },
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Rate: ₹{usdToInrRate}/USD
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {billing.itemsCount} projects
                        </div>
                        <div className="text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Bot className="h-3 w-3 text-blue-600" />
                            <span>
                              {billing.automationProcesses} automation
                            </span>
                            <User className="h-3 w-3 text-green-600" />
                            <span>{billing.manualProcesses} manual</span>
                          </div>
                          <div className="text-xs">
                            {billing.projects
                              .slice(0, 2)
                              .map((p) => p.projectName)
                              .join(", ")}
                            {billing.projects.length > 2 &&
                              ` +${billing.projects.length - 2} more`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {billing.totalFilesCompleted.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">
                          files completed
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          {formatCurrency(billing.totalAmountUSD, "USD")}
                        </div>
                        <div className="text-muted-foreground">
                          Avg: $
                          {billing.totalFilesCompleted > 0
                            ? (
                                billing.totalAmountUSD /
                                billing.totalFilesCompleted
                              ).toFixed(4)
                            : "0.0000"}
                          /file
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-blue-600">
                          {formatCurrency(billing.totalAmountUSD * usdToInrRate, "INR")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(statusCounts).map(([status, count]) => (
                          <Badge
                            key={status}
                            className={getStatusBadgeColor(status)}
                            variant="outline"
                          >
                            {getStatusIcon(status)}
                            <span className="ml-1">{count}</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(billing)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleExportBilling("pdf", billing.month)
                          }
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Billing Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] lg:max-w-[1200px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Billing Details -{" "}
              {selectedBilling &&
                new Date(selectedBilling.month + "-01").toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                  },
                )}
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of projects, file processing jobs, and earnings
              for the selected month.
            </DialogDescription>
          </DialogHeader>

          {selectedBilling && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Item Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Total Files Completed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedBilling.totalFilesCompleted.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">File Processes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedBilling.projects.reduce(
                          (sum, p) => sum + p.fileProcesses.length,
                          0,
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Bot className="h-3 w-3 text-blue-600" />
                        <span>
                          {selectedBilling.automationProcesses} automation
                        </span>
                        <User className="h-3 w-3 text-green-600" />
                        <span>{selectedBilling.manualProcesses} manual</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Amount (USD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(selectedBilling.totalAmountUSD, "USD")}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Amount (INR)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-blue-600">
                        {formatCurrency(selectedBilling.totalAmountUSD * usdToInrRate, "INR")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Rate: ₹{usdToInrRate}/USD
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-6">
                  {selectedBilling.projects.map((project) => (
                    <div key={project.projectId}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{project.projectName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Client: {project.client}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatCurrency(project.amountUSD, "USD")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ${project.ratePerFile}/file
                          </div>
                        </div>
                      </div>

                      {/* File Process Breakdown */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File Process</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Total Files</TableHead>
                            <TableHead>Completed</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Amount (USD)</TableHead>
                            <TableHead>Amount (INR)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {project.fileProcesses.map((fp) => {
                            const processAmount =
                              fp.completedFiles * project.ratePerFile;
                            return (
                              <TableRow key={fp.processId}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {fp.processName}
                                    </div>
                                    {fp.fileName && (
                                      <div className="text-xs text-muted-foreground">
                                        {fp.fileName}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {fp.type === "automation" ? (
                                      <>
                                        <Bot className="h-3 w-3 text-blue-600" />
                                        <span className="text-xs text-blue-600">
                                          Automation
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <User className="h-3 w-3 text-green-600" />
                                        <span className="text-xs text-green-600">
                                          Manual
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {fp.totalFiles.toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium">
                                    {fp.completedFiles.toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">
                                      {fp.progressPercentage.toFixed(1)}%
                                    </div>
                                    <Progress
                                      value={fp.progressPercentage}
                                      className="h-1.5"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-green-600">
                                    {formatCurrency(processAmount, "USD")}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-blue-600">
                                    {formatCurrency(
                                      processAmount * project.conversionRate,
                                      "INR",
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          {/* Project Total Row */}
                          <TableRow className="bg-muted/50 border-t-2">
                            <TableCell className="font-bold">
                              Project Total
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {
                                    project.fileProcesses.filter(
                                      (fp) => fp.type === "automation",
                                    ).length
                                  }{" "}
                                  auto
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {
                                    project.fileProcesses.filter(
                                      (fp) => fp.type === "manual",
                                    ).length
                                  }{" "}
                                  manual
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">
                              {project.fileProcesses
                                .reduce((sum, fp) => sum + fp.totalFiles, 0)
                                .toLocaleString()}
                            </TableCell>
                            <TableCell className="font-bold">
                              {project.totalFilesCompleted.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={getStatusBadgeColor(project.status)}
                              >
                                {getStatusIcon(project.status)}
                                <span className="ml-1">
                                  {project.status.toUpperCase()}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-green-600">
                              {formatCurrency(project.amountUSD, "USD")}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
            {selectedBilling && (
              <Button
                onClick={() =>
                  handleExportBilling("pdf", selectedBilling.month)
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
