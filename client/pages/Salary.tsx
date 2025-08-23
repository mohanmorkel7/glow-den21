import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronDown
} from 'lucide-react';

interface SalaryConfig {
  users: {
    firstTierRate: number;  // Rate for first 500 files (in paisa)
    secondTierRate: number; // Rate after 500 files (in paisa)
    firstTierLimit: number; // Number of files for first tier (500)
  };
  projectManagers: {
    fixedSalary: number; // Fixed monthly salary in INR
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

type BreakdownPeriod = 'daily' | 'weekly' | 'monthly';

interface ProjectManagerSalaryData {
  id: string;
  name: string;
  role: string;
  fixedSalary: number;
  attendanceRate: number;
  lastActive: string;
}

export default function Salary() {
  const { user: currentUser } = useAuth();

  // Only allow super_admin to access this page
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
          <p className="text-sm text-muted-foreground">This page is only accessible to super administrators.</p>
        </div>
      </div>
    );
  }

  // Configuration state
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>({
    users: {
      firstTierRate: 0.50,    // 0.50 paisa per file for first 500
      secondTierRate: 0.60,   // 0.60 paisa per file after 500
      firstTierLimit: 500     // First 500 files
    },
    projectManagers: {
      fixedSalary: 35000      // ₹35,000 fixed monthly salary
    }
  });

  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<SalaryConfig>(salaryConfig);
  const [isBreakdownDialogOpen, setIsBreakdownDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSalaryData | null>(null);
  const [breakdownPeriod, setBreakdownPeriod] = useState<BreakdownPeriod>('daily');

  // Mock user salary data
  const userSalaryData: UserSalaryData[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'user',
      todayFiles: 750,        // Over 500, so gets mixed rate
      monthlyFiles: 15200,    
      todayEarnings: calculateUserDailyEarnings(750, salaryConfig),
      monthlyEarnings: calculateUserMonthlyEarnings(15200, salaryConfig),
      attendanceRate: 95.2,
      lastActive: '2024-01-21T14:30:00Z'
    },
    {
      id: '2',
      name: 'Mike Davis',
      role: 'user',
      todayFiles: 420,        // Under 500, gets first tier rate only
      monthlyFiles: 9800,
      todayEarnings: calculateUserDailyEarnings(420, salaryConfig),
      monthlyEarnings: calculateUserMonthlyEarnings(9800, salaryConfig),
      attendanceRate: 98.1,
      lastActive: '2024-01-21T15:15:00Z'
    },
    {
      id: '3',
      name: 'David Chen',
      role: 'user',
      todayFiles: 680,
      monthlyFiles: 14500,
      todayEarnings: calculateUserDailyEarnings(680, salaryConfig),
      monthlyEarnings: calculateUserMonthlyEarnings(14500, salaryConfig),
      attendanceRate: 92.8,
      lastActive: '2024-01-21T13:45:00Z'
    },
    {
      id: '4',
      name: 'Lisa Chen',
      role: 'user',
      todayFiles: 850,
      monthlyFiles: 18600,
      todayEarnings: calculateUserDailyEarnings(850, salaryConfig),
      monthlyEarnings: calculateUserMonthlyEarnings(18600, salaryConfig),
      attendanceRate: 96.7,
      lastActive: '2024-01-21T16:00:00Z'
    }
  ];

  // Mock project manager salary data
  const projectManagerSalaryData: ProjectManagerSalaryData[] = [
    {
      id: '1',
      name: 'Emily Wilson',
      role: 'project_manager',
      fixedSalary: salaryConfig.projectManagers.fixedSalary,
      attendanceRate: 98.5,
      lastActive: '2024-01-21T17:30:00Z'
    },
    {
      id: '2',
      name: 'John Smith',
      role: 'project_manager',
      fixedSalary: salaryConfig.projectManagers.fixedSalary,
      attendanceRate: 94.2,
      lastActive: '2024-01-21T16:45:00Z'
    }
  ];

  // Calculate user daily earnings based on file count and tiered rates
  function calculateUserDailyEarnings(fileCount: number, config: SalaryConfig): number {
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
  function calculateUserMonthlyEarnings(fileCount: number, config: SalaryConfig): number {
    return calculateUserDailyEarnings(fileCount, config);
  }

  // Calculate total salary statistics
  const totalUserSalaries = userSalaryData.reduce((sum, user) => sum + user.monthlyEarnings, 0);
  const totalPMSalaries = projectManagerSalaryData.reduce((sum, pm) => sum + pm.fixedSalary, 0);
  const totalMonthlySalaries = totalUserSalaries + totalPMSalaries;
  const avgUserEarnings = totalUserSalaries / userSalaryData.length;

  const handleConfigSave = () => {
    setSalaryConfig(tempConfig);
    setIsConfigDialogOpen(false);
    // Here you would typically save to backend
    console.log('Salary configuration updated:', tempConfig);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 95) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (rate >= 90) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rate >= 85) return <Badge className="bg-orange-100 text-orange-800">Average</Badge>;
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
            Manage salaries, configure rates, and track earnings for all employees.
          </p>
        </div>
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setTempConfig(salaryConfig)}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Rates
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Salary Configuration</DialogTitle>
              <DialogDescription>
                Configure salary rates and limits for users and project managers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* User Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">User File-Based Salary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstTierRate">First {tempConfig.users.firstTierLimit} Files Rate (₹)</Label>
                    <Input
                      id="firstTierRate"
                      type="number"
                      step="0.01"
                      value={tempConfig.users.firstTierRate}
                      onChange={(e) => setTempConfig({
                        ...tempConfig,
                        users: { ...tempConfig.users, firstTierRate: parseFloat(e.target.value) || 0 }
                      })}
                    />
                    <p className="text-xs text-muted-foreground">Per file rate for first tier</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondTierRate">After {tempConfig.users.firstTierLimit} Files Rate (₹)</Label>
                    <Input
                      id="secondTierRate"
                      type="number"
                      step="0.01"
                      value={tempConfig.users.secondTierRate}
                      onChange={(e) => setTempConfig({
                        ...tempConfig,
                        users: { ...tempConfig.users, secondTierRate: parseFloat(e.target.value) || 0 }
                      })}
                    />
                    <p className="text-xs text-muted-foreground">Per file rate for second tier</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstTierLimit">First Tier Limit (Files)</Label>
                  <Input
                    id="firstTierLimit"
                    type="number"
                    value={tempConfig.users.firstTierLimit}
                    onChange={(e) => setTempConfig({
                      ...tempConfig,
                      users: { ...tempConfig.users, firstTierLimit: parseInt(e.target.value) || 500 }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Number of files for first tier pricing</p>
                </div>
              </div>

              {/* Project Manager Configuration */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">Project Manager Fixed Salary</h4>
                <div className="space-y-2">
                  <Label htmlFor="fixedSalary">Monthly Fixed Salary (₹)</Label>
                  <Input
                    id="fixedSalary"
                    type="number"
                    value={tempConfig.projectManagers.fixedSalary}
                    onChange={(e) => setTempConfig({
                      ...tempConfig,
                      projectManagers: { ...tempConfig.projectManagers, fixedSalary: parseInt(e.target.value) || 0 }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">Fixed monthly salary for all project managers</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
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
            <CardTitle className="text-sm font-medium">Total Monthly Salaries</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlySalaries)}</div>
            <p className="text-xs text-muted-foreground">All employees combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Salaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalUserSalaries)}</div>
            <p className="text-xs text-muted-foreground">File-based earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PM Fixed Salaries</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalPMSalaries)}</div>
            <p className="text-xs text-muted-foreground">Fixed monthly amounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg User Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(avgUserEarnings)}</div>
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
                  <span className="font-medium text-green-600">{formatCurrency(salaryConfig.users.firstTierRate)} per file</span>
                </div>
                <div className="flex justify-between">
                  <span>After {salaryConfig.users.firstTierLimit} files:</span>
                  <span className="font-medium text-green-600">{formatCurrency(salaryConfig.users.secondTierRate)} per file</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Project Manager Salary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fixed Monthly Salary:</span>
                  <span className="font-medium text-purple-600">{formatCurrency(salaryConfig.projectManagers.fixedSalary)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Tables */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Salaries ({userSalaryData.length})</TabsTrigger>
          <TabsTrigger value="managers">Project Managers ({projectManagerSalaryData.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                User File-Based Salaries
              </CardTitle>
              <CardDescription>
                Real-time and monthly earnings based on file processing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Today's Files</TableHead>
                    <TableHead>Today's Earnings</TableHead>
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
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground capitalize">{user.role}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{user.todayFiles.toLocaleString()}</div>
                        {user.todayFiles > salaryConfig.users.firstTierLimit && (
                          <div className="text-xs text-green-600">
                            Tier 2 rate applied
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-green-600">{formatCurrency(user.todayEarnings)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{user.monthlyFiles.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-blue-600">{formatCurrency(user.monthlyEarnings)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPerformanceBadge(user.attendanceRate)}
                          <div className="text-xs text-muted-foreground">{user.attendanceRate}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(user.lastActive).toLocaleString()}</div>
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
                Project Manager Fixed Salaries
              </CardTitle>
              <CardDescription>
                Monthly fixed salary amounts for project managers
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
                          <div className="text-sm text-muted-foreground capitalize">{pm.role.replace('_', ' ')}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-purple-600">{formatCurrency(pm.fixedSalary)}</div>
                        <div className="text-xs text-muted-foreground">Fixed amount</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getPerformanceBadge(pm.attendanceRate)}
                          <div className="text-xs text-muted-foreground">{pm.attendanceRate}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{new Date(pm.lastActive).toLocaleString()}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
