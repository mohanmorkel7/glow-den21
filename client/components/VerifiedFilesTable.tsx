import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDuration as defaultFormatDuration } from "@/lib/utils";
import { apiClient } from "@/lib/api";

interface VerifiedFile {
  id: string;
  userName?: string;
  fileProcessName?: string;
  assignedCount?: number;
  requestedCount?: number;
  status?: string;
  verifiedBy?: string;
  completedDate?: string | null;
  requestedDate?: string | null;
}

export default function VerifiedFilesTable({
  files,
  currentUser,
  loadData,
  formatDuration = defaultFormatDuration,
}: {
  files: VerifiedFile[];
  currentUser: any;
  loadData: () => Promise<void> | void;
  formatDuration?: (from?: string | null, to?: string | null) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Process</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verified By</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(files || []).slice(0, 8).map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.userName}</TableCell>
              <TableCell className="text-muted-foreground">{request.fileProcessName}</TableCell>
              <TableCell className="text-right">{(request.assignedCount ?? request.requestedCount ?? 0).toLocaleString()}</TableCell>
              <TableCell>
                <Badge className={request.status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {request.status === "completed" ? "Approved" : "Rework"}
                </Badge>
              </TableCell>
              <TableCell>{request.verifiedBy || "-"}</TableCell>
              <TableCell>{request.completedDate ? new Date(request.completedDate).toLocaleString() : "-"}</TableCell>
              <TableCell>{formatDuration(request.requestedDate, request.completedDate)}</TableCell>
              <TableCell>
                {currentUser && (currentUser.role === "project_manager" || currentUser.role === "super_admin") && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={async () => {
                        if (!confirm("Mark this request as Rework?")) return;
                        try {
                          await apiClient.verifyCompletedRequest(request.id, "reject", "Re-check requested");
                          await loadData();
                        } catch (e) {
                          console.error(e);
                          alert("Failed to set Rework");
                        }
                      }}
                    >
                      Re-check
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
