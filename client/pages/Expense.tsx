import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Filter,
  FileText,
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
  status: "pending" | "paid" | "processing";
}

interface ExpenseEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  month: string;
  type:
    | "administrative"
    | "operational"
    | "marketing"
    | "utilities"
    | "miscellaneous";
  frequency: "monthly" | "one-time";
  receipt?: string;
  approvedBy: string;
  status: "pending" | "approved" | "rejected";
  createdMonth?: string; // For tracking when one-time expenses were originally created
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
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [profitLossData, setProfitLossData] = useState<ProfitLossData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isViewExpenseOpen, setIsViewExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseEntry | null>(
    null,
  );

  // New state for expense form
  const [newExpense, setNewExpense] = useState({
    category: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    type: "",
    frequency: "one-time" as "monthly" | "one-time",
  });

  // Enhanced expenses state with recurring functionality
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);

  // Mock data for demonstration
  const currentMonth = new Date().toISOString().slice(0, 7);

  const salaryEntries: SalaryEntry[] = [
    {
      id: "1",
      employeeName: "John Smith",
      employeeId: "EMP001",
      designation: "Project Manager",
      department: "Operations",
      baseSalary: 65000,
      bonus: 5000,
      deductions: 8000,
      netSalary: 62000,
      month: currentMonth,
      paymentDate: "2024-01-30",
      status: "paid",
    },
    {
      id: "2",
      employeeName: "Sarah Johnson",
      employeeId: "EMP002",
      designation: "Data Analyst",
      department: "Operations",
      baseSalary: 45000,
      bonus: 2000,
      deductions: 5500,
      netSalary: 41500,
      month: currentMonth,
      paymentDate: "2024-01-30",
      status: "paid",
    },
    {
      id: "3",
      employeeName: "Mike Davis",
      employeeId: "EMP003",
      designation: "Data Entry Specialist",
      department: "Operations",
      baseSalary: 35000,
      bonus: 1500,
      deductions: 4200,
      netSalary: 32300,
      month: currentMonth,
      paymentDate: "2024-01-30",
      status: "processing",
    },
  ];

  // Base recurring monthly expenses
  const baseRecurringExpenses: Omit<ExpenseEntry, "id" | "date" | "month">[] = [
    {
      category: "Office Rent",
      description: "Monthly office rent payment",
      amount: 25000,
      type: "administrative",
      frequency: "monthly",
      approvedBy: "Admin",
      status: "approved",
    },
    {
      category: "Utilities",
      description: "Electricity and internet bills",
      amount: 5500,
      type: "utilities",
      frequency: "monthly",
      approvedBy: "Admin",
      status: "approved",
    },
    {
      category: "Internet & Phone",
      description: "Monthly internet and phone services",
      amount: 3200,
      type: "utilities",
      frequency: "monthly",
      approvedBy: "Admin",
      status: "approved",
    },
    {
      category: "Insurance",
      description: "Monthly business insurance premium",
      amount: 4500,
      type: "administrative",
      frequency: "monthly",
      approvedBy: "Admin",
      status: "approved",
    },
    {
      category: "Cleaning Services",
      description: "Monthly office cleaning and maintenance",
      amount: 2800,
      type: "operational",
      frequency: "monthly",
      approvedBy: "Admin",
      status: "approved",
    },
  ];

  // One-time expenses for current month
  const oneTimeExpenses: ExpenseEntry[] = [
    {
      id: "ot-1",
      category: "Office Equipment",
      description: "New computers and peripherals",
      amount: 85000,
      date: "2024-01-10",
      month: currentMonth,
      type: "operational",
      frequency: "one-time",
      createdMonth: currentMonth,
      approvedBy: "Admin",
      status: "approved",
    },
    {
      id: "ot-2",
      category: "Marketing Campaign",
      description: "Q1 digital marketing campaign launch",
      amount: 15000,
      date: "2024-01-15",
      month: currentMonth,
      type: "marketing",
      frequency: "one-time",
      createdMonth: currentMonth,
      approvedBy: "Admin",
      status: "pending",
    },
    {
      id: "ot-3",
      category: "Training",
      description: "Employee skill development workshop",
      amount: 8500,
      date: "2024-01-20",
      month: currentMonth,
      type: "administrative",
      frequency: "one-time",
      createdMonth: currentMonth,
      approvedBy: "Admin",
      status: "approved",
    },
  ];

  // Generate expense entries for current month (recurring + one-time)
  const generateExpensesForMonth = (month: string): ExpenseEntry[] => {
    const monthlyExpenses = baseRecurringExpenses.map((expense, index) => ({
      ...expense,
      id: `recurring-${month}-${index}`,
      date: `${month}-01`,
      month: month,
    }));

    const currentMonthOneTime = oneTimeExpenses.filter(
      (expense) => expense.month === month || expense.createdMonth === month,
    );

    return [...monthlyExpenses, ...currentMonthOneTime];
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [list, pl] = await Promise.all([
          apiClient.getExpenses({ month: selectedMonth, limit: 500 }),
          apiClient.getExpenseProfitLoss(),
        ]);
        const data = (list as any)?.data || list || [];
        const stats = (list as any)?.statistics || null;
        setExpenseEntries(data as any);
        setExpenseStats(stats);
        setProfitLossData(((pl as any)?.data || pl || []) as any);
      } catch (e) {
        console.error("Failed to load expenses", e);
        setExpenseEntries([]);
        setExpenseStats(null);
        setProfitLossData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedMonth]);

  const profitLossData: ProfitLossData[] = [
    {
      month: "2023-10",
      revenue: 285000,
      salaryExpense: 145000,
      adminExpense: 45000,
      totalExpense: 190000,
      netProfit: 95000,
      profitMargin: 33.3,
    },
    {
      month: "2023-11",
      revenue: 320000,
      salaryExpense: 152000,
      adminExpense: 48000,
      totalExpense: 200000,
      netProfit: 120000,
      profitMargin: 37.5,
    },
    {
      month: "2023-12",
      revenue: 375000,
      salaryExpense: 165000,
      adminExpense: 52000,
      totalExpense: 217000,
      netProfit: 158000,
      profitMargin: 42.1,
    },
    {
      month: "2024-01",
      revenue: 420000,
      salaryExpense: 170000,
      adminExpense: 50500,
      totalExpense: 220500,
      netProfit: 199500,
      profitMargin: 47.5,
    },
  ];

  // Calculate current month statistics
  const currentMonthSalary = salaryEntries
    .filter((entry) => entry.month === selectedMonth)
    .reduce((sum, entry) => sum + entry.netSalary, 0);

  const currentMonthExpenses = expenseEntries
    .filter((entry) => entry.month === selectedMonth)
    .reduce((sum, entry) => sum + entry.amount, 0);

  const currentMonthData = profitLossData.find(
    (data) => data.month === selectedMonth,
  );
  const totalExpense = currentMonthSalary + currentMonthExpenses;
  const estimatedRevenue = currentMonthData?.revenue || 420000;
  const netProfit = estimatedRevenue - totalExpense;
  const profitMargin = (netProfit / estimatedRevenue) * 100;

  // Expense breakdown for pie chart
  const expenseBreakdown = [
    { name: "Salaries", value: currentMonthSalary, fill: "#3b82f6" },
    {
      name: "Administrative",
      value: expenseEntries
        .filter((e) => e.type === "administrative")
        .reduce((sum, e) => sum + e.amount, 0),
      fill: "#ef4444",
    },
    {
      name: "Operational",
      value: expenseEntries
        .filter((e) => e.type === "operational")
        .reduce((sum, e) => sum + e.amount, 0),
      fill: "#f59e0b",
    },
    {
      name: "Marketing",
      value: expenseEntries
        .filter((e) => e.type === "marketing")
        .reduce((sum, e) => sum + e.amount, 0),
      fill: "#10b981",
    },
    {
      name: "Utilities",
      value: expenseEntries
        .filter((e) => e.type === "utilities")
        .reduce((sum, e) => sum + e.amount, 0),
      fill: "#8b5cf6",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Handler functions for expense management
  const handleViewExpense = (expense: ExpenseEntry) => {
    setSelectedExpense(expense);
    setIsViewExpenseOpen(true);
  };

  const handleEditExpense = (expense: ExpenseEntry) => {
    setSelectedExpense(expense);
    setIsEditExpenseOpen(true);
  };

  const handleDeleteExpense = (expense: ExpenseEntry) => {
    if (
      window.confirm(
        `Are you sure you want to delete the expense "${expense.description}"?`,
      )
    ) {
      // In a real application, you would call an API to delete the expense
      console.log("Deleting expense:", expense.id);
      alert("Expense deleted successfully!");
    }
  };

  // New handlers for expense management
  const handleAddExpense = () => {
    if (
      !newExpense.category ||
      !newExpense.description ||
      !newExpense.amount ||
      !newExpense.type
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const expenseToAdd: ExpenseEntry = {
      id: `${newExpense.frequency}-${Date.now()}`,
      category: newExpense.category,
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      date: newExpense.date,
      month: selectedMonth,
      type: newExpense.type as any,
      frequency: newExpense.frequency,
      createdMonth:
        newExpense.frequency === "one-time" ? selectedMonth : undefined,
      approvedBy: "Admin",
      status: "pending",
    };

    if (newExpense.frequency === "monthly") {
      // Add to base recurring expenses
      console.log("Adding recurring monthly expense:", expenseToAdd);
      alert(
        `Monthly recurring expense "${newExpense.category}" added successfully! It will appear in all months.`,
      );
    } else {
      // Add as one-time expense
      console.log("Adding one-time expense:", expenseToAdd);
      alert(
        `One-time expense "${newExpense.category}" added successfully for ${selectedMonth}!`,
      );
    }

    // Reset form
    setNewExpense({
      category: "",
      description: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      type: "",
      frequency: "one-time",
    });

    setIsAddExpenseOpen(false);
  };

  const resetExpenseForm = () => {
    setNewExpense({
      category: "",
      description: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      type: "",
      frequency: "one-time",
    });
  };

  const handleExportReport = () => {
    // Generate CSV data for export
    const csvData = [
      [
        "Date",
        "Category",
        "Type",
        "Description",
        "Amount",
        "Status",
        "Approved By",
      ],
      ...expenseEntries.map((entry) => [
        new Date(entry.date).toLocaleDateString(),
        entry.category,
        entry.type,
        entry.description,
        entry.amount.toString(),
        entry.status,
        entry.approvedBy,
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `expense-report-${selectedMonth}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Expense Management
          </h1>
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
          <Button onClick={handleExportReport}>
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
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(estimatedRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-xs text-muted-foreground">
              Salary: {formatCurrency(currentMonthSalary)} | Other:{" "}
              {formatCurrency(currentMonthExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            {netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
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
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                    <Bar
                      dataKey="totalExpense"
                      fill="#ef4444"
                      name="Total Expense"
                    />
                    <Line
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
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Latest salary payments and expense entries
              </CardDescription>
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
                    ...salaryEntries.slice(0, 3).map((entry) => ({
                      date: entry.paymentDate,
                      type: "Salary",
                      description: `Salary payment - ${entry.employeeName}`,
                      amount: entry.netSalary,
                      status: entry.status,
                    })),
                    ...expenseEntries.slice(0, 3).map((entry) => ({
                      date: entry.date,
                      type: "Expense",
                      description: entry.description,
                      amount: entry.amount,
                      status: entry.status,
                    })),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .slice(0, 6)
                    .map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.type === "Salary"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
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
              <p className="text-sm text-muted-foreground">
                File-based earnings and salary tracking
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/salary")}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Full Details
              </Button>
              <Dialog open={isAddSalaryOpen} onOpenChange={setIsAddSalaryOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Update Salary Config
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[70vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Update Salary Configuration</DialogTitle>
                    <DialogDescription>
                      Configure salary rates and limits for users and project
                      managers
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* User Configuration */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-lg">
                        User File-Based Salary
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstTierRate">
                            First Tier Rate (₹)
                          </Label>
                          <Input
                            id="firstTierRate"
                            type="number"
                            step="0.01"
                            defaultValue="0.50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Per file rate for first tier
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondTierRate">
                            Second Tier Rate (₹)
                          </Label>
                          <Input
                            id="secondTierRate"
                            type="number"
                            step="0.01"
                            defaultValue="0.60"
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
                          defaultValue="500"
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
                      <div className="space-y-3">
                        <div className="space-y-2 p-3 border border-gray-200 rounded-lg">
                          <Label htmlFor="salary-pm1">
                            Emily Wilson - Monthly Salary (₹)
                          </Label>
                          <Input
                            id="salary-pm1"
                            type="number"
                            defaultValue="30000"
                          />
                          <p className="text-xs text-muted-foreground">
                            Current: ₹30,000.00 | Role: Project Manager | ID:
                            PM_001
                          </p>
                        </div>
                        <div className="space-y-2 p-3 border border-gray-200 rounded-lg">
                          <Label htmlFor="salary-pm2">
                            John Smith - Monthly Salary (₹)
                          </Label>
                          <Input
                            id="salary-pm2"
                            type="number"
                            defaultValue="20000"
                          />
                          <p className="text-xs text-muted-foreground">
                            Current: ₹20,000.00 | Role: Project Manager | ID:
                            PM_002
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Configure individual monthly salaries for each project
                        manager. Changes allow for increments/decrements.
                      </p>
                    </div>

                    {/* Current Summary */}
                    <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800">
                        Current Configuration Summary
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            First 500 files:
                          </span>
                          <span className="ml-2 font-medium text-green-600">
                            ₹0.50 per file
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            After 500 files:
                          </span>
                          <span className="ml-2 font-medium text-green-600">
                            ₹0.60 per file
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Total PM Salaries:
                          </span>
                          <span className="ml-2 font-medium text-purple-600">
                            ₹50,000.00
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Est. User Earnings:
                          </span>
                          <span className="ml-2 font-medium text-blue-600">
                            ₹31,960.00
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddSalaryOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddSalaryOpen(false)}>
                      <Calculator className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* File Count Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Total Files
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">2,700</div>
                <p className="text-xs text-muted-foreground">
                  All users combined
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Weekly Files
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">15,800</div>
                <p className="text-xs text-muted-foreground">This week total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Files
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">58,100</div>
                <p className="text-xs text-muted-foreground">
                  This month total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Daily Files
                </CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">675</div>
                <p className="text-xs text-muted-foreground">
                  Per user average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User File-Based Salaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User File-Based Earnings
              </CardTitle>
              <CardDescription>
                Real-time file processing counts and earnings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Today's Files</TableHead>
                    <TableHead>Today's Earnings</TableHead>
                    <TableHead>Weekly Files</TableHead>
                    <TableHead>Monthly Files</TableHead>
                    <TableHead>Monthly Earnings</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">Sarah Johnson</div>
                        <div className="text-sm text-muted-foreground">
                          Data Analyst
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">750</Badge>
                        <span className="text-xs text-green-600">
                          Tier 2 rate
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        ₹400.00
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-blue-600">4,200</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">15,200</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">₹8,320.00</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Excellent
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">Mike Davis</div>
                        <div className="text-sm text-muted-foreground">
                          Data Entry Specialist
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-100 text-orange-800">
                          420
                        </Badge>
                        <span className="text-xs text-blue-600">
                          Tier 1 rate
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        ₹210.00
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-blue-600">2,800</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">9,800</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">₹5,630.00</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">David Chen</div>
                        <div className="text-sm text-muted-foreground">
                          Data Analyst
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">680</Badge>
                        <span className="text-xs text-green-600">
                          Tier 2 rate
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        ₹358.00
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-blue-600">3,900</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">14,500</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">₹7,900.00</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Excellent
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">Lisa Chen</div>
                        <div className="text-sm text-muted-foreground">
                          Senior Data Analyst
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          850
                        </Badge>
                        <span className="text-xs text-green-600">
                          Tier 2 rate
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        ₹460.00
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-blue-600">5,100</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">18,600</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-green-600">₹10,110.00</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Excellent
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Project Manager Salaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Project Manager Salaries
              </CardTitle>
              <CardDescription>
                Fixed monthly salaries for project managers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Manager</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Monthly Salary</TableHead>
                    <TableHead>Attendance Rate</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">Emily Wilson</div>
                        <div className="text-sm text-muted-foreground">
                          PM_001
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Operations</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-purple-600">
                        ₹30,000.00
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className="bg-green-100 text-green-800">
                          Excellent
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          98.5%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">Jan 21, 2024 5:30 PM</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div>
                        <div className="font-medium">John Smith</div>
                        <div className="text-sm text-muted-foreground">
                          PM_002
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Operations</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-purple-600">
                        ₹20,000.00
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          Good
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          94.2%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">Jan 21, 2024 4:45 PM</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Rate Configuration Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Current Rate Configuration
              </CardTitle>
              <CardDescription>
                File processing rates and salary calculation settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">User File-Based Rates</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-green-50 rounded">
                      <span>First 500 files:</span>
                      <span className="font-medium text-green-600">
                        ₹0.50 per file
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-blue-50 rounded">
                      <span>After 500 files:</span>
                      <span className="font-medium text-blue-600">
                        ₹0.60 per file
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">
                    Total Monthly Salary Allocation
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-purple-50 rounded">
                      <span>Total User Earnings:</span>
                      <span className="font-medium text-purple-600">
                        ₹31,960.00
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-purple-50 rounded">
                      <span>Total PM Salaries:</span>
                      <span className="font-medium text-purple-600">
                        ₹50,000.00
                      </span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-800 text-white rounded">
                      <span className="font-semibold">Total Monthly Cost:</span>
                      <span className="font-bold">₹81,960.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Administrative Expenses Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Administrative Expenses</h3>
              <p className="text-sm text-muted-foreground">
                Track and manage company expenses
              </p>
            </div>
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Expense Entry</DialogTitle>
                  <DialogDescription>
                    Record a new company expense - choose monthly recurring or
                    one-time
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Frequency Selection - Prominent */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Label className="text-base font-medium">
                      Expense Frequency *
                    </Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="frequency"
                          value="one-time"
                          checked={newExpense.frequency === "one-time"}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              frequency: e.target.value as
                                | "monthly"
                                | "one-time",
                            })
                          }
                          className="text-blue-600"
                        />
                        <div>
                          <span className="font-medium">One-time Expense</span>
                          <p className="text-xs text-muted-foreground">
                            For this month only
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="frequency"
                          value="monthly"
                          checked={newExpense.frequency === "monthly"}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              frequency: e.target.value as
                                | "monthly"
                                | "one-time",
                            })
                          }
                          className="text-blue-600"
                        />
                        <div>
                          <span className="font-medium">Monthly Recurring</span>
                          <p className="text-xs text-muted-foreground">
                            Appears every month
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        placeholder="e.g., Office Rent, Utilities"
                        value={newExpense.category}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            category: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={newExpense.type}
                        onValueChange={(value) =>
                          setNewExpense({ ...newExpense, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="administrative">
                            Administrative
                          </SelectItem>
                          <SelectItem value="operational">
                            Operational
                          </SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="miscellaneous">
                            Miscellaneous
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      placeholder="Enter detailed expense description"
                      value={newExpense.description}
                      onChange={(e) =>
                        setNewExpense({
                          ...newExpense,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount (₹) *</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={newExpense.amount}
                        onChange={(e) =>
                          setNewExpense({
                            ...newExpense,
                            amount: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) =>
                          setNewExpense({ ...newExpense, date: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Helpful info based on frequency */}
                  {newExpense.frequency === "monthly" && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        💡 <strong>Monthly Recurring:</strong> This expense will
                        automatically appear in all months. Perfect for rent,
                        utilities, insurance, etc.
                      </p>
                    </div>
                  )}

                  {newExpense.frequency === "one-time" && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        💡 <strong>One-time Expense:</strong> This expense will
                        only appear in {selectedMonth}. Perfect for equipment
                        purchases, special projects, etc.
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetExpenseForm();
                      setIsAddExpenseOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddExpense}>
                    {newExpense.frequency === "monthly"
                      ? "Add Monthly Expense"
                      : "Add One-time Expense"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Expense Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Recurring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    expenseEntries
                      .filter((e) => e.frequency === "monthly")
                      .reduce((sum, e) => sum + e.amount, 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {
                    expenseEntries.filter((e) => e.frequency === "monthly")
                      .length
                  }{" "}
                  expenses
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  One-time ({selectedMonth})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    expenseEntries
                      .filter((e) => e.frequency === "one-time")
                      .reduce((sum, e) => sum + e.amount, 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {
                    expenseEntries.filter((e) => e.frequency === "one-time")
                      .length
                  }{" "}
                  expenses
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    expenseEntries.reduce((sum, e) => sum + e.amount, 0),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {expenseEntries.length} total expenses
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Expense Details for {selectedMonth}
              </CardTitle>
              <CardDescription>
                View all monthly recurring and one-time expenses for the
                selected month
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={
                        entry.frequency === "monthly" ? "bg-blue-50/50" : ""
                      }
                    >
                      <TableCell>
                        {new Date(entry.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.category}
                        {entry.frequency === "monthly" && (
                          <div className="text-xs text-blue-600 font-medium">
                            🔄 Recurring
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {entry.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.frequency === "monthly"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            entry.frequency === "monthly"
                              ? "bg-blue-600"
                              : "bg-orange-600 text-white"
                          }
                        >
                          {entry.frequency === "monthly"
                            ? "Monthly"
                            : "One-time"}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(entry.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewExpense(entry)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(entry)}
                            disabled={entry.frequency === "monthly"}
                            title={
                              entry.frequency === "monthly"
                                ? "Cannot delete recurring expenses from monthly view"
                                : "Delete expense"
                            }
                          >
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
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalExpense"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Total Expense"
                    />
                    <Line
                      type="monotone"
                      dataKey="netProfit"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Net Profit"
                    />
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
                    <Tooltip
                      formatter={(value) => `${Number(value).toFixed(1)}%`}
                    />
                    <Bar
                      dataKey="profitMargin"
                      fill="#8b5cf6"
                      name="Profit Margin %"
                    />
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
                    const percentage =
                      (category.value /
                        expenseBreakdown.reduce(
                          (sum, item) => sum + item.value,
                          0,
                        )) *
                      100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(category.value)} (
                            {percentage.toFixed(1)}%)
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

      {/* View Expense Dialog */}
      <Dialog open={isViewExpenseOpen} onOpenChange={setIsViewExpenseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>View Expense Details</DialogTitle>
            <DialogDescription>
              Detailed information about the expense entry
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date
                  </Label>
                  <p className="text-sm">
                    {new Date(selectedExpense.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Category
                  </Label>
                  <p className="text-sm font-medium">
                    {selectedExpense.category}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Type
                  </Label>
                  <Badge variant="outline" className="capitalize">
                    {selectedExpense.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Amount
                  </Label>
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(selectedExpense.amount)}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Description
                </Label>
                <p className="text-sm">{selectedExpense.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <Badge className={getStatusColor(selectedExpense.status)}>
                    {selectedExpense.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Approved By
                  </Label>
                  <p className="text-sm">{selectedExpense.approvedBy}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Month
                </Label>
                <p className="text-sm">{selectedExpense.month}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewExpenseOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewExpenseOpen(false);
                if (selectedExpense) handleEditExpense(selectedExpense);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Expense Entry</DialogTitle>
            <DialogDescription>
              Update the expense information
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    defaultValue={selectedExpense.category}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <Select defaultValue={selectedExpense.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="administrative">
                        Administrative
                      </SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="miscellaneous">
                        Miscellaneous
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  defaultValue={selectedExpense.description}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-amount">Amount</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    defaultValue={selectedExpense.amount}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-date">Date</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    defaultValue={selectedExpense.date}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={selectedExpense.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditExpenseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // In a real application, you would save the changes here
                console.log("Saving expense changes for:", selectedExpense?.id);
                setIsEditExpenseOpen(false);
                alert("Expense updated successfully!");
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
