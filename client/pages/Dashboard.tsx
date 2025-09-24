import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Users,
  FolderOpen,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  DollarSign,
  FileText,
  Timer,
  PieChart,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { apiClient } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) return null;

  // Load real-time data for user dashboard
  const [userSummary, setUserSummary] = React.useState<{
    today: {
      target: number;
      completed: number;
      remaining: number;
      efficiency: number;
    };
    weekly: { target: number; completed: number; efficiency: number };
    monthly: { target: number; completed: number; efficiency: number };
    assignedProjects: number;
  } | null>(null);
  const [weeklyChartData, setWeeklyChartData] = React.useState<
    { day: string; completed: number; target: number }[]
  >([]);
  // Role-based data
  const [myRequests, setMyRequests] = React.useState<any[]>([]);
  const [teamPerformance, setTeamPerformance] = React.useState<any[]>([]);
  const [pmFileRequests, setPmFileRequests] = React.useState<any[]>([]);
  const [fileProcesses, setFileProcesses] = React.useState<any[]>([]);
  const [usersTotal, setUsersTotal] = React.useState<number | null>(null);
  const [billingSummary, setBillingSummary] = React.useState<any | null>(null);

  // Admin analytics states (live data)
  const [profitLoss, setProfitLoss] = React.useState<any[]>([]); // last 6 months
  const [expenseAnalytics, setExpenseAnalytics] = React.useState<any | null>(
    null,
  );
  const [adminTrends, setAdminTrends] = React.useState<
    { day: string; manual: number; automation: number; total: number }[]
  >([]);
  const [alerts, setAlerts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const summary = await apiClient.getUserDashboard();
        setUserSummary(summary as any);
      } catch (e) {
        console.warn("Failed to load user summary", e);
      }
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        const to = end.toISOString().slice(0, 10);
        const from = start.toISOString().slice(0, 10);
        const data: any[] = (await apiClient.getProductivityTrend({
          from,
          to,
          groupBy: "day",
          userId: user.id,
        })) as any[];
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const chart = (Array.isArray(data) ? data : []).map((d: any) => {
          const dt = new Date(d.date);
          const isToday =
            dt.toISOString().slice(0, 10) ===
            new Date().toISOString().slice(0, 10);
          return {
            day: isToday ? "Today" : days[dt.getDay()],
            completed: Number(d.actual || 0),
            target: Number(d.target || 0),
          };
        });
        setWeeklyChartData(chart);
      } catch (e) {
        console.warn("Failed to load trend", e);
      }

      if (user.role === "user") {
        apiClient
          .getFileRequests({ userId: user.id, limit: 100 })
          .then((res: any) => {
            const list = Array.isArray(res) ? res : (res?.data as any[]) || [];
            setMyRequests(list);
          })
          .catch(() => undefined);
      }

      if (
        user.role === "project_manager" ||
        user.role === "super_admin" ||
        user.role === "admin"
      ) {
        try {
          const [tp, fr, fp] = await Promise.all([
            apiClient.getTeamPerformance("week"),
            apiClient.getFileRequests({ limit: 200 }),
            apiClient.getFileProcesses({ limit: 200 }),
          ]);
          setTeamPerformance(
            (Array.isArray(tp) ? tp : (tp as any) || []) as any,
          );
          setPmFileRequests(
            (Array.isArray(fr) ? fr : (fr as any) || []) as any,
          );
          setFileProcesses((Array.isArray(fp) ? fp : (fp as any) || []) as any);
        } catch (e) {
          console.warn("Failed to load PM/Admin data", e);
        }
        if (user.role === "super_admin") {
          try {
            const users = await apiClient.getUsers({ page: 1, limit: 1 });
            const total =
              (users as any)?.pagination?.total ??
              (users as any)?.data?.pagination?.total ??
              null;
            setUsersTotal(total);
          } catch (e) {
            setUsersTotal(null);
          }
          try {
            const bs = await apiClient.getBillingSummary();
            setBillingSummary(bs as any);
          } catch (e) {
            setBillingSummary(null);
          }

          // Admin-only analytics
          try {
            const [pl, ea] = await Promise.all([
              apiClient.getExpenseProfitLoss(),
              apiClient.getExpenseAnalyticsDashboard(),
            ]);
            setProfitLoss((Array.isArray(pl) ? pl : []) as any[]);
            setExpenseAnalytics(ea as any);
          } catch (e) {
            console.warn("Failed to load financial analytics", e);
          }
          try {
            const end = new Date();
            const start = new Date();
            start.setDate(end.getDate() - 6);
            const to = end.toISOString().slice(0, 10);
            const from = start.toISOString().slice(0, 10);
            const trend: any[] = (await apiClient.getProductivityTrend({
              from,
              to,
              groupBy: "day",
            })) as any[];
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const mapped = (Array.isArray(trend) ? trend : []).map((d: any) => {
              const dt = new Date(d.date);
              const label = days[dt.getDay()];
              const manual = Number(d.manual || 0);
              const automation = Number(d.automation || 0);
              const total = Number(d.actual || manual + automation || 0);
              return { day: label, manual, automation, total };
            });
            setAdminTrends(mapped);
          } catch (e) {
            console.warn("Failed to load org trends", e);
          }
          try {
            const recents = await apiClient.getRecentAlerts(10);
            setAlerts((Array.isArray(recents) ? recents : []) as any[]);
          } catch (e) {
            setAlerts([]);
          }
        }
      }
    };
    load();
  }, [user.id, user.role]);

  // User dashboard: only 7-day chart + own file requests
  if (user.role === "user") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Your personal performance and requests
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {user.role.replace("_", " ")}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Your 7-Day Performance
            </CardTitle>
            <CardDescription>
              Daily file processing over the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    (Number(value) || 0).toLocaleString() + " files",
                    name === "completed" ? "Completed" : "Target",
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#94a3b8"
                  fill="#e2e8f0"
                  fillOpacity={0.3}
                  name="Target"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Your File Requests
            </CardTitle>
            <CardDescription>Only your requests are shown here</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Process</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.file_process_name ||
                        r.fileProcessName ||
                        "File Request"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {String(r.status || "").replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(
                        r.assigned_count ?? r.requested_count ?? 0,
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {myRequests.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No requests yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PM dashboard
  if (user.role === "project_manager") {
    const active = fileProcesses.filter(
      (p: any) => p.status === "active",
    ).length;
    const inProgress = fileProcesses.filter(
      (p: any) => p.status === "in_progress",
    ).length;
    const completed = fileProcesses.filter(
      (p: any) => p.status === "completed",
    ).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Manager Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Team performance, requests, and process overview
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {user.role.replace("_", " ")}
          </Badge>
        </div>

        {/* File Processes Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {inProgress}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {completed}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Team Performance (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="text-right">
                    Completed Requests
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(teamPerformance as any[]).map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name || u.id}</TableCell>
                    <TableCell className="text-right">
                      {Number(u.submitted || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(u.completedRequests || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {teamPerformance.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* File Requests (managed) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> File Requests
            </CardTitle>
            <CardDescription>Recent requests from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Verified By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pmFileRequests as any[]).slice(0, 50).map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.user_name || r.userName || "-"}</TableCell>
                    <TableCell>
                      {r.file_process_name || r.fileProcessName || "-"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {String(r.status || "").replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(
                        r.assigned_count ?? r.requested_count ?? 0,
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {r.assigned_date || r.requested_date
                        ? new Date(
                            r.assigned_date || r.requested_date,
                          ).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {r.start_row && r.end_row
                        ? `${Number(r.start_row).toLocaleString()} - ${Number(r.end_row).toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {r.completed_date
                        ? new Date(r.completed_date).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>{r.verified_by || "-"}</TableCell>
                  </TableRow>
                ))}
                {pmFileRequests.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render comprehensive admin dashboard with live data
  const weeklyTotalFiles = adminTrends.reduce((s, d) => s + (d.total || 0), 0);
  const activeContributors = teamPerformance.length;
  const latestPL = profitLoss[profitLoss.length - 1] || null;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Admin Control Center
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Complete business analytics and operational insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="capitalize text-lg px-4 py-2">
            {user.role.replace("_", " ")}
          </Badge>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Last updated</p>
            <p className="text-sm font-medium">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview (Admin) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {usersTotal ?? "-"}
            </div>
            <p className="text-xs text-muted-foreground">Total users</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {billingSummary?.totalAmountUSD != null
                ? `$${Number(billingSummary.totalAmountUSD).toLocaleString()}`
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Files Completed (7 days)
            </CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {weeklyTotalFiles.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Org total</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Contributors
            </CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {activeContributors}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Chart (Profit & Loss) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Profit & Loss (6 months)
            </CardTitle>
            <CardDescription>Revenue, expenses and profit</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={profitLoss}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toLocaleString() : value,
                    name === "revenue"
                      ? "Revenue (₹)"
                      : name === "totalExpense"
                        ? "Expenses (₹)"
                        : name === "netProfit"
                          ? "Net Profit (₹)"
                          : name,
                  ]}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  fill="#3b82f6"
                  name="Revenue"
                />
                <Bar
                  yAxisId="left"
                  dataKey="totalExpense"
                  fill="#ef4444"
                  name="Expenses"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="netProfit"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Net Profit"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Expense Distribution (this month)
            </CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={expenseAnalytics?.topExpenseCategories || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) =>
                    `${name}: ${Number(value).toLocaleString()}`
                  }
                >
                  {(expenseAnalytics?.topExpenseCategories || []).map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill || "#8884D8"}
                      />
                    ),
                  )}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toLocaleString() : value,
                    name,
                  ]}
                />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance and Daily Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Performance (7 days)
            </CardTitle>
            <CardDescription>
              Current team productivity and efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                  <TableHead className="text-right">
                    Completed Requests
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(teamPerformance as any[]).map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name || u.id}</TableCell>
                    <TableCell className="text-right">
                      {Number(u.submitted || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(u.completedRequests || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {teamPerformance.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              This Week Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Total Files
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {weeklyTotalFiles.toLocaleString()}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Net Profit (₹)
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {latestPL
                      ? Number(latestPL.netProfit || 0).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Revenue (₹)
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {expenseAnalytics?.currentMonth?.totalRevenue != null
                      ? Number(
                          expenseAnalytics.currentMonth.totalRevenue,
                        ).toLocaleString()
                      : "-"}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-orange-900">
                    Active Contributors
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {activeContributors}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trends and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Daily Productivity Trends (7 days)
            </CardTitle>
            <CardDescription>Manual vs Automation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={adminTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === "number" ? value.toLocaleString() : value,
                    name === "manual"
                      ? "Manual"
                      : name === "automation"
                        ? "Automation"
                        : name,
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="manual"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Manual"
                />
                <Area
                  type="monotone"
                  dataKey="automation"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.4}
                  name="Automation"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-time Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              System Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((a: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-4 rounded-lg border ${a.type === "error" ? "bg-red-50 border-red-200" : a.type === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}
                >
                  {a.type === "error" ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : a.type === "warning" ? (
                    <Timer className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <Users className="h-5 w-5 text-blue-600" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {a.title || a.message || "Alert"}
                    </p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground">
                        {a.description}
                      </p>
                    )}
                  </div>
                  {a.time && (
                    <span className="text-xs text-muted-foreground">
                      {a.time}
                    </span>
                  )}
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-sm text-muted-foreground">No alerts</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Navigating to User Management",
                      description:
                        "Opening team and user management interface...",
                    });
                    navigate("/users");
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Teams
                </Button>
                <Button
                  className="w-full justify-start hover:bg-green-50 hover:border-green-300 transition-colors"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Opening Project Management",
                      description:
                        "Accessing project overview and management tools...",
                    });
                    navigate("/projects");
                  }}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  View Projects
                </Button>
                <Button
                  className="w-full justify-start hover:bg-purple-50 hover:border-purple-300 transition-colors"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Opening Reports & Analytics",
                      description: "Loading comprehensive business reports...",
                    });
                    navigate("/reports");
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
                <Button
                  className="w-full justify-start hover:bg-orange-50 hover:border-orange-300 transition-colors"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Opening File Process Management",
                      description:
                        "Accessing target settings and file processing controls...",
                    });
                    navigate("/file-process");
                  }}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Set Targets
                </Button>
                <Button
                  className="w-full justify-start hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Advanced Analytics",
                      description:
                        "Opening detailed performance analytics dashboard...",
                    });
                    navigate("/reports");
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
