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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  History,
  RefreshCw,
  Upload,
  Eye,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { apiClient } from "@/lib/api";

interface FileRequest {
  id: string;
  userId: string;
  userName: string;
  requestedCount: number;
  requestedDate: string;
  status:
    | "pending"
    | "assigned"
    | "received"
    | "in_progress"
    | "completed"
    | "pending_verification"
    | "verified";
  fileProcessId?: string;
  fileProcessName?: string;
  assignedBy?: string;
  assignedDate?: string;
  assignedCount?: number;
  downloadLink?: string;
  completedDate?: string;
  startRow?: number;
  endRow?: number;
  outputFile?: {
    name: string;
    size: number;
    uploadDate: string;
  };
  notes?: string;
  verificationStatus?: "pending" | "approved" | "rejected";
  verifiedBy?: string;
  verifiedDate?: string;
  verificationNotes?: string;
}

interface DailyStats {
  date: string;
  completedCount: number;
  totalAssigned: number;
}

const mockFileRequests: FileRequest[] = [
  {
    id: "1",
    userId: "3",
    userName: "Sarah Johnson",
    requestedCount: 1000,
    requestedDate: "2024-01-20T10:30:00Z",
    status: "assigned",
    fileProcessId: "fp_1",
    fileProcessName: "Aug-2025-File",
    assignedBy: "John Smith",
    assignedDate: "2024-01-20T11:00:00Z",
    downloadLink: "/downloads/sarah_johnson_aug_2025_1001_2000.csv",
    startRow: 1001,
    endRow: 2000,
  },
  {
    id: "2",
    userId: "3",
    userName: "Sarah Johnson",
    requestedCount: 800,
    requestedDate: "2024-01-19T14:20:00Z",
    status: "completed",
    fileProcessId: "fp_1",
    fileProcessName: "Aug-2025-File",
    assignedBy: "Emily Wilson",
    assignedDate: "2024-01-19T15:00:00Z",
    downloadLink: "/downloads/sarah_johnson_aug_2025_1_800.csv",
    completedDate: "2024-01-19T18:30:00Z",
    startRow: 1,
    endRow: 800,
  },
  {
    id: "3",
    userId: "3",
    userName: "Sarah Johnson",
    requestedCount: 1200,
    requestedDate: "2024-01-18T09:15:00Z",
    status: "in_progress",
    fileProcessId: "fp_1",
    fileProcessName: "Aug-2025-File",
    assignedBy: "John Smith",
    assignedDate: "2024-01-18T10:00:00Z",
    downloadLink: "/downloads/sarah_johnson_aug_2025_2001_3200.csv",
    startRow: 2001,
    endRow: 3200,
  },
];

const mockDailyStats: DailyStats[] = [
  { date: "2024-01-20", completedCount: 1000, totalAssigned: 1000 },
  { date: "2024-01-19", completedCount: 800, totalAssigned: 800 },
  { date: "2024-01-18", completedCount: 1200, totalAssigned: 1200 },
];

export default function RequestFiles() {
  const { user: currentUser } = useAuth();
  const [fileRequests, setFileRequests] = useState<FileRequest[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>(mockDailyStats);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestCount, setRequestCount] = useState(500);
  const [activeTab, setActiveTab] = useState("current");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedRequestForUpload, setSelectedRequestForUpload] = useState<
    string | null
  >(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await apiClient.getFileRequests({ page: 1, limit: 500 });
        const list = Array.isArray(all) ? all : (all as any)?.data || [];
        const normalized = (list as any[]).map((r: any) => ({
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
          fileProcessId: r.file_process_id || r.fileProcessId || undefined,
          fileProcessName:
            r.file_process_name || r.fileProcessName || undefined,
          assignedBy: r.assigned_by || r.assignedBy || undefined,
          assignedDate: r.assigned_date || r.assignedDate || undefined,
          assignedCount: r.assigned_count ?? r.assignedCount ?? undefined,
          downloadLink: r.download_link || r.downloadLink || undefined,
          completedDate: r.completed_date || r.completedDate || undefined,
          startRow: r.start_row ?? r.startRow ?? undefined,
          endRow: r.end_row ?? r.endRow ?? undefined,
          notes: r.notes || undefined,
          outputFile: r.output_file || undefined,
          verificationStatus:
            r.verification_status || r.verificationStatus || undefined,
          verifiedBy: r.verified_by || r.verifiedBy || undefined,
          verifiedDate: r.verified_date || r.verifiedDate || undefined,
          verificationNotes:
            r.verification_notes || r.verificationNotes || undefined,
        }));
        const userList = normalized.filter(
          (r: any) => r.userId === currentUser?.id,
        );
        setFileRequests(userList);

        // Convert any newly assigned requests to in_progress (display + persist)
        const justAssigned = userList.filter(
          (r: any) => r.status === "assigned",
        );
        if (justAssigned.length > 0) {
          // Update server in background; ignore failures
          Promise.allSettled(
            justAssigned.map((r: any) =>
              apiClient.updateFileRequest(r.id, {
                status: "in_progress",
              } as any),
            ),
          ).catch(() => undefined);
          // Update UI immediately
          setFileRequests((prev) =>
            prev.map((r) =>
              r.status === "assigned" ? { ...r, status: "in_progress" } : r,
            ),
          );
        }
      } catch (e) {
        console.error("Failed to load file requests", e);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only allow users to access this page
  if (currentUser?.role !== "user") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            This page is only accessible to regular users.
          </p>
        </div>
      </div>
    );
  }

  const getCurrentUserRequests = () => {
    return fileRequests.filter((request) => request.userId === currentUser.id);
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayStats = dailyStats.find((stat) => stat.date === today);
    return todayStats || { date: today, completedCount: 0, totalAssigned: 0 };
  };

  const handleFileRequest = async () => {
    // Check if user has any pending or in-progress requests
    const hasActiveRequests = getCurrentUserRequests().some(
      (req) =>
        req.status === "pending" ||
        req.status === "in_progress" ||
        req.status === "pending_verification",
    );

    if (hasActiveRequests) {
      alert(
        "You cannot request new files while you have pending or in-progress requests. Please complete your current work first.",
      );
      return;
    }

    try {
      const created = await apiClient.createFileRequest({
        userId: currentUser.id,
        userName: currentUser.name,
        requestedCount: requestCount,
      });
      const req: any = created as any;
      const normalized: FileRequest = {
        id: req.id,
        userId: req.user_id || currentUser.id,
        userName: req.user_name || currentUser.name,
        requestedCount: req.requested_count || requestCount,
        requestedDate: req.requested_date || new Date().toISOString(),
        status: req.status || "pending",
        fileProcessId: req.file_process_id || undefined,
        fileProcessName: req.file_process_name || undefined,
        assignedBy: req.assigned_by || undefined,
        assignedDate: req.assigned_date || undefined,
        downloadLink: req.download_link || undefined,
        completedDate: req.completed_date || undefined,
        startRow: req.start_row || undefined,
        endRow: req.end_row || undefined,
        notes: req.notes || undefined,
      } as any;
      setFileRequests([normalized, ...fileRequests]);
      setIsRequestDialogOpen(false);
      setRequestCount(500);
    } catch (e) {
      alert("Failed to submit request");
      console.error(e);
    }
  };

  const handleDownload = async (requestId: string) => {
    try {
      const { blob, filename } = await apiClient.downloadFileRequest(requestId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Optimistically reflect in UI; server also updates status
      setFileRequests((prev) =>
        prev.map((req) =>
          req.id === requestId && req.status === "assigned"
            ? { ...req, status: "in_progress" }
            : req,
        ),
      );
    } catch (e) {
      console.error("Download failed", e);
      alert(
        (e as any)?.message ||
          "Download failed. Ensure a CSV was uploaded for this process.",
      );
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    newStatus: "in_progress" | "completed",
  ) => {
    if (newStatus === "completed") {
      // Open upload dialog instead of directly completing
      setSelectedRequestForUpload(requestId);
      setIsUploadDialogOpen(true);
      return;
    }

    // For other status changes, proceed normally and persist
    try {
      await apiClient.updateFileRequest(requestId, {
        status: newStatus,
      } as any);
    } catch (e) {
      console.error("Failed to update status", e);
    }
    setFileRequests(
      fileRequests.map((request) =>
        request.id === requestId ? { ...request, status: newStatus } : request,
      ),
    );
  };

  const handleFileUpload = async () => {
    if (!uploadedFile || !selectedRequestForUpload) return;

    // Validate file type
    if (!uploadedFile.name.toLowerCase().endsWith(".zip")) {
      alert("Please upload a ZIP file only.");
      return;
    }

    try {
      await apiClient.uploadCompletedRequestFile(
        selectedRequestForUpload,
        uploadedFile,
        uploadedFile.name,
      );
    } catch (e) {
      console.error("Failed to upload completed file", e);
      alert((e as any)?.message || "Upload failed");
      return;
    }

    // Update local state
    setFileRequests(
      fileRequests.map((request) =>
        request.id === selectedRequestForUpload
          ? {
              ...request,
              status: "in_review",
              completedDate: new Date().toISOString(),
              outputFile: {
                name: uploadedFile.name,
                size: uploadedFile.size,
                uploadDate: new Date().toISOString(),
              },
              notes: uploadNotes.trim() || undefined,
              verificationStatus: "pending",
            }
          : request,
      ),
    );

    // Reset upload state
    setIsUploadDialogOpen(false);
    setSelectedRequestForUpload(null);
    setUploadedFile(null);
    setUploadNotes("");
    setIsDragOver(false);

    // Clear file input
    const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "received":
        return "bg-purple-100 text-purple-800";
      case "in_progress":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending_verification":
        return "bg-cyan-100 text-cyan-800";
      case "in_review":
        return "bg-cyan-100 text-cyan-800";
      case "rework":
        return "bg-red-100 text-red-800";
      case "verified":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const currentRequests = getCurrentUserRequests();
  const pendingRequests = currentRequests.filter((r) =>
    [
      "pending",
      "assigned",
      "in_progress",
      "pending_verification",
      "in_review",
      "rework",
    ].includes(r.status),
  );
  const completedRequests = currentRequests.filter((r) =>
    ["completed", "verified"].includes(r.status),
  );
  const allHistoryRequests = currentRequests.filter((r) =>
    [
      "completed",
      "verified",
      "in_progress",
      "pending_verification",
      "in_review",
      "rework",
    ].includes(r.status),
  );
  const assignedRequests = currentRequests.filter(
    (r) => r.status === "assigned",
  );
  const todayStats = getTodayStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Request Files</h1>
          <p className="text-muted-foreground mt-1">
            Request file allocations and track your processing progress.
          </p>
        </div>
        <Dialog
          open={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              disabled={getCurrentUserRequests().some(
                (req) =>
                  req.status === "pending" ||
                  req.status === "in_progress" ||
                  req.status === "pending_verification" ||
                  req.status === "in_review",
              )}
            >
              <Plus className="h-4 w-4 mr-2" />
              Request Files
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[75vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request File Allocation</DialogTitle>
              <DialogDescription>
                Request your daily file allocation for processing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Today's Completed</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {todayStats.completedCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    files processed today
                  </p>
                </div>
                <div>
                  <Label>Pending Requests</Label>
                  <div className="text-2xl font-bold text-orange-600">
                    {pendingRequests.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    awaiting processing
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestCount">Request Count</Label>
                <Input
                  id="requestCount"
                  type="number"
                  min="100"
                  max="2000"
                  value={requestCount}
                  onChange={(e) =>
                    setRequestCount(parseInt(e.target.value) || 500)
                  }
                  placeholder="500"
                />
                <p className="text-xs text-muted-foreground">
                  Recommended range: 500-1500 files per request
                </p>
              </div>
              {getCurrentUserRequests().some(
                (req) =>
                  req.status === "pending" || req.status === "in_progress",
              ) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    ⚠️ You cannot request new files while you have pending or
                    in-progress requests. Please complete your current work
                    first.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRequestDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFileRequest}
                disabled={getCurrentUserRequests().some(
                  (req) =>
                    req.status === "pending" || req.status === "in_progress",
                )}
              >
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Files Available Alert */}
      {assignedRequests.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-800">
                  🎉 New files are ready for download!
                </h3>
                <p className="text-sm text-green-700">
                  You have {assignedRequests.length} file
                  {assignedRequests.length > 1 ? "s" : ""} ready for download
                  and processing.
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {assignedRequests
                    .reduce(
                      (sum, req) =>
                        sum + (req.assignedCount || req.requestedCount),
                      0,
                    )
                    .toLocaleString()}
                </div>
                <div className="text-xs text-green-700">files ready</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {todayStats.completedCount.toLocaleString()}
              </div>
              <div className="text-sm text-green-700">
                Files Completed Today
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {pendingRequests
                  .reduce((sum, req) => sum + req.requestedCount, 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">Files In Queue</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {pendingRequests.length}
              </div>
              <div className="text-sm text-purple-700">Active Requests</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Requests</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Active Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Active Requests</CardTitle>
              <CardDescription>
                Track your current file requests and downloads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    No active requests
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Request files to get started with your daily processing.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsRequestDialogOpen(true)}
                    disabled={getCurrentUserRequests().some(
                      (req) =>
                        req.status === "pending" ||
                        req.status === "in_progress",
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Request Files
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card
                      key={request.id}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">
                              {request.fileProcessName || "File Request"}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {request.requestedCount.toLocaleString()} files
                              requested
                              {request.assignedCount &&
                                request.assignedCount !==
                                  request.requestedCount && (
                                  <span className="text-blue-600 ml-2">
                                    ({request.assignedCount.toLocaleString()}{" "}
                                    assigned)
                                  </span>
                                )}
                            </p>
                            {request.startRow && request.endRow && (
                              <p className="text-xs text-muted-foreground">
                                Data Range: {request.startRow.toLocaleString()}{" "}
                                - {request.endRow.toLocaleString()}
                              </p>
                            )}
                            {request.assignedBy && (
                              <p className="text-xs text-blue-600">
                                ✓ Assigned by {request.assignedBy} on{" "}
                                {new Date(
                                  request.assignedDate || "",
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getStatusBadgeColor(
                                request.status === "assigned"
                                  ? "in_progress"
                                  : request.status,
                              )}
                            >
                              {(request.status === "assigned"
                                ? "in_progress"
                                : request.status
                              )
                                .replace("_", " ")
                                .toUpperCase()}
                            </Badge>
                            {/* For 'assigned', do not show the download button; show only In-Progress as requested */}
                            {request.status === "in_progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(request.id)}
                                className="mr-2"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {(() => {
                                  const nameFromLink = request.downloadLink
                                    ?.split("/")
                                    .pop();
                                  if (nameFromLink) return nameFromLink;
                                  const safe = (s: string) =>
                                    s
                                      .toLowerCase()
                                      .replace(/\s+/g, "_")
                                      .replace(/[^a-z0-9_\-]/g, "");
                                  const baseUser = safe(
                                    currentUser?.name ||
                                      request.userName ||
                                      "user",
                                  );
                                  const baseProc = safe(
                                    request.fileProcessName || "file",
                                  );
                                  const start = request.startRow ?? 1;
                                  const end =
                                    request.endRow ?? request.requestedCount;
                                  return `${baseUser}_${baseProc}_${start}_${end}.csv`;
                                })()}
                              </Button>
                            )}
                            {request.status === "in_progress" && (
                              <Select
                                value={request.status}
                                onValueChange={(value) =>
                                  handleStatusUpdate(
                                    request.id,
                                    value as "in_progress" | "completed",
                                  )
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="in_progress">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      In Progress
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="completed">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      Completed
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {request.status === "pending_verification" && (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-cyan-100 text-cyan-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending Verification
                                </Badge>
                                {request.outputFile && (
                                  <Badge variant="outline" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {request.outputFile.name}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {request.status === "rework" && (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-red-100 text-red-800">Rework</Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequestForUpload(request.id);
                                    setIsUploadDialogOpen(true);
                                  }}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Re-upload
                                </Button>
                              </div>
                            )}
                            {request.status === "verified" && (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-emerald-100 text-emerald-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                                {request.outputFile && (
                                  <Badge variant="outline" className="text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {request.outputFile.name}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Requested:{" "}
                          {new Date(request.requestedDate).toLocaleString()}
                          {request.assignedBy && (
                            <span className="ml-4">
                              Assigned by: {request.assignedBy}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Need More Files Option */}
          {pendingRequests.length === 0 && completedRequests.length > 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <RefreshCw className="h-8 w-8 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Need More Files?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You've completed your current assignments. Request more files
                  to continue working.
                </p>
                <Button onClick={() => setIsRequestDialogOpen(true)}>
                  Request More Files
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {/* Completed History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Work History
              </CardTitle>
              <CardDescription>
                View and manage your file processing history. You can change
                status if needed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Process</TableHead>
                    <TableHead>Files Processed</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status Control</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allHistoryRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.fileProcessName || "File Request"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Assigned by: {request.assignedBy}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.requestedCount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {request.startRow && request.endRow ? (
                          <span className="text-sm">
                            {request.startRow.toLocaleString()} -{" "}
                            {request.endRow.toLocaleString()}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {request.completedDate
                          ? new Date(request.completedDate).toLocaleDateString()
                          : request.status === "in_progress"
                            ? "In Progress"
                            : "N/A"}
                      </TableCell>
                      <TableCell>
                        {request.status === "in_progress" ? (
                          <Select
                            value={request.status}
                            onValueChange={(value) =>
                              handleStatusUpdate(
                                request.id,
                                value as "in_progress" | "completed",
                              )
                            }
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                  In Progress
                                </div>
                              </SelectItem>
                              <SelectItem value="completed">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  Completed
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeColor(request.status)}>
                              {(request.status === "pending_verification" ||
                                request.status === "in_review") && (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {request.status === "verified" && (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              {request.status === "completed" && (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              {request.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            {request.status === "rework" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequestForUpload(request.id);
                                  setIsUploadDialogOpen(true);
                                }}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Re-upload
                              </Button>
                            )}
                          </div>
                        )}
                        {request.outputFile && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {request.outputFile.name}
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {allHistoryRequests.length === 0 && (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">
                    No history yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your work history will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Stats History */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dailyStats.map((stat) => (
                  <div
                    key={stat.date}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {new Date(stat.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.date === new Date().toISOString().split("T")[0]
                          ? "Today"
                          : stat.date ===
                              new Date(Date.now() - 24 * 60 * 60 * 1000)
                                .toISOString()
                                .split("T")[0]
                            ? "Yesterday"
                            : format(new Date(stat.date), "EEEE")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        {stat.completedCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        files completed
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-500" />
              Upload Completed Work
            </DialogTitle>
            <DialogDescription>
              Upload your completed work files in ZIP format for project manager
              verification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {/* Request Details */}
            {selectedRequestForUpload && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1 text-sm">
                  Request Details
                </h4>
                {(() => {
                  const request = fileRequests.find(
                    (r) => r.id === selectedRequestForUpload,
                  );
                  return request ? (
                    <div className="text-xs text-blue-700 space-y-0.5">
                      <p>
                        <strong>File Process:</strong>{" "}
                        {request.fileProcessName || "File Request"}
                      </p>
                      <p>
                        <strong>File Count:</strong>{" "}
                        {request.requestedCount.toLocaleString()}
                      </p>
                      {request.startRow && request.endRow && (
                        <p>
                          <strong>Row Range:</strong>{" "}
                          {request.startRow.toLocaleString()} -{" "}
                          {request.endRow.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="fileUpload" className="text-sm font-medium">
                Upload Completed Files (ZIP format only)
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (!file.name.toLowerCase().endsWith(".zip")) {
                      alert("Please select a ZIP file only.");
                      return;
                    }
                    if (file.size > 100 * 1024 * 1024) {
                      alert("File size must be less than 100MB.");
                      return;
                    }
                    setUploadedFile(file);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  // Only set to false if we're leaving the drop zone completely
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsDragOver(false);
                  }
                }}
              >
                <Input
                  id="fileUpload"
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.name.toLowerCase().endsWith(".zip")) {
                        alert("Please select a ZIP file only.");
                        e.target.value = "";
                        return;
                      }
                      if (file.size > 100 * 1024 * 1024) {
                        alert("File size must be less than 100MB.");
                        e.target.value = "";
                        return;
                      }
                      setUploadedFile(file);
                    }
                  }}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Upload
                    className={`h-8 w-8 mx-auto ${
                      isDragOver ? "text-blue-500" : "text-gray-400"
                    }`}
                  />
                  <div>
                    <Label
                      htmlFor="fileUpload"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Click to browse files
                    </Label>
                    <p
                      className={`text-sm ${
                        isDragOver ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      or drag and drop your ZIP file here
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    Maximum file size: 100MB
                  </p>
                </div>
              </div>

              {/* Selected File Display */}
              {uploadedFile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        const fileInput = document.getElementById(
                          "fileUpload",
                        ) as HTMLInputElement;
                        if (fileInput) fileInput.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Notes */}
            <div className="space-y-3">
              <Label htmlFor="uploadNotes" className="text-sm font-medium">
                Notes (Optional)
              </Label>
              <textarea
                id="uploadNotes"
                className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Add notes about your work..."
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
              />
            </div>

            {/* Instructions */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-1 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Instructions
              </h4>
              <ul className="text-xs text-yellow-700 space-y-0.5 list-disc list-inside">
                <li>Upload ZIP format only • Include all processed files</li>
                <li>
                  Work will be reviewed by PM • Approval required for completion
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedRequestForUpload(null);
                setUploadedFile(null);
                setUploadNotes("");
                setIsDragOver(false);
                const fileInput = document.getElementById(
                  "fileUpload",
                ) as HTMLInputElement;
                if (fileInput) fileInput.value = "";
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFileUpload}
              disabled={!uploadedFile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Submit for Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
