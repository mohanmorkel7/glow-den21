import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  Activity
} from 'lucide-react';

interface ProjectBilling {
  projectId: string;
  projectName: string;
  month: string;
  filesCompleted: number;
  ratePerFile: number;
  amountUSD: number;
  amountINR: number;
  conversionRate: number;
  status: 'draft' | 'finalized' | 'paid';
  createdAt: string;
  finalizedAt?: string;
  paidAt?: string;
  type: 'project';
}

interface FileProcessingJobBilling {
  jobId: string;
  jobName: string;
  jobType: 'mo_monthly' | 'mo_weekly';
  month: string;
  filesCompleted: number;
  totalFiles: number;
  ratePerFile: number;
  amountUSD: number;
  amountINR: number;
  conversionRate: number;
  status: 'draft' | 'finalized' | 'paid';
  assignmentType: 'automation' | 'manual';
  createdAt: string;
  finalizedAt?: string;
  paidAt?: string;
  type: 'job';
}

type BillingItem = ProjectBilling | FileProcessingJobBilling;

interface MonthlyBillingSummary {
  month: string;
  totalFilesCompleted: number;
  totalAmountUSD: number;
  totalAmountINR: number;
  conversionRate: number;
  itemsCount: number;
  projects: ProjectBilling[];
  jobs: FileProcessingJobBilling[];
  allItems: BillingItem[];
}

const mockJobBillingData: FileProcessingJobBilling[] = [
  {
    jobId: 'job1',
    jobName: 'MO Monthly Batch #2024-001',
    jobType: 'mo_monthly',
    month: '2024-01',
    filesCompleted: 187500,
    totalFiles: 300000,
    ratePerFile: 0.008,
    amountUSD: 1500.00,
    amountINR: 124500.00,
    conversionRate: 83.00,
    status: 'finalized',
    assignmentType: 'manual',
    createdAt: '2024-01-31T18:00:00Z',
    finalizedAt: '2024-02-01T10:00:00Z',
    type: 'job'
  },
  {
    jobId: 'job2',
    jobName: 'MO Weekly Batch #2024-W03',
    jobType: 'mo_weekly',
    month: '2024-01',
    filesCompleted: 75000,
    totalFiles: 75000,
    ratePerFile: 0.008,
    amountUSD: 600.00,
    amountINR: 49800.00,
    conversionRate: 83.00,
    status: 'paid',
    assignmentType: 'automation',
    createdAt: '2024-01-21T18:00:00Z',
    finalizedAt: '2024-01-22T10:00:00Z',
    paidAt: '2024-01-25T14:30:00Z',
    type: 'job'
  },
  {
    jobId: 'job3',
    jobName: 'MO Monthly Batch #2024-002',
    jobType: 'mo_monthly',
    month: '2024-02',
    filesCompleted: 125000,
    totalFiles: 250000,
    ratePerFile: 0.008,
    amountUSD: 1000.00,
    amountINR: 83000.00,
    conversionRate: 83.00,
    status: 'draft',
    assignmentType: 'manual',
    createdAt: '2024-02-15T18:00:00Z',
    type: 'job'
  }
];

const mockBillingData: MonthlyBillingSummary[] = [
  {
    month: '2024-01',
    totalFilesCompleted: 1126000, // 863500 (projects) + 262500 (jobs)
    totalAmountUSD: 62945.00, // 60845.00 (projects) + 2100.00 (jobs)
    totalAmountINR: 5224435.00,
    conversionRate: 83.00,
    itemsCount: 5, // 3 projects + 2 jobs
    projects: [
      {
        projectId: '1',
        projectName: 'MO Project - Data Processing',
        month: '2024-01',
        filesCompleted: 580000,
        ratePerFile: 0.05,
        amountUSD: 29000.00,
        amountINR: 2407000.00,
        conversionRate: 83.00,
        status: 'paid',
        createdAt: '2024-01-31T18:00:00Z',
        finalizedAt: '2024-02-01T10:00:00Z',
        paidAt: '2024-02-03T14:30:00Z',
        type: 'project'
      },
      {
        projectId: '2',
        projectName: 'Customer Support Processing',
        month: '2024-01',
        filesCompleted: 133500,
        ratePerFile: 0.08,
        amountUSD: 10680.00,
        amountINR: 886440.00,
        conversionRate: 83.00,
        status: 'paid',
        createdAt: '2024-01-31T18:00:00Z',
        finalizedAt: '2024-02-01T10:00:00Z',
        paidAt: '2024-02-03T14:30:00Z',
        type: 'project'
      },
      {
        projectId: '3',
        projectName: 'Invoice Processing',
        month: '2024-01',
        filesCompleted: 150000,
        ratePerFile: 0.12,
        amountUSD: 18000.00,
        amountINR: 1494000.00,
        conversionRate: 83.00,
        status: 'paid',
        createdAt: '2024-01-31T18:00:00Z',
        finalizedAt: '2024-02-01T10:00:00Z',
        paidAt: '2024-02-03T14:30:00Z',
        type: 'project'
      }
    ],
    jobs: [],
    allItems: []
  },
  {
    month: '2024-02',
    totalFilesCompleted: 581200, // 456200 (projects) + 125000 (jobs)
    totalAmountUSD: 33196.00, // 32196.00 (projects) + 1000.00 (jobs)
    totalAmountINR: 2755268.00,
    conversionRate: 83.00,
    itemsCount: 3, // 2 projects + 1 job
    projects: [
      {
        projectId: '1',
        projectName: 'MO Project - Data Processing',
        month: '2024-02',
        filesCompleted: 387500,
        ratePerFile: 0.05,
        amountUSD: 19375.00,
        amountINR: 1608125.00,
        conversionRate: 83.00,
        status: 'finalized',
        createdAt: '2024-02-29T18:00:00Z',
        finalizedAt: '2024-03-01T10:00:00Z',
        type: 'project'
      },
      {
        projectId: '2',
        projectName: 'Customer Support Processing',
        month: '2024-02',
        filesCompleted: 68700,
        ratePerFile: 0.08,
        amountUSD: 5496.00,
        amountINR: 456168.00,
        conversionRate: 83.00,
        status: 'finalized',
        createdAt: '2024-02-29T18:00:00Z',
        finalizedAt: '2024-03-01T10:00:00Z',
        type: 'project'
      }
    ],
    jobs: [],
    allItems: []
  },
  {
    month: '2024-03',
    totalFilesCompleted: 187500,
    totalAmountUSD: 9375.00,
    totalAmountINR: 778125.00,
    conversionRate: 83.00,
    itemsCount: 1,
    projects: [
      {
        projectId: '1',
        projectName: 'MO Project - Data Processing',
        month: '2024-03',
        filesCompleted: 187500,
        ratePerFile: 0.05,
        amountUSD: 9375.00,
        amountINR: 778125.00,
        conversionRate: 83.00,
        status: 'draft',
        createdAt: '2024-03-15T20:00:00Z',
        type: 'project'
      }
    ],
    jobs: [],
    allItems: []
  }
];

// Compute combined billing data
const computeBillingData = (): MonthlyBillingSummary[] => {
  return mockBillingData.map(billing => {
    const jobs = mockJobBillingData.filter(job => job.month === billing.month);
    const allItems: BillingItem[] = [...billing.projects, ...jobs];

    // Recalculate totals including jobs
    const jobFilesTotal = jobs.reduce((sum, job) => sum + job.filesCompleted, 0);
    const jobAmountUSD = jobs.reduce((sum, job) => sum + job.amountUSD, 0);
    const jobAmountINR = jobs.reduce((sum, job) => sum + job.amountINR, 0);

    const projectFilesTotal = billing.projects.reduce((sum, project) => sum + project.filesCompleted, 0);
    const projectAmountUSD = billing.projects.reduce((sum, project) => sum + project.amountUSD, 0);

    return {
      ...billing,
      totalFilesCompleted: projectFilesTotal + jobFilesTotal,
      totalAmountUSD: projectAmountUSD + jobAmountUSD,
      totalAmountINR: (projectAmountUSD + jobAmountUSD) * billing.conversionRate,
      itemsCount: billing.projects.length + jobs.length,
      jobs,
      allItems
    };
  });
};

export default function Billing() {
  const { user: currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [billingData] = useState<MonthlyBillingSummary[]>(computeBillingData());
  const [selectedBilling, setSelectedBilling] = useState<MonthlyBillingSummary | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Only allow super admin to access billing
  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-600">Access Denied</h3>
          <p className="text-sm text-muted-foreground">This page is only accessible to administrators.</p>
        </div>
      </div>
    );
  }

  const canManageBilling = currentUser?.role === 'super_admin';

  // Filter billing data
  const filteredBillingData = billingData.filter(billing => {
    const matchesMonth = selectedMonth === 'all' || billing.month === selectedMonth;
    const matchesSearch = billing.projects.some(project => 
      project.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (selectedStatus !== 'all') {
      const hasMatchingStatus = billing.projects.some(project => project.status === selectedStatus);
      return matchesMonth && matchesSearch && hasMatchingStatus;
    }
    
    return matchesMonth && matchesSearch;
  });

  // Get all projects from billing data for filtering
  const allProjects = billingData.flatMap(billing => billing.projects);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'finalized': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-3 w-3" />;
      case 'finalized': return <Clock className="h-3 w-3" />;
      case 'paid': return <CheckCircle className="h-3 w-3" />;
      default: return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const calculateTotalStats = () => {
    const totalFiles = billingData.reduce((sum, billing) => sum + billing.totalFilesCompleted, 0);
    const totalUSD = billingData.reduce((sum, billing) => sum + billing.totalAmountUSD, 0);
    const totalINR = billingData.reduce((sum, billing) => sum + billing.totalAmountINR, 0);
    const pendingUSD = billingData
      .flatMap(billing => billing.projects)
      .filter(project => project.status !== 'paid')
      .reduce((sum, project) => sum + project.amountUSD, 0);
    const paidUSD = billingData
      .flatMap(billing => billing.projects)
      .filter(project => project.status === 'paid')
      .reduce((sum, project) => sum + project.amountUSD, 0);

    return { totalFiles, totalUSD, totalINR, pendingUSD, paidUSD };
  };

  const stats = calculateTotalStats();

  const handleViewDetails = (billing: MonthlyBillingSummary) => {
    setSelectedBilling(billing);
    setIsDetailsDialogOpen(true);
  };

  const handleExportBilling = (format: 'csv' | 'excel' | 'pdf', month?: string) => {
    // Implementation for export functionality
    console.log(`Exporting ${format} for ${month || 'all months'}`);
  };

  const formatCurrency = (amount: number, currency: 'USD' | 'INR') => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing Management</h1>
          <p className="text-muted-foreground mt-1">
            Monthly billing reports with USD and INR calculations for all projects.
          </p>
        </div>
        {canManageBilling && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExportBilling('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handleExportBilling('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => handleExportBilling('pdf')}>
              <Receipt className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFiles.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings (USD)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalUSD, 'USD')}</div>
            <p className="text-xs text-muted-foreground">Gross earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings (INR)</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalINR, 'INR')}</div>
            <p className="text-xs text-muted-foreground">₹83 per USD</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.paidUSD, 'USD')}</div>
            <p className="text-xs text-muted-foreground">Received payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingUSD, 'USD')}</div>
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
                    {new Date(billing.month + '-01').toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
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
                const statusCounts = billing.allItems.reduce((acc, item) => {
                  acc[item.status] = (acc[item.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);

                return (
                  <TableRow key={billing.month}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {new Date(billing.month + '-01').toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long' 
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Rate: ₹{billing.conversionRate}/USD
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{billing.itemsCount} items</div>
                        <div className="text-muted-foreground space-y-1">
                          <div>{billing.projects.length} projects, {billing.jobs.length} file processing jobs</div>
                          <div className="text-xs">
                            {billing.allItems.slice(0, 2).map(item =>
                              item.type === 'project' ? item.projectName : item.jobName
                            ).join(', ')}
                            {billing.allItems.length > 2 && ` +${billing.allItems.length - 2} more`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{billing.totalFilesCompleted.toLocaleString()}</div>
                        <div className="text-muted-foreground">files processed</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          {formatCurrency(billing.totalAmountUSD, 'USD')}
                        </div>
                        <div className="text-muted-foreground">
                          Avg: ${(billing.totalAmountUSD / billing.totalFilesCompleted).toFixed(4)}/file
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-blue-600">
                          {formatCurrency(billing.totalAmountINR, 'INR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(statusCounts).map(([status, count]) => (
                          <Badge key={status} className={getStatusBadgeColor(status)} variant="outline">
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
                          onClick={() => handleExportBilling('pdf', billing.month)}
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
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Billing Details - {selectedBilling && new Date(selectedBilling.month + '-01').toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of projects, file processing jobs, and earnings for the selected month.
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
                      <CardTitle className="text-sm">Total Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedBilling.totalFilesCompleted.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedBilling.itemsCount}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedBilling.projects.length} projects, {selectedBilling.jobs.length} jobs
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Amount (USD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(selectedBilling.totalAmountUSD, 'USD')}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Amount (INR)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold text-blue-600">
                        {formatCurrency(selectedBilling.totalAmountINR, 'INR')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Rate: ₹{selectedBilling.conversionRate}/USD
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-6">
                  {/* General Projects */}
                  {selectedBilling.projects.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">General Projects</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Files</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>USD</TableHead>
                            <TableHead>INR</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBilling.projects.map((project) => (
                            <TableRow key={project.projectId}>
                              <TableCell>
                                <div className="font-medium">{project.projectName}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{project.filesCompleted.toLocaleString()}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">${project.ratePerFile}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium text-green-600">
                                  {formatCurrency(project.amountUSD, 'USD')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm font-medium text-blue-600">
                                  {formatCurrency(project.amountINR, 'INR')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusBadgeColor(project.status)}>
                                  {getStatusIcon(project.status)}
                                  <span className="ml-1">{project.status.toUpperCase()}</span>
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* File Processing Jobs */}
                  {selectedBilling.jobs.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        File Processing Jobs
                        <Badge variant="outline" className="text-xs">
                          MO Projects - $0.008/file
                        </Badge>
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Job</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Files</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>USD</TableHead>
                            <TableHead>INR</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBilling.jobs.map((job) => {
                            const progress = job.totalFiles > 0 ? (job.filesCompleted / job.totalFiles) * 100 : 0;
                            return (
                              <TableRow key={job.jobId}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{job.jobName}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      {job.assignmentType === 'automation' ? (
                                        <>
                                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                          Automated
                                        </>
                                      ) : (
                                        <>
                                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                          Manual
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {job.jobType === 'mo_monthly' ? 'MO Monthly' : 'MO Weekly'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{job.filesCompleted.toLocaleString()}</div>
                                  <div className="text-xs text-muted-foreground">
                                    of {job.totalFiles.toLocaleString()}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="text-xs text-muted-foreground">
                                      {progress.toFixed(1)}%
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className="bg-blue-600 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-green-600">
                                    {formatCurrency(job.amountUSD, 'USD')}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium text-blue-600">
                                    {formatCurrency(job.amountINR, 'INR')}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusBadgeColor(job.status)}>
                                    {getStatusIcon(job.status)}
                                    <span className="ml-1">{job.status.toUpperCase()}</span>
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedBilling && (
              <Button onClick={() => handleExportBilling('pdf', selectedBilling.month)}>
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
