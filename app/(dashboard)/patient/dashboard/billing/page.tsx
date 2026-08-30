"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt,
  FileText,
  Search,
  ArrowUpRight,
  Printer,
  Building2,
  RefreshCw,
  Wallet,
  ShieldCheck,
  FileDown,
  Download
} from "lucide-react";
import { downloadReport } from "@/lib/reports";

interface Payment {
  id: string | number;
  amount: string | number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string;
}

interface Bill {
  id: string | number;
  patientId?: string | number;
  admissionId?: string | number | null;
  appointmentId?: string | number | null;
  totalAmount: string | number;
  paidAmount: string | number;
  status: "unpaid" | "partially_paid" | "paid" | "cancelled" | string;
  dueDate: string;
  createdAt: string;
  payments?: Payment[];
  appointment?: {
    id: string | number;
    reason?: string;
    appointmentDate?: string;
    doctor?: {
      user?: { firstName?: string; lastName?: string };
      specialization?: string;
    };
  };
  admission?: {
    id: string | number;
    admissionDate?: string;
    dischargeDate?: string;
    roomNumber?: string;
  };
}

interface ReceiptDetails {
  invoiceNumber?: string;
  balanceDue?: number | string;
  totalAmount?: number | string;
  paidAmount?: number | string;
  dueDate?: string;
  createdAt?: string;
  status?: string;
  patient?: {
    name?: string;
    email?: string;
    mobile?: string;
  };
  payments?: Payment[];
}

export default function PatientBillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid" | "history">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Payment Modal State
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState<Bill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Invoice Details Modal State
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedBillForInvoice, setSelectedBillForInvoice] = useState<Bill | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<ReceiptDetails | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setRefreshing(true);
      // Try /billing/me first, fallback to /billing/bills
      const res = await api.get("/billing/me").catch(() => api.get("/billing/bills"));
      const data = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res?.data?.data) ? res.data.data : []);
      setBills(data);
    } catch (error) {
      console.error("Error fetching bills:", error);
      setBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper calculations
  const calculateRemaining = (bill: Bill) => {
    const total = parseFloat(String(bill.totalAmount || 0));
    const paid = parseFloat(String(bill.paidAmount || 0));
    return Math.max(0, total - paid);
  };

  const isOverdue = (bill: Bill) => {
    if (bill.status === "paid" || bill.status === "cancelled") return false;
    if (!bill.dueDate) return false;
    const due = new Date(bill.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Helper to format invoice number nicely for both incremental IDs (INV-00001) and legacy UUIDs
  const formatInvoiceId = (id: string | number | undefined | null) => {
    if (id === undefined || id === null) return "INV-00000";
    const str = String(id).trim();
    if (!isNaN(Number(str))) {
      return `INV-${str.padStart(5, "0")}`;
    }
    return `INV-${str.slice(0, 8).toUpperCase()}`;
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    let unpaidCount = 0;

    bills.forEach((bill) => {
      const total = parseFloat(String(bill.totalAmount || 0));
      const paid = parseFloat(String(bill.paidAmount || 0));
      const remaining = Math.max(0, total - paid);

      totalBilled += total;
      totalPaid += paid;
      totalOutstanding += remaining;

      if (bill.status !== "paid" && bill.status !== "cancelled" && remaining > 0) {
        unpaidCount += 1;
        if (isOverdue(bill)) {
          overdueCount += 1;
        }
      }
    });

    return {
      totalBilled,
      totalPaid,
      totalOutstanding,
      overdueCount,
      unpaidCount,
    };
  }, [bills]);

  // All payments aggregated for payment history tab
  const allPayments = useMemo(() => {
    const paymentsList: Array<Payment & { billId: string | number; billDueDate: string }> = [];
    bills.forEach((bill) => {
      if (Array.isArray(bill.payments)) {
        bill.payments.forEach((p) => {
          paymentsList.push({
            ...p,
            billId: bill.id,
            billDueDate: bill.dueDate,
          });
        });
      }
    });
    return paymentsList.sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }, [bills]);

  // Filtered bills
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (activeTab === "unpaid" && bill.status === "paid") return false;
      if (activeTab === "paid" && bill.status !== "paid") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = String(bill.id).toLowerCase().includes(q);
        const refMatch = bill.payments?.some((p) => p.referenceNumber?.toLowerCase().includes(q));
        const dateMatch = bill.createdAt?.toLowerCase().includes(q) || bill.dueDate?.toLowerCase().includes(q);
        return idMatch || refMatch || dateMatch;
      }

      return true;
    });
  }, [bills, activeTab, searchQuery]);

  // Open Payment Modal
  const openPaymentModal = (bill: Bill) => {
    const remaining = calculateRemaining(bill);
    setSelectedBillForPay(bill);
    setPaymentAmount(remaining.toFixed(2));
    setPaymentMethod("credit_card");
    setReferenceNumber(`TXN-PAT-${Date.now().toString().slice(-6)}`);
    setPaySuccess(null);
    setPayError(null);
    setPayDialogOpen(true);
  };

  // Submit Payment with accepted methods: cash | credit_card | debit_card | insurance | bank_transfer | upi | online
  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPay) return;

    const amountNum = parseFloat(paymentAmount);
    const remaining = calculateRemaining(selectedBillForPay);

    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError("Please enter a valid payment amount greater than 0.");
      return;
    }

    if (amountNum > remaining + 0.001) {
      setPayError(`Payment amount cannot exceed the remaining balance ($${remaining.toFixed(2)}).`);
      return;
    }

    setPaying(true);
    setPayError(null);
    setPaySuccess(null);

    const numericBillId = !isNaN(Number(selectedBillForPay.id))
      ? Number(selectedBillForPay.id)
      : selectedBillForPay.id;

    try {
      await api.post("/billing/payments", {
        billId: numericBillId,
        amount: amountNum,
        paymentMethod: paymentMethod,
        referenceNumber: referenceNumber.trim() || `TXN-PAT-${Date.now().toString().slice(-6)}`,
      });

      setPaySuccess("Payment processed successfully! Your invoice status has been updated.");
      await fetchBills();

      setTimeout(() => {
        setPayDialogOpen(false);
        setPaySuccess(null);
      }, 1800);
    } catch (error: any) {
      console.error("Payment error:", error);
      setPayError(error.message || "Failed to process payment. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // Open Invoice & fetch receipt details from /billing/bills/:id/receipt
  const openInvoiceModal = async (bill: Bill) => {
    setSelectedBillForInvoice(bill);
    setReceiptDetails(null);
    setInvoiceDialogOpen(true);
    setLoadingReceipt(true);

    try {
      const res = await api.get(`/billing/bills/${bill.id}/receipt`).catch(() => null);
      if (res?.data) {
        setReceiptDetails(res.data);
      }
    } catch (error) {
      console.error("Error fetching receipt details:", error);
    } finally {
      setLoadingReceipt(false);
    }
  };

  const getStatusBadge = (status: string, overdue: boolean) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") {
      return (
        <Badge variant="success" className="gap-1 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Paid
        </Badge>
      );
    }
    if (s === "partially_paid") {
      return (
        <Badge variant="warning" className="gap-1 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Partially Paid
        </Badge>
      );
    }
    if (s === "cancelled") {
      return (
        <Badge variant="outline" className="gap-1 font-medium">
          Cancelled
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1 font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {overdue ? "Unpaid (Overdue)" : "Unpaid"}
      </Badge>
    );
  };

  const formatMethodName = (method: string) => {
    switch (method?.toLowerCase()) {
      case "credit_card": return "Credit Card";
      case "debit_card": return "Debit Card";
      case "bank_transfer": return "Bank Transfer";
      case "upi": return "UPI";
      case "online": return "Online Payment";
      case "cash": return "Cash";
      case "insurance": return "Insurance Claim";
      default: return method || "Direct Payment";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Loading your billing details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">
            Manage hospital invoices, inspect statements, and complete secure bill payments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBills}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Overdue Alert Banner if applicable */}
      {metrics.overdueCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Payment Alert:</span> You have{" "}
              <span className="font-bold">{metrics.overdueCount}</span> overdue invoice{metrics.overdueCount > 1 ? "s" : ""}. Please settle your balance promptly.
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setActiveTab("unpaid")}
            className="shrink-0 self-end sm:self-center"
          >
            View Overdue Bills
          </Button>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Outstanding Balance */}
        <Card className="border-l-4 border-l-amber-500 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${metrics.totalOutstanding.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.unpaidCount} pending {metrics.unpaidCount === 1 ? "bill" : "bills"}
            </p>
          </CardContent>
        </Card>

        {/* Total Billed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${metrics.totalBilled.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {bills.length} total {bills.length === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ${metrics.totalPaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {allPayments.length} completed transactions
            </p>
          </CardContent>
        </Card>

        {/* Overdue Count */}
        <Card className={metrics.overdueCount > 0 ? "border-l-4 border-l-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <Clock className={`h-4 w-4 ${metrics.overdueCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metrics.overdueCount > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
              {metrics.overdueCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.overdueCount > 0 ? "Requires attention" : "All payments on schedule"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs and Actions */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center space-x-1 bg-muted/60 p-1 rounded-lg w-full sm:w-fit overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Invoices ({bills.length})
            </button>
            <button
              onClick={() => setActiveTab("unpaid")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === "unpaid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Due & Unpaid ({metrics.unpaidCount})
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === "paid"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Settled / Paid ({bills.length - metrics.unpaidCount})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === "history"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Payment History ({allPayments.length})
            </button>
          </div>

          {activeTab !== "history" && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm h-9"
              />
            </div>
          )}
        </div>

        {/* Tab 1, 2, 3: Invoices Table */}
        {activeTab !== "history" ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Invoice # / Ref</TableHead>
                    <TableHead className="whitespace-nowrap">Issued Date</TableHead>
                    <TableHead className="whitespace-nowrap">Due Date</TableHead>
                    <TableHead className="whitespace-nowrap">Total Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Paid Amount</TableHead>
                    <TableHead className="whitespace-nowrap">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
                        <p className="font-medium">No invoices found</p>
                        <p className="text-xs">
                          {searchQuery ? "Try refining your search query." : "You do not have any invoices under this section."}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBills.map((bill) => {
                      const total = parseFloat(String(bill.totalAmount || 0));
                      const paid = parseFloat(String(bill.paidAmount || 0));
                      const remaining = calculateRemaining(bill);
                      const overdue = isOverdue(bill);

                      return (
                        <TableRow key={bill.id} className={overdue ? "bg-red-500/5" : ""}>
                          <TableCell className="font-mono text-xs font-semibold">
                            <div className="flex flex-col">
                              <span>{formatInvoiceId(bill.id)}</span>
                              {bill.appointmentId && (
                                <span className="text-[11px] font-sans text-muted-foreground">Appt #{bill.appointmentId}</span>
                              )}
                              {bill.admissionId && (
                                <span className="text-[11px] font-sans text-muted-foreground">Admission #{bill.admissionId}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {bill.dueDate ? (
                              <div className="flex flex-col">
                                <span className={overdue ? "font-semibold text-red-600 dark:text-red-400" : ""}>
                                  {new Date(bill.dueDate).toLocaleDateString()}
                                </span>
                                {overdue && (
                                  <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Overdue</span>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">${total.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">${paid.toFixed(2)}</TableCell>
                          <TableCell className="text-sm font-bold">
                            <span className={remaining > 0 ? (overdue ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400") : "text-emerald-600 dark:text-emerald-400"}>
                              ${remaining.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(bill.status, overdue)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadReport("billing", bill.id)}
                                title="Download PDF Invoice"
                                className="h-8 text-xs flex items-center gap-1 text-primary hover:bg-primary/10 border-primary/30"
                              >
                                <FileDown className="h-3.5 w-3.5" />
                                PDF
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openInvoiceModal(bill)}
                                className="h-8 text-xs"
                              >
                                Statement
                              </Button>
                              {bill.status !== "paid" && bill.status !== "cancelled" && remaining > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => openPaymentModal(bill)}
                                  className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                                >
                                  Pay Now
                                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* Tab 4: All Payments History */
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Past Payment Transactions</CardTitle>
              <CardDescription>
                Comprehensive audit log of all payments and receipts made from your patient account.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Date & Time</TableHead>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Reference Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Receipt className="mx-auto h-8 w-8 mb-2 opacity-40" />
                        <p className="font-medium">No payment transactions recorded yet</p>
                        <p className="text-xs">Once you settle invoices, payment logs will appear here.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    allPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatInvoiceId(payment.billId)}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatMethodName(payment.paymentMethod)}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {payment.referenceNumber || "—"}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          +${parseFloat(String(payment.amount || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="success" className="text-xs">
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pay Now Modal Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Make a Payment
          </DialogTitle>
          <DialogDescription>
            Complete direct bill settlement for {formatInvoiceId(selectedBillForPay?.id)}.
          </DialogDescription>
        </DialogHeader>

        {paySuccess ? (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Payment Successful!</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{paySuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleMakePayment}>
            {selectedBillForPay && (
              <div className="space-y-4">
                {/* Bill Breakdown Summary Card */}
                <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Invoiced:</span>
                    <span className="font-medium text-foreground">
                      ${parseFloat(String(selectedBillForPay.totalAmount || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Already Settled:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      ${parseFloat(String(selectedBillForPay.paidAmount || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
                    <span>Outstanding Due:</span>
                    <span className="text-primary font-bold">
                      ${calculateRemaining(selectedBillForPay).toFixed(2)}
                    </span>
                  </div>
                </div>

                {payError && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{payError}</span>
                  </div>
                )}

                {/* Amount to pay */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="payAmount" className="text-sm font-medium">
                      Payment Amount ($)
                    </Label>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(calculateRemaining(selectedBillForPay).toFixed(2))}
                      className="text-xs text-primary underline hover:opacity-80"
                    >
                      Pay Full (${calculateRemaining(selectedBillForPay).toFixed(2)})
                    </button>
                  </div>
                  <Input
                    id="payAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={calculateRemaining(selectedBillForPay)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    required
                  />
                </div>

                {/* Payment Method Selection: cash | credit_card | debit_card | insurance | bank_transfer | upi | online */}
                <div className="space-y-1.5">
                  <Label htmlFor="payMethod" className="text-sm font-medium">
                    Payment Method
                  </Label>
                  <Select
                    id="payMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    required
                  >
                    <option value="credit_card">💳 Credit Card</option>
                    <option value="debit_card">💳 Debit Card</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                    <option value="upi">📱 UPI Payment</option>
                    <option value="online">🌐 Online Payment</option>
                    <option value="cash">💵 Cash / Desk</option>
                    <option value="insurance">🛡️ Health Insurance Claim</option>
                  </Select>
                </div>

                {/* Reference Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="payRef" className="text-sm font-medium">
                    Transaction / Reference Number
                  </Label>
                  <Input
                    id="payRef"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. TXN-123456789"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Receipt reference for payment verification.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayDialogOpen(false)}
                disabled={paying}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={paying} className="bg-primary text-primary-foreground font-semibold">
                {paying ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing Payment...
                  </span>
                ) : (
                  `Pay $${parseFloat(paymentAmount || "0").toFixed(2)}`
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      {/* Invoice Details & Printable Modal Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Invoice Statement
            </DialogTitle>
            {selectedBillForInvoice && getStatusBadge(selectedBillForInvoice.status, isOverdue(selectedBillForInvoice))}
          </div>
          <DialogDescription>
            Official medical invoice and payment receipt statement.
          </DialogDescription>
        </DialogHeader>

        {selectedBillForInvoice && (
          <div className="space-y-6 pt-2">
            {/* Header / Hospital Details */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 text-base font-bold">
                  <Building2 className="h-5 w-5 text-primary" />
                  City General Hospital & Medical Center
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  123 Healthcare Blvd, Medical District
                </p>
                <p className="text-xs text-muted-foreground">
                  contact@hospitalcare.org | (555) 019-2834
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Invoice Number</p>
                <p className="text-sm font-mono font-bold">
                  {receiptDetails?.invoiceNumber || formatInvoiceId(selectedBillForInvoice.id)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Date Issued</p>
                <p className="text-xs font-medium">
                  {selectedBillForInvoice.createdAt ? new Date(selectedBillForInvoice.createdAt).toLocaleDateString() : "—"}
                </p>
              </div>
            </div>

            {/* Patient details if provided from /receipt */}
            {receiptDetails?.patient && (
              <div className="rounded-md bg-muted/20 p-2.5 text-xs grid grid-cols-2 gap-2 border border-border">
                <div>
                  <span className="text-muted-foreground">Billed To: </span>
                  <span className="font-semibold text-foreground">{receiptDetails.patient.name || "Patient"}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Contact: </span>
                  <span className="font-medium text-foreground">{receiptDetails.patient.email || receiptDetails.patient.mobile || "—"}</span>
                </div>
              </div>
            )}

            {/* Bill Context info */}
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Associated Care:</span>
                <span className="font-semibold text-foreground text-sm">
                  {selectedBillForInvoice.appointmentId
                    ? "Outpatient Medical Visit"
                    : selectedBillForInvoice.admissionId
                    ? "Inpatient Hospital Admission"
                    : "General Medical Services"}
                </span>
                {selectedBillForInvoice.appointmentId && (
                  <p className="text-muted-foreground mt-0.5">Appointment Ref: #{selectedBillForInvoice.appointmentId}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-muted-foreground block">Payment Due Date:</span>
                <span className={`font-semibold text-sm ${isOverdue(selectedBillForInvoice) ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                  {selectedBillForInvoice.dueDate ? new Date(selectedBillForInvoice.dueDate).toLocaleDateString() : "Upon Receipt"}
                </span>
                {isOverdue(selectedBillForInvoice) && (
                  <p className="text-red-600 text-[11px] font-medium">Payment Past Due</p>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Financial Breakdown
              </div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Services & Treatment Charges:</span>
                  <span className="font-medium">${parseFloat(String(selectedBillForInvoice.totalAmount || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Payments Received to Date:</span>
                  <span className="font-medium">-${parseFloat(String(selectedBillForInvoice.paidAmount || 0)).toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                  <span>Balance Remaining Due:</span>
                  <span className="text-primary font-bold">
                    ${calculateRemaining(selectedBillForInvoice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Log for this Invoice */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Transaction Receipts for this Invoice
              </h4>
              {(!selectedBillForInvoice.payments || selectedBillForInvoice.payments.length === 0) ? (
                <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                  No payments recorded for this invoice yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBillForInvoice.payments.map((pmt) => (
                    <div key={pmt.id} className="flex items-center justify-between p-2.5 rounded-md border border-border text-xs">
                      <div>
                        <div className="font-medium text-foreground">
                          {formatMethodName(pmt.paymentMethod)}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          Ref: {pmt.referenceNumber} • {new Date(pmt.paymentDate).toLocaleString()}
                        </div>
                      </div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ${parseFloat(String(pmt.amount || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 sm:justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => selectedBillForInvoice && downloadReport("billing", selectedBillForInvoice.id)}
              className="flex items-center gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
            >
              <FileDown className="h-4 w-4" />
              Download PDF Invoice
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInvoiceDialogOpen(false)}
            >
              Close
            </Button>
            {selectedBillForInvoice && selectedBillForInvoice.status !== "paid" && selectedBillForInvoice.status !== "cancelled" && calculateRemaining(selectedBillForInvoice) > 0 && (
              <Button
                size="sm"
                onClick={() => {
                  setInvoiceDialogOpen(false);
                  openPaymentModal(selectedBillForInvoice);
                }}
              >
                Pay Now
              </Button>
            )}
          </div>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
