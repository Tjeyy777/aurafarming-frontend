import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    Grid,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useExpenses } from "../hooks/useExpenses";

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function ExpensesPage() {
  const {
    expenses,
    summary,
    selectedExpense,
    isLoading,
    fetchExpenses,
    fetchSingleExpense,
    fetchExpenseSummary,
    addExpense,
    updateExpense,
    deleteExpense,
    setSelectedExpense,
  } = useExpenses();

  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openReportsDialog, setOpenReportsDialog] = useState(false);

  const [editingExpense, setEditingExpense] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    expenseName: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    const params = {};
    if (filterDate) params.date = filterDate;
    if (filterStartDate && filterEndDate) {
      params.startDate = filterStartDate;
      params.endDate = filterEndDate;
    }

    fetchExpenses(params);
    fetchExpenseSummary(params);
  }, [filterDate, filterStartDate, filterEndDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) =>
      expense.expenseName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [expenses, search]);

  const dashboardSummary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const todayExpenses = expenses.filter(
      (expense) => new Date(expense.date).toISOString().split("T")[0] === today
    );

    const monthExpenses = expenses.filter((expense) => {
      const d = new Date(expense.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalToday = todayExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

    const totalMonth = monthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0
    );

    const totalEntriesToday = todayExpenses.length;

    const averageExpense =
      expenses.length > 0
        ? expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) /
          expenses.length
        : 0;

    return {
      totalToday,
      totalMonth,
      totalEntriesToday,
      averageExpense,
    };
  }, [expenses]);

  const reportSummary = useMemo(() => {
    const totalExpenseAmount = summary?.overview?.totalExpenseAmount || 0;
    const totalEntries = summary?.overview?.totalExpenseEntries || 0;
    const averageExpense = totalEntries ? totalExpenseAmount / totalEntries : 0;

    return {
      totalExpenseAmount,
      totalEntries,
      averageExpense,
    };
  }, [summary]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setError("");
    setFormData({
      date: new Date().toISOString().split("T")[0],
      expenseName: "",
      amount: "",
      notes: "",
    });
    setOpenFormDialog(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setError("");
    setFormData({
      date: new Date(expense.date).toISOString().split("T")[0],
      expenseName: expense.expenseName || "",
      amount: expense.amount || "",
      notes: expense.notes || "",
    });
    setOpenFormDialog(true);
  };

  const handleSave = async () => {
    if (!formData.date) {
      setError("Date is required.");
      return;
    }

    if (!formData.expenseName.trim()) {
      setError("Expense name is required.");
      return;
    }

    if (formData.amount === "" || Number(formData.amount) < 0) {
      setError("Amount must be a valid positive number.");
      return;
    }

    const payload = {
      date: formData.date,
      expenseName: formData.expenseName.trim(),
      amount: Number(formData.amount),
      notes: formData.notes,
    };

    const res = editingExpense
      ? await updateExpense(editingExpense._id, payload)
      : await addExpense(payload);

    if (res?.status === "error") {
      setError(res.message);
      return;
    }

    setOpenFormDialog(false);
    setEditingExpense(null);
    setError("");
  };

  const handleView = async (expense) => {
    await fetchSingleExpense(expense._id);
    setOpenDetailDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedExpense?._id) return;

    const res = await deleteExpense(selectedExpense._id);

    if (res?.status === "error") {
      setError(res.message);
      return;
    }

    setOpenDeleteDialog(false);
    setSelectedExpense(null);
    setError("");
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading Expenses Management...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pb: 10 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "primary.main" }}>
            Expenses Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track daily site and office miscellaneous expenses
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ReceiptLongIcon />} onClick={() => setOpenReportsDialog(true)}>
            Reports
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Add Expense
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Expenses Today</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                ₹{dashboardSummary.totalToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total This Month</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                ₹{dashboardSummary.totalMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Entries Today</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                {dashboardSummary.totalEntriesToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Average / Entry</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                ₹{dashboardSummary.averageExpense.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Search by expense name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Filter by date"
                InputLabelProps={{ shrink: true }}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={2.5}>
              <TextField
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={2.5}>
              <TextField
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {filteredExpenses.map((expense) => (
          <Grid item xs={12} md={6} lg={4} key={expense._id}>
            <Card
              sx={{
                border:
                  Number(expense.amount) > 5000 ? "1px solid rgba(245, 158, 11, 0.6)" : undefined,
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      {new Date(expense.date).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Stack>

                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {expense.expenseName}
                </Typography>

                <Typography sx={{ fontWeight: 700, color: "primary.main", mt: 1 }}>
                  ₹{expense.amount}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {expense.notes || "No notes"}
                </Typography>

                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                  <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleView(expense)}>
                    View
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenEdit(expense)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedExpense(expense);
                      setOpenDeleteDialog(true);
                    }}
                  >
                    Delete
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredExpenses.length === 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6">No expenses found</Typography>
            <Typography color="text.secondary">
              Try changing filters or add a new expense
            </Typography>
          </CardContent>
        </Card>
      )}

      <Fab
        color="primary"
        sx={{ position: "fixed", right: 24, bottom: 24, display: { xs: "flex", md: "none" } }}
        onClick={handleOpenAdd}
      >
        <AddIcon />
      </Fab>

      <Dialog open={openFormDialog} onClose={() => setOpenFormDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {editingExpense ? "Edit Expense" : "Add Expense"}
        </DialogTitle>

        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            type="date"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <TextField
            label="Expense Name"
            value={formData.expenseName}
            onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
          />

          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />

          <TextField
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenFormDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingExpense ? "Update Expense" : "Save Expense"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>Expense Details</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography><strong>Date:</strong> {selectedExpense?.date ? new Date(selectedExpense.date).toLocaleDateString() : ""}</Typography>
            <Typography><strong>Expense Name:</strong> {selectedExpense?.expenseName}</Typography>
            <Typography><strong>Amount:</strong> ₹{selectedExpense?.amount}</Typography>
            <Typography><strong>Notes:</strong> {selectedExpense?.notes || "—"}</Typography>
            <Typography><strong>Created At:</strong> {selectedExpense?.createdAt ? new Date(selectedExpense.createdAt).toLocaleString() : ""}</Typography>
            <Typography><strong>Updated At:</strong> {selectedExpense?.updatedAt ? new Date(selectedExpense.updatedAt).toLocaleString() : ""}</Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              setOpenDetailDialog(false);
              handleOpenEdit(selectedExpense);
            }}
          >
            Edit Expense
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteIcon />}
            onClick={() => {
              setOpenDetailDialog(false);
              setOpenDeleteDialog(true);
            }}
          >
            Delete Expense
          </Button>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", color: "error.main" }}>
          Delete Expense
        </DialogTitle>

        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this expense entry? This action cannot be undone.
          </Typography>

          <Stack spacing={1}>
            <Typography><strong>Date:</strong> {selectedExpense?.date ? new Date(selectedExpense.date).toLocaleDateString() : ""}</Typography>
            <Typography><strong>Expense Name:</strong> {selectedExpense?.expenseName}</Typography>
            <Typography><strong>Amount:</strong> ₹{selectedExpense?.amount}</Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete Expense
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReportsDialog} onClose={() => setOpenReportsDialog(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: "bold" }}>Expense Reports</DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Total Expense Amount</Typography>
                  <Typography variant="h6">₹{reportSummary.totalExpenseAmount}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Total Entries</Typography>
                  <Typography variant="h6">{reportSummary.totalEntries}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Average / Entry</Typography>
                  <Typography variant="h6">₹{reportSummary.averageExpense.toFixed(2)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Stack spacing={2}>
            {filteredExpenses.length === 0 ? (
              <Alert severity="info">No report data found.</Alert>
            ) : (
              filteredExpenses.map((expense) => (
                <Card key={expense._id}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={2}>
                        <Typography color="text.secondary">Date</Typography>
                        <Typography>{new Date(expense.date).toLocaleDateString()}</Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography color="text.secondary">Expense Name</Typography>
                        <Typography>{expense.expenseName}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary">Amount</Typography>
                        <Typography sx={{ fontWeight: 700 }}>₹{expense.amount}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary">Notes</Typography>
                        <Typography>{expense.notes || "—"}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined">Export PDF</Button>
          <Button variant="outlined">Export Excel</Button>
          <Button onClick={() => setOpenReportsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}