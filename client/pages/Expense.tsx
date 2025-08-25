import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Calculator,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Building,
  CreditCard,
  PieChart,
  BarChart3,
  Download,
  Eye,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
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
  ComposedChart
} from 'recharts';

interface SalaryEntry {
  id: string;
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  month: string;
  paymentDate: string;
  status: 'pending' | 'paid' | 'processing';
}

interface ExpenseEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  month: string;
  type: 'administrative' | 'operational' | 'marketing' | 'utilities' | 'miscellaneous';
  receipt?: string;
  approvedBy: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface ProfitLossData {
  month: string;
  revenue: number;
  salaryExpense: number;
  adminExpense: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
}

export default function Expense() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const salaryEntries: SalaryEntry[] = [
    {
      id: '1',
      employeeName: 'John Smith',
      employeeId: 'EMP001',
      designation: 'Project Manager',
      department: 'Operations',
      baseSalary: 65000,
      bonus: 5000,
      deductions: 8000,
      netSalary: 62000,
      month: currentMonth,
      paymentDate: '2024-01-30',
      status: 'paid'
    },
    {
      id: '2',
      employeeName: 'Sarah Johnson',
      employeeId: 'EMP002',
      designation: 'Data Analyst',
      department: 'Operations',
      baseSalary: 45000,
      bonus: 2000,
      deductions: 5500,
      netSalary: 41500,
      month: currentMonth,
      paymentDate: '2024-01-30',
      status: 'paid'
    },
    {
      id: '3',
      employeeName: 'Mike Davis',
      employeeId: 'EMP003',
      designation: 'Data Entry Specialist',
      department: 'Operations',
      baseSalary: 35000,
      bonus: 1500,
      deductions: 4200,
      netSalary: 32300,
      month: currentMonth,
      paymentDate: '2024-01-30',
      status: 'processing'
    }
  ];

  const expenseEntries: ExpenseEntry[] = [
    {
      id: '1',
      category: 'Office Rent',
      description: 'Monthly office rent payment',
      amount: 25000,
      date: '2024-01-01',
      month: currentMonth,
      type: 'administrative',
      approvedBy: 'Admin',
      status: 'approved'
    },
    {
      id: '2',
      category: 'Utilities',
      description: 'Electricity and internet bills',
      amount: 5500,
      date: '2024-01-05',
      month: currentMonth,
      type: 'utilities',
      approvedBy: 'Admin',
      status: 'approved'
    },
    {
      id: '3',
      category: 'Software Licenses',
      description: 'Annual software subscription renewals',
      amount: 8000,
      date: '2024-01-10',
      month: currentMonth,
      type: 'operational',
      approvedBy: 'Admin',
      status: 'approved'
    },
    {
      id: '4',
      category: 'Marketing',
      description: 'Digital marketing campaigns',
      amount: 12000,
      date: '2024-01-15',
      month: currentMonth,
      type: 'marketing',
      approvedBy: 'Admin',
      status: 'pending'
    }
  ];

  const profitLossData: ProfitLossData[] = [
    {
      month: '2023-10',
      revenue: 285000,
      salaryExpense: 145000,
      adminExpense: 45000,
      totalExpense: 190000,
      netProfit: 95000,
      profitMargin: 33.3
    },
    {
      month: '2023-11',
      revenue: 320000,
      salaryExpense: 152000,
      adminExpense: 48000,
      totalExpense: 200000,
      netProfit: 120000,
      profitMargin: 37.5
    },
    {
      month: '2023-12',
      revenue: 375000,
      salaryExpense: 165000,
      adminExpense: 52000,
      totalExpense: 217000,
      netProfit: 158000,
      profitMargin: 42.1
    },
    {
      month: '2024-01',
      revenue: 420000,
      salaryExpense: 170000,
      adminExpense: 50500,
      totalExpense: 220500,
      netProfit: 199500,
      profitMargin: 47.5
    }
  ];

  // Calculate current month statistics
  const currentMonthSalary = salaryEntries
    .filter(entry => entry.month === selectedMonth)
    .reduce((sum, entry) => sum + entry.netSalary, 0);

  const currentMonthExpenses = expenseEntries
    .filter(entry => entry.month === selectedMonth)
    .reduce((sum, entry) => sum + entry.amount, 0);

  const currentMonthData = profitLossData.find(data => data.month === selectedMonth);
  const totalExpense = currentMonthSalary + currentMonthExpenses;
  const estimatedRevenue = currentMonthData?.revenue || 420000;
  const netProfit = estimatedRevenue - totalExpense;
  const profitMargin = ((netProfit / estimatedRevenue) * 100);

  // Expense breakdown for pie chart
  const expenseBreakdown = [
    { name: 'Salaries', value: currentMonthSalary, fill: '#3b82f6' },
    { name: 'Administrative', value: expenseEntries.filter(e => e.type === 'administrative').reduce((sum, e) => sum + e.amount, 0), fill: '#ef4444' },
    { name: 'Operational', value: expenseEntries.filter(e => e.type === 'operational').reduce((sum, e) => sum + e.amount, 0), fill: '#f59e0b' },
    { name: 'Marketing', value: expenseEntries.filter(e => e.type === 'marketing').reduce((sum, e) => sum + e.amount, 0), fill: '#10b981' },
    { name: 'Utilities', value: expenseEntries.filter(e => e.type === 'utilities').reduce((sum, e) => sum + e.amount, 0), fill: '#8b5cf6' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expense Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage salaries, expenses, and track profit & loss analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(estimatedRevenue)}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
            <p className="text-xs text-muted-foreground">
              Salary: {formatCurrency(currentMonthSalary)} | Other: {formatCurrency(currentMonthExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {netProfit >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margin: {profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salaryEntries.length}</div>
            <p className="text-xs text-muted-foreground">Active payroll</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="salary">Salary Management</TabsTrigger>
          <TabsTrigger value="expenses">Administrative Expenses</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit & Loss Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Profit & Loss Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={profitLossData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                    <Bar dataKey="totalExpense" fill="#ef4444" name="Total Expense" />
                    <Line type="monotone" dataKey="netProfit" stroke="#10b981" strokeWidth={3} name="Net Profit" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Expense Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest salary payments and expense entries</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ...salaryEntries.slice(0, 3).map(entry => ({
                      date: entry.paymentDate,
                      type: 'Salary',
                      description: `Salary payment - ${entry.employeeName}`,
                      amount: entry.netSalary,
                      status: entry.status
                    })),
                    ...expenseEntries.slice(0, 3).map(entry => ({
                      date: entry.date,
                      type: 'Expense',
                      description: entry.description,
                      amount: entry.amount,
                      status: entry.status
                    }))
                  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6).map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'Salary' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Management Tab */}
        <TabsContent value="salary" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Salary Management</h3>
              <p className="text-sm text-muted-foreground">Manage employee salaries and payroll</p>
            </div>
            <Dialog open={isAddSalaryOpen} onOpenChange={setIsAddSalaryOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Salary Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Salary Entry</DialogTitle>
                  <DialogDescription>Create a new salary entry for an employee</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employee">Employee</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emp1">John Smith</SelectItem>
                          <SelectItem value="emp2">Sarah Johnson</SelectItem>
                          <SelectItem value="emp3">Mike Davis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="month">Month</Label>
                      <Input type="month" defaultValue={currentMonth} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="baseSalary">Base Salary</Label>
                      <Input type="number" placeholder="Enter base salary" />
                    </div>
                    <div>
                      <Label htmlFor="bonus">Bonus</Label>
                      <Input type="number" placeholder="Enter bonus amount" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="deductions">Deductions</Label>
                    <Input type="number" placeholder="Enter deduction amount" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddSalaryOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsAddSalaryOpen(false)}>Save Entry</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.employeeName}</div>
                          <div className="text-sm text-muted-foreground">{entry.employeeId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{entry.designation}</div>
                          <div className="text-sm text-muted-foreground">{entry.department}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(entry.baseSalary)}</TableCell>
                      <TableCell>{formatCurrency(entry.bonus)}</TableCell>
                      <TableCell>{formatCurrency(entry.deductions)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(entry.netSalary)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Administrative Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Administrative Expenses</h3>
              <p className="text-sm text-muted-foreground">Track and manage company expenses</p>
            </div>
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Expense Entry</DialogTitle>
                  <DialogDescription>Record a new company expense</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input placeholder="e.g., Office Supplies" />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrative">Administrative</SelectItem>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input placeholder="Enter expense description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input type="number" placeholder="Enter amount" />
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input type="date" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsAddExpenseOpen(false)}>Save Expense</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{entry.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(entry.amount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Financial Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={profitLossData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
                    <Line type="monotone" dataKey="totalExpense" stroke="#ef4444" strokeWidth={2} name="Total Expense" />
                    <Line type="monotone" dataKey="netProfit" stroke="#10b981" strokeWidth={2} name="Net Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profit Margin Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Profit Margin Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={profitLossData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                    <Bar dataKey="profitMargin" fill="#8b5cf6" name="Profit Margin %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense Category Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Category Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseBreakdown.map((category, index) => {
                    const percentage = (category.value / expenseBreakdown.reduce((sum, item) => sum + item.value, 0)) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(category.value)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Financial Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Revenue Growth</span>
                    <span className="text-green-600 font-semibold">+18.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Expense Ratio</span>
                    <span className="text-blue-600 font-semibold">52.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Average Profit Margin</span>
                    <span className="text-purple-600 font-semibold">40.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Salary-to-Revenue Ratio</span>
                    <span className="text-orange-600 font-semibold">40.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Admin Expense Ratio</span>
                    <span className="text-red-600 font-semibold">12.0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
