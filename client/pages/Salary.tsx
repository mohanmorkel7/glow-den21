import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
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
  DollarSign,
  Users,
  Settings,
  Calculator,
  TrendingUp,
  Edit,
  Save,
  AlertTriangle,
  Calendar,
  FileText,
  Target,
  IndianRupee,
  Eye,
  ChevronDown,
} from "lucide-react";

interface SalaryConfig {
  users: {
    firstTierRate: number; // Rate for first 500 files (in paisa)
    secondTierRate: number; // Rate after 500 files (in paisa)
    firstTierLimit: number; // Number of files for first tier (500)
  };
  projectManagers: {
    [key: string]: number; // Individual monthly salaries by PM ID
  };
}

interface UserSalaryData {
  id: string;
  name: string;
  role: string;
  todayFiles: number;
  weeklyFiles: number;
  monthlyFiles: number;
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  attendanceRate: number;
  lastActive: string;
}

interface SalaryBreakdown {
  period: string;
  files: number;
  tier1Files: number;
  tier1Rate: number;
  tier1Amount: number;
  tier2Files: number;
  tier2Rate: number;
  tier2Amount: number;
  totalAmount: number;
}

type BreakdownPeriod = "daily" | "weekly" | "monthly";

interface ProjectManagerSalaryData {
  id: string;
  name: string;
  role: string;
  monthlySalary: number; // Individual monthly salary
  attendanceRate: number;
  lastActive: string;
}

export default function Salary() {
  const { user: currentUser } = useAuth();

  // Only allow super_admin to access this page
  if (currentUser?.role !== "super_admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            This page is only accessible to super administrators.
          </p>
        </div>
      </div>
    );
  }

  // Configuration state
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>({
    users: {
      firstTierRate: 0.5, // 0.50 paisa per file for first 500
      secondTierRate: 0.6, // 0.60 paisa per file after 500
      firstTierLimit: 500, // First 500 files
    },
    projectManagers: {
      pm_1: 30000, // Emily Wilson - ₹30,000 monthly salary
      pm_2: 20000, // John Smith - ₹20,000 monthly salary
    },
  });

  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<SalaryConfig>(salaryConfig);
  const [isBreakdownDialogOpen, setIsBreakdownDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSalaryData | null>(null);
  const [breakdownPeriod, setBreakdownPeriod] =
    useState<BreakdownPeriod>("daily");
  const [breakdownData, setBreakdownData] = useState<SalaryBreakdown[]>([]);

  // Salary data loaded from backend
  const [userSalaryData, setUserSalaryData] = useState<UserSalaryData[]>([]);
  const [projectManagerSalaryData, setProjectManagerSalaryData] = useState<
    ProjectManagerSalaryData[]
  >([]);

  // Local state for adding a PM
  const [newPMName, setNewPMName] = useState("");
  const [newPMSalary, setNewPMSalary] = useState<number | string>("");
  const [draftPMs, setDraftPMs] = useState<
    { name: string; monthlySalary: number }[]
  >([]);

  const refreshPMs = async () => {
    try {
      const pmResp: any = await apiClient.getSalaryProjectManagers();
      const pms = (pmResp && pmResp.data) || pmResp || [];
      setProjectManagerSalaryData(
        pms.map((p: any) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          monthlySalary: p.monthlySalary,
          attendanceRate: p.attendanceRate || 0,
          lastActive: p.lastActive || null,
        })),
      );

      // Update tempConfig map for any new PMs
      setTempConfig((prev) => {
        const next = { ...prev };
        next.projectManagers = next.projectManagers || {};
        pms.forEach((p: any) => {
          if (!(p.id in next.projectManagers))
            next.projectManagers[p.id] = p.monthlySalary || 0;
        });
        return next;
      });
    } catch (err) {
      console.warn("Failed to refresh PMs", err);
    }
  };

  useEffect(() => {
    const loadSalaryData = async () => {
      try {
        const cfgResp: any = await apiClient.getSalaryConfig();
        if (cfgResp) {
          setSalaryConfig((prev) => ({ ...prev, ...(cfgResp as any) }));
          setTempConfig((t) => ({ ...t, ...(cfgResp as any) }));
        }

        const usersResp: any = await apiClient.getSalaryUsers();
        const users = (usersResp && usersResp.data) || usersResp || [];
        setUserSalaryData(
          users.map((u: any) => ({
            id: u.id,
            name: u.name,
            role: u.role,
            todayFiles: u.todayFiles || 0,
            weeklyFiles: u.weeklyFiles || 0,
            monthlyFiles: u.monthlyFiles || 0,
            todayEarnings: u.todayEarnings || 0,
            weeklyEarnings: u.weeklyEarnings || 0,
            monthlyEarnings: u.monthlyEarnings || 0,
            attendanceRate: u.attendanceRate || 0,
            lastActive: u.lastActive || null,
          })),
        );

        const pmResp: any = await apiClient.getSalaryProjectManagers();
        const pms = (pmResp && pmResp.data) || pmResp || [];
        setProjectManagerSalaryData(
          pms.map((p: any) => ({
            id: p.id,
            name: p.name,
            role: p.role,
            monthlySalary: p.monthlySalary,
            attendanceRate: p.attendanceRate || 0,
            lastActive: p.lastActive || null,
          })),
        );
      } catch (err) {
        console.warn("Failed to load salary data", err);
      }
    };

    loadSalaryData();
  }, []);

  // Calculate user daily earnings based on file count and tiered rates
  function calculateUserDailyEarnings(
    fileCount: number,
    config: SalaryConfig,
  ): number {
    const { firstTierRate, secondTierRate, firstTierLimit } = config.users;

    if (fileCount <= firstTierLimit) {
      // All files at first tier rate
      return fileCount * firstTierRate;
    } else {
      // First tier files at first rate + remaining files at second rate
      const firstTierEarnings = firstTierLimit * firstTierRate;
      const secondTierEarnings = (fileCount - firstTierLimit) * secondTierRate;
      return firstTierEarnings + secondTierEarnings;
    }
  }

  // Calculate user monthly earnings
  function calculateUserMonthlyEarnings(
    fileCount: number,
    config: SalaryConfig,
  ): number {
    return calculateUserDailyEarnings(fileCount, config);
  }

  // Generate salary breakdown for selected period
  const generateSalaryBreakdown = (
    user: UserSalaryData,
    period: BreakdownPeriod,
  ): SalaryBreakdown[] => {
    const { firstTierRate, secondTierRate, firstTierLimit } =
      salaryConfig.users;

    if (period === "daily") {
      const files = user.todayFiles;
      const tier1Files = Math.min(files, firstTierLimit);
      const tier2Files = Math.max(0, files - firstTierLimit);

      return [
        {
          period: "Today",
          files,
          tier1Files,
          tier1Rate: firstTierRate,
          tier1Amount: tier1Files * firstTierRate,
          tier2Files,
          tier2Rate: secondTierRate,
          tier2Amount: tier2Files * secondTierRate,
          totalAmount: tier1Files * firstTierRate + tier2Files * secondTierRate,
        },
      ];
    }

    if (period === "weekly") {
      // Generate last 7 days of data
      const weekData = [];
      const dailyAvg = Math.floor(user.weeklyFiles / 7);

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

        // Simulate varying daily counts
        const files =
          i === 0
            ? user.todayFiles
            : Math.floor(dailyAvg * (0.8 + Math.random() * 0.4));
        const tier1Files = Math.min(files, firstTierLimit);
        const tier2Files = Math.max(0, files - firstTierLimit);

        weekData.push({
          period: dayName,
          files,
          tier1Files,
          tier1Rate: firstTierRate,
          tier1Amount: tier1Files * firstTierRate,
          tier2Files,
          tier2Rate: secondTierRate,
          tier2Amount: tier2Files * secondTierRate,
          totalAmount: tier1Files * firstTierRate + tier2Files * secondTierRate,
        });
      }

      return weekData;
    }

    if (period === "monthly") {
      // Generate all dates in current month including absent days
      const monthData = [];
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Get first day of the month and last day of the month
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);

      // Calculate average daily files for realistic distribution
      const totalWorkingDays = Math.min(today.getDate(), lastDay.getDate());
      const dailyAvg = Math.floor(user.monthlyFiles / totalWorkingDays);

      // Create array to track which days are working days vs absent
      const workingDays = [];
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(currentYear, currentMonth, day);
        const dayOfWeek = currentDate.getDay();

        // Skip weekends (Saturday = 6, Sunday = 0) and simulate some absent days
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isAbsent = !isWeekend && Math.random() < 0.1; // 10% chance of absence on weekdays
        const isFutureDate = currentDate > today;

        workingDays.push({
          day,
          date: currentDate,
          isWorking: !isWeekend && !isAbsent && !isFutureDate,
          isWeekend,
          isAbsent,
          isFuture: isFutureDate,
        });
      }

      // Generate data for each day
      workingDays.forEach(
        ({ day, date, isWorking, isWeekend, isAbsent, isFuture }) => {
          let files = 0;
          let statusNote = "";

          if (isFuture) {
            files = 0;
            statusNote = " (Future)";
          } else if (isWeekend) {
            files = 0;
            statusNote = " (Weekend)";
          } else if (isAbsent) {
            files = 0;
            statusNote = " (Absent)";
          } else if (isWorking) {
            if (day === today.getDate()) {
              // Today's actual count
              files = user.todayFiles;
              statusNote = " (Today)";
            } else {
              // Simulate realistic past working day counts
              files = Math.floor(dailyAvg * (0.7 + Math.random() * 0.6));
            }
          }

          const tier1Files = Math.min(files, firstTierLimit);
          const tier2Files = Math.max(0, files - firstTierLimit);

          monthData.push({
            period: `${date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}${statusNote}`,
            files,
            tier1Files,
            tier1Rate: firstTierRate,
            tier1Amount: tier1Files * firstTierRate,
            tier2Files,
            tier2Rate: secondTierRate,
            tier2Amount: tier2Files * secondTierRate,
            totalAmount:
              tier1Files * firstTierRate + tier2Files * secondTierRate,
          });
        },
      );

      return monthData;
    }

    return [];
  };

  const loadBreakdown = async (userId: string, period: BreakdownPeriod) => {
    try {
      const resp: any = await apiClient.getSalaryUserBreakdown(userId, period);
      const data = (resp && resp.data) || resp || [];
      setBreakdownData(
        (data as any[]).map((d) => ({
          period: d.period,
          files: d.files,
          tier1Files: d.tier1Files,
          tier1Rate: d.tier1Rate,
          tier1Amount: d.tier1Amount,
          tier2Files: d.tier2Files,
          tier2Rate: d.tier2Rate,
          tier2Amount: d.tier2Amount,
          totalAmount: d.totalAmount,
        })),
      );
    } catch (e) {
      console.warn("Failed to load breakdown", e);
      setBreakdownData([]);
    }
  };

  const handleUserClick = (user: UserSalaryData) => {
    setSelectedUser(user);
    setBreakdownPeriod("daily");
    setIsBreakdownDialogOpen(true);
    loadBreakdown(user.id, "daily");
  };

  const getBreakdownData = () => {
    return breakdownData;
  };

  const getBreakdownTotal = () => {
    const data = getBreakdownData();
    return data.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  useEffect(() => {
    if (selectedUser) {
      loadBreakdown(selectedUser.id, breakdownPeriod);
    }
  }, [selectedUser?.id, breakdownPeriod]);

  // Calculate total salary statistics
  const totalUserSalaries = userSalaryData.reduce(
    (sum, user) => sum + user.monthlyEarnings,
    0,
  );
  const totalPMSalaries = projectManagerSalaryData.reduce(
    (sum, pm) => sum + pm.monthlySalary,
    0,
  );
  const totalMonthlySalaries = totalUserSalaries + totalPMSalaries;
  const avgUserEarnings = totalUserSalaries / userSalaryData.length;

  const handleConfigSave = async () => {
    try {
      if (draftPMs.length) {
        await Promise.all(
          draftPMs.map((pm) =>
            apiClient.createPMSalary({
              name: pm.name,
              monthlySalary: pm.monthlySalary,
            }),
          ),
        );
        setDraftPMs([]);
      }

      const resp: any = await apiClient.updateSalaryConfig(tempConfig);
      const data = (resp && resp.data) || resp || tempConfig;
      setSalaryConfig((prev) => ({ ...prev, ...data }) as SalaryConfig);
      setTempConfig((t) => ({ ...t, ...(data as any) }));
      await refreshPMs();
      setIsConfigDialogOpen(false);
    } catch (err) {
      console.error("Failed to save salary config", err);
      alert("Failed to save salary configuration");
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 95)
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rate >= 90)
      return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rate >= 85)
      return <Badge className="bg-orange-100 text-orange-800">Average</Badge>;
    if (rate <= 0)
      return <Badge className="bg-gray-100 text-gray-700">N/A</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <IndianRupee className="h-8 w-8 text-green-600" />
            Salary Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage salaries, configure rates, and track earnings for all
            employees.
          </p>
        </div>
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setTempConfig(salaryConfig)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Rates
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Salary Configuration</DialogTitle>
              <DialogDescription>
                Configure salary rates and limits for users and project
                managers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* User Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">User File-Based Salary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstTierRate">
                      First {tempConfig.users.firstTierLimit} Files Rate (₹)
                    </Label>
                    <Input
                      id="firstTierRate"
                      type="number"
                      step="0.01"
                      value={tempConfig.users.firstTierRate}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          users: {
                            ...tempConfig.users,
                            firstTierRate: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Per file rate for first tier
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondTierRate">
                      After {tempConfig.users.firstTierLimit} Files Rate (₹)
                    </Label>
                    <Input
                      id="secondTierRate"
                      type="number"
                      step="0.01"
                      value={tempConfig.users.secondTierRate}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          users: {
                            ...tempConfig.users,
                            secondTierRate: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Per file rate for second tier
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstTierLimit">
                    First Tier Limit (Files)
                  </Label>
                  <Input
                    id="firstTierLimit"
                    type="number"
                    value={tempConfig.users.firstTierLimit}
                    onChange={(e) =>
                      setTempConfig({
                        ...tempConfig,
                        users: {
                          ...tempConfig.users,
                          firstTierLimit: parseInt(e.target.value) || 500,
                        },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of files for first tier pricing
                  </p>
                </div>
              </div>

              {/* Project Manager Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">
                  Project Manager Individual Salaries
                </h4>
                {projectManagerSalaryData.map((pm) => (
                  <div
                    key={pm.id}
                    className="space-y-2 p-3 border border-gray-200 rounded-lg"
                  >
                    <Label htmlFor={`salary-${pm.id}`}>
                      {pm.name} - Monthly Salary (₹)
                    </Label>
                    <Input
                      id={`salary-${pm.id}`}
                      type="number"
                      value={tempConfig.projectManagers[pm.id] || 0}
                      onChange={(e) =>
                        setTempConfig({
                          ...tempConfig,
                          projectManagers: {
                            ...tempConfig.projectManagers,
                            [pm.id]: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Current: {formatCurrency(pm.monthlySalary)} | Role:{" "}
                      {pm.role.replace("_", " ")}
                    </p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Configure individual monthly salaries for each project
                  manager. Changes allow for increments/decrements.
                </p>

                <div className="mt-3 p-3 border rounded-lg">
                  <h5 className="font-medium">Add Project Manager</h5>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Input
                      placeholder="Full name"
                      value={newPMName}
                      onChange={(e) => setNewPMName(e.target.value)}
                    />
                    <Input
                      placeholder="Monthly salary"
                      type="number"
                      value={newPMSalary as any}
                      onChange={(e) => setNewPMSalary(e.target.value)}
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!newPMName || !newPMSalary) {
                          alert("Please provide name and salary");
                          return;
                        }
                        const salaryNum = Number(newPMSalary);
                        if (!Number.isFinite(salaryNum) || salaryNum <= 0) {
                          alert("Enter a valid monthly salary");
                          return;
                        }
                        setDraftPMs((prev) => [
                          ...prev,
                          { name: newPMName.trim(), monthlySalary: salaryNum },
                        ]);
                        setNewPMName("");
                        setNewPMSalary("");
                      }}
                    >
                      Add PM
                    </Button>
                  </div>
                  {draftPMs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <h6 className="font-medium">
                        New Project Managers (to be saved)
                      </h6>
                      {draftPMs.map((pm, idx) => (
                        <div
                          key={`${pm.name}-${idx}`}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div>
                            <div className="font-medium">{pm.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Monthly Salary: {formatCurrency(pm.monthlySalary)}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setDraftPMs((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsConfigDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleConfigSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Monthly Salaries
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalMonthlySalaries)}
            </div>
            <p className="text-xs text-muted-foreground">
              All employees combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Salaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalUserSalaries)}
            </div>
            <p className="text-xs text-muted-foreground">File-based earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              PM Individual Salaries ({projectManagerSalaryData.length})
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalPMSalaries)}
            </div>
            <p className="text-xs text-muted-foreground">
              Individual monthly amounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg User Earnings
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(avgUserEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">Per user average</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Current Salary Configuration
          </CardTitle>
          <CardDescription>
            Active rates and settings for salary calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">User File-Based Rates</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>First {salaryConfig.users.firstTierLimit} files:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(salaryConfig.users.firstTierRate)} per file
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>After {salaryConfig.users.firstTierLimit} files:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(salaryConfig.users.secondTierRate)} per file
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">
                Project Manager Individual Salaries
              </h4>
              <div className="space-y-2 text-sm">
                {projectManagerSalaryData.map((pm) => (
                  <div key={pm.id} className="flex justify-between">
                    <span>{pm.name}:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(pm.monthlySalary)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Tables */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            User Salaries ({userSalaryData.length})
          </TabsTrigger>
          <TabsTrigger value="managers">
            Project Managers ({projectManagerSalaryData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                User File-Based Salaries
              </CardTitle>
              <CardDescription>
                Real-time and monthly earnings based on file processing. Click
                on any user name to view detailed breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>
                      Today's Files{" "}
                      <span className="text-xs text-muted-foreground">
                        (Resets Daily)
                      </span>
                    </TableHead>
                    <TableHead>Today's Earnings</TableHead>
                    <TableHead>Weekly Files</TableHead>
                    <TableHead>Monthly Files</TableHead>
                    <TableHead>Monthly Earnings</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userSalaryData.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div
                          className="cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors"
                          onClick={() => handleUserClick(user)}
                        >
                          <div className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            {user.name}
                            <Eye className="h-3 w-3" />
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {user.role}
                          </div>
                          <div className="text-xs text-blue-500">
                            Click for breakdown
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {user.todayFiles.toLocaleString()}
                        </div>
                        {user.todayFiles >
                          salaryConfig.users.firstTierLimit && (
                          <div className="text-xs text-green-600">
                            Tier 2 rate applied
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-green-600">
                          {formatCurrency(user.todayEarnings)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-blue-600">
                          {user.weeklyFiles.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          This week
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {user.monthlyFiles.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-blue-600">
                          {formatCurrency(user.monthlyEarnings)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPerformanceBadge(user.attendanceRate)}
                          <div className="text-xs text-muted-foreground">
                            {user.attendanceRate}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.lastActive
                            ? new Date(user.lastActive).toLocaleString()
                            : "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="managers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Manager Individual Salaries
              </CardTitle>
              <CardDescription>
                Individual monthly salary amounts for each project manager
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Monthly Salary</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectManagerSalaryData.map((pm) => (
                    <TableRow key={pm.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{pm.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {pm.role.replace("_", " ")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-purple-600">
                          {formatCurrency(pm.monthlySalary)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Monthly fixed amount
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPerformanceBadge(pm.attendanceRate)}
                          <div className="text-xs text-muted-foreground">
                            {pm.attendanceRate}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {pm.lastActive
                            ? new Date(pm.lastActive).toLocaleString()
                            : "-"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Salary Breakdown Dialog */}
      <Dialog
        open={isBreakdownDialogOpen}
        onOpenChange={setIsBreakdownDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Salary Breakdown - {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed file count and earnings calculation breakdown. Monthly
              view shows all dates including absent days.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Period Selection */}
              <div className="flex items-center gap-4">
                <Label>View Period:</Label>
                <Select
                  value={breakdownPeriod}
                  onValueChange={(value) =>
                    setBreakdownPeriod(value as BreakdownPeriod)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (Today)</SelectItem>
                    <SelectItem value="weekly">Weekly (Last 7 Days)</SelectItem>
                    <SelectItem value="monthly">
                      Monthly (All Dates + Absent Days)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Current Configuration Display */}
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">
                    Current Rate Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        First {salaryConfig.users.firstTierLimit} files:
                      </span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(salaryConfig.users.firstTierRate)} per
                        file
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        After {salaryConfig.users.firstTierLimit} files:
                      </span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(salaryConfig.users.secondTierRate)} per
                        file
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Period</TableHead>
                      <TableHead className="font-semibold">
                        Total Files
                      </TableHead>
                      <TableHead className="font-semibold">
                        Tier 1 Files
                      </TableHead>
                      <TableHead className="font-semibold">
                        Tier 1 Amount
                      </TableHead>
                      <TableHead className="font-semibold">
                        Tier 2 Files
                      </TableHead>
                      <TableHead className="font-semibold">
                        Tier 2 Amount
                      </TableHead>
                      <TableHead className="font-semibold">
                        Total Earnings
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getBreakdownData().map((item, index) => {
                      const isAbsentDay =
                        item.files === 0 && item.period.includes("(Absent)");
                      const isWeekend = item.period.includes("(Weekend)");
                      const isFuture = item.period.includes("(Future)");
                      const isToday = item.period.includes("(Today)");

                      return (
                        <TableRow
                          key={index}
                          className={`hover:bg-gray-50 ${
                            isAbsentDay
                              ? "bg-red-50"
                              : isWeekend
                                ? "bg-gray-100"
                                : isFuture
                                  ? "bg-blue-50"
                                  : isToday
                                    ? "bg-green-50"
                                    : ""
                          }`}
                        >
                          <TableCell
                            className={`font-medium ${
                              isAbsentDay
                                ? "text-red-600"
                                : isWeekend
                                  ? "text-gray-500"
                                  : isFuture
                                    ? "text-blue-500"
                                    : isToday
                                      ? "text-green-600"
                                      : ""
                            }`}
                          >
                            {item.period}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${
                                item.files === 0
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {item.files.toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {item.tier1Files.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                @ {formatCurrency(item.tier1Rate)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              {formatCurrency(item.tier1Amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {item.tier2Files.toLocaleString()}
                              </div>
                              {item.tier2Files > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  @ {formatCurrency(item.tier2Rate)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              {formatCurrency(item.tier2Amount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-blue-600">
                              {formatCurrency(item.totalAmount)}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Total Row */}
                    <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                      <TableCell className="font-bold">TOTAL</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-600 text-white">
                          {getBreakdownData()
                            .reduce((sum, item) => sum + item.files, 0)
                            .toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">
                          {getBreakdownData()
                            .reduce((sum, item) => sum + item.tier1Files, 0)
                            .toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-green-600">
                          {formatCurrency(
                            getBreakdownData().reduce(
                              (sum, item) => sum + item.tier1Amount,
                              0,
                            ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">
                          {getBreakdownData()
                            .reduce((sum, item) => sum + item.tier2Files, 0)
                            .toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-green-600">
                          {formatCurrency(
                            getBreakdownData().reduce(
                              (sum, item) => sum + item.tier2Amount,
                              0,
                            ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-lg text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {formatCurrency(getBreakdownTotal())}
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {getBreakdownData()
                        .reduce((sum, item) => sum + item.tier1Files, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700">Tier 1 Files</div>
                    <div className="text-xs text-muted-foreground">
                      @ {formatCurrency(salaryConfig.users.firstTierRate)}/file
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {getBreakdownData()
                        .reduce((sum, item) => sum + item.tier2Files, 0)
                        .toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">Tier 2 Files</div>
                    <div className="text-xs text-muted-foreground">
                      @ {formatCurrency(salaryConfig.users.secondTierRate)}/file
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {formatCurrency(getBreakdownTotal())}
                    </div>
                    <div className="text-sm text-purple-700">
                      Total Earnings
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {breakdownPeriod === "daily"
                        ? "Today"
                        : breakdownPeriod === "weekly"
                          ? "This Week"
                          : "This Month"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Color Legend for Monthly View */}
              {breakdownPeriod === "monthly" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-3">
                    Monthly View Color Legend
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                      <span className="text-green-700">Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                      <span className="text-red-700">Absent Days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                      <span className="text-gray-700">Weekends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                      <span className="text-blue-700">Future Dates</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Note */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">
                      Daily Reset Information
                    </p>
                    <p className="text-yellow-700 mt-1">
                      Daily file counts and earnings reset at midnight. The
                      daily view shows today's current progress, while weekly
                      and monthly views show accumulated totals.
                      {breakdownPeriod === "monthly" && (
                        <span className="block mt-2">
                          <strong>Monthly View:</strong> Shows all calendar
                          dates including weekends, absent days, and future
                          dates with color coding above.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
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
    </div>
  );
}
