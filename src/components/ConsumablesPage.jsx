import AddIcon from "@mui/icons-material/Add";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import EditIcon from "@mui/icons-material/Edit";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fab,
    Grid,
    MenuItem,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useConsumables } from "../hooks/useConsumables";

const categoryOptions = [
  "all",
  "drill_bit",
  "jackhammer_part",
  "iron_bar",
  "tool",
  "spare_part",
  "other",
];

const unitOptions = ["pieces", "kg", "meter"];
const statusOptions = ["active", "inactive"];

export default function ConsumablesPage() {
  const {
    items,
    lowStockItems,
    transactions,
    isLoading,
    fetchItemTransactions,
    addItem,
    updateItem,
    addTransaction,
  } = useConsumables();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [openItemDialog, setOpenItemDialog] = useState(false);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [detailsTab, setDetailsTab] = useState(0);
  const [error, setError] = useState("");

  const [itemForm, setItemForm] = useState({
    name: "",
    category: "",
    unit: "",
    currentStock: "",
    unitCost: "",
    lowStockLimit: "",
    status: "active",
  });

  const [transactionForm, setTransactionForm] = useState({
    itemId: "",
    type: "purchase",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
    reason: "",
    notes: "",
  });

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = category === "all" ? true : item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [items, search, category]);

  const handleOpenAddItem = () => {
    setEditingId(null);
    setError("");
    setItemForm({
      name: "",
      category: "",
      unit: "",
      currentStock: "",
      unitCost: "",
      lowStockLimit: "",
      status: "active",
    });
    setOpenItemDialog(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingId(item._id);
    setError("");
    setItemForm({
      name: item.name || "",
      category: item.category || "",
      unit: item.unit || "",
      currentStock: item.currentStock || "",
      unitCost: item.unitCost || "",
      lowStockLimit: item.lowStockLimit || "",
      status: item.status || "active",
    });
    setOpenItemDialog(true);
  };

  const handleCloseItemDialog = () => {
    setOpenItemDialog(false);
    setEditingId(null);
    setError("");
  };

  const handleSaveItem = async () => {
    if (
      !itemForm.name ||
      !itemForm.category ||
      !itemForm.unit ||
      itemForm.unitCost === "" ||
      itemForm.lowStockLimit === ""
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (!editingId && itemForm.currentStock === "") {
      setError("Initial stock is required.");
      return;
    }

    const payload = {
      name: itemForm.name,
      category: itemForm.category,
      unit: itemForm.unit,
      unitCost: Number(itemForm.unitCost),
      lowStockLimit: Number(itemForm.lowStockLimit),
      status: itemForm.status,
    };

    if (!editingId) {
      payload.currentStock = Number(itemForm.currentStock);
    }

    let res;
    if (editingId) {
      res = await updateItem(editingId, payload);
    } else {
      res = await addItem(payload);
    }

    if (res?.status === "error") {
      setError(res.message);
      return;
    }

    handleCloseItemDialog();
  };

  const handleViewItem = async (item) => {
    setSelectedItem(item);
    setDetailsTab(0);
    await fetchItemTransactions(item._id);
  };

  const handleOpenTransactionDialog = (item = null) => {
    setError("");
    setTransactionForm({
      itemId: item?._id || "",
      type: "purchase",
      quantity: "",
      date: new Date().toISOString().split("T")[0],
      reason: "",
      notes: "",
    });
    setOpenTransactionDialog(true);
  };

  const handleSaveTransaction = async () => {
    if (!transactionForm.itemId || !transactionForm.type || !transactionForm.quantity || !transactionForm.date) {
      setError("Please fill all required transaction fields.");
      return;
    }

    const payload = {
      ...transactionForm,
      quantity: Number(transactionForm.quantity),
    };

    const res = await addTransaction(payload);

    if (res?.status === "error") {
      setError(res.message);
      return;
    }

    if (selectedItem && selectedItem._id === payload.itemId) {
      await fetchItemTransactions(payload.itemId);
    }

    setOpenTransactionDialog(false);
    setError("");
  };

  const summary = useMemo(() => {
    if (!selectedItem) return null;

    const totalPurchased = transactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + Number(t.quantity), 0);

    const totalUsed = transactions
      .filter((t) => t.type === "usage")
      .reduce((sum, t) => sum + Number(t.quantity), 0);

    const totalPurchaseCost = transactions
      .filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + Number(t.cost || 0), 0);

    const totalUsageCost = transactions
      .filter((t) => t.type === "usage")
      .reduce((sum, t) => sum + Number(t.cost || 0), 0);

    const netAdjustments = transactions
      .filter((t) => t.type === "adjustment")
      .reduce((sum, t) => sum + Number(t.quantity), 0);

    return {
      totalPurchased,
      totalUsed,
      totalPurchaseCost,
      totalUsageCost,
      netAdjustments,
    };
  }, [transactions, selectedItem]);

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading Consumables Inventory...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, pb: 10 }}>
      {/* Header */}
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
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#22c55e" }}>
            Consumables Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track tools, drill bits, parts, stock usage and alerts
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddItem}
          sx={{ bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" } }}
        >
          Add Item
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Items</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                {items.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ border: lowStockItems.length ? "1px solid #ef4444" : undefined }}>
            <CardContent>
              <Typography color="text.secondary">Low Stock Alerts</Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  mt: 1,
                  color: lowStockItems.length ? "error.main" : "text.primary",
                }}
              >
                {lowStockItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Inventory Value</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                ₹{items.reduce((sum, item) => sum + item.currentStock * item.unitCost, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search + Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Search item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              {categoryOptions.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Cards */}
      <Grid container spacing={2}>
        {filteredItems.map((item) => {
          const isLow = item.currentStock <= item.lowStockLimit;

          return (
            <Grid item xs={12} sm={6} md={4} key={item._id}>
              <Card
                sx={{
                  border: "1px solid",
                  borderColor: isLow ? "error.main" : "divider",
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {item.name}
                      </Typography>
                      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                        <Chip label={item.category} size="small" sx={{ bgcolor: "#0ea5e9", color: "#fff" }} />
                        <Chip
                          label={item.status}
                          size="small"
                          color={item.status === "active" ? "success" : "default"}
                        />
                      </Stack>
                    </Box>
                    {isLow && <WarningAmberIcon color="error" />}
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    Current Stock
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: "bold",
                      color: isLow ? "error.main" : "#22c55e",
                    }}
                  >
                    {item.currentStock} <Typography component="span">{item.unit}</Typography>
                  </Typography>

                  <Typography sx={{ mt: 2 }}>Unit Cost: ₹{item.unitCost}</Typography>
                  <Typography color="text.secondary">Low Stock Limit: {item.lowStockLimit}</Typography>

                  {isLow && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      Low stock warning
                    </Alert>
                  )}

                  <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewItem(item)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenEditItem(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SwapHorizIcon />}
                      onClick={() => handleOpenTransactionDialog(item)}
                      sx={{ bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" } }}
                    >
                      Transaction
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredItems.length === 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <BuildCircleIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6">No consumable items found</Typography>
            <Typography color="text.secondary">Try changing search or add a new item</Typography>
          </CardContent>
        </Card>
      )}

      {/* Floating Add */}
      <Fab
        onClick={handleOpenAddItem}
        sx={{
          position: "fixed",
          right: 24,
          bottom: 24,
          display: { xs: "flex", md: "none" },
          bgcolor: "#0ea5e9",
          color: "#fff",
          "&:hover": { bgcolor: "#0284c7" },
        }}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Item Dialog */}
      <Dialog open={openItemDialog} onClose={handleCloseItemDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>
          {editingId ? "Edit Consumable Item" : "Add Consumable Item"}
        </DialogTitle>

        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Item Name"
            value={itemForm.name}
            onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
          />

          <TextField
            select
            label="Category"
            value={itemForm.category}
            onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
          >
            {categoryOptions
              .filter((c) => c !== "all")
              .map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
          </TextField>

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Unit"
              value={itemForm.unit}
              onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
            >
              {unitOptions.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>

            {!editingId && (
              <TextField
                label="Initial Stock"
                type="number"
                value={itemForm.currentStock}
                onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Unit Cost"
              type="number"
              value={itemForm.unitCost}
              onChange={(e) => setItemForm({ ...itemForm, unitCost: e.target.value })}
            />
            <TextField
              label="Low Stock Limit"
              type="number"
              value={itemForm.lowStockLimit}
              onChange={(e) => setItemForm({ ...itemForm, lowStockLimit: e.target.value })}
            />
          </Stack>

          <TextField
            select
            label="Status"
            value={itemForm.status}
            onChange={(e) => setItemForm({ ...itemForm, status: e.target.value })}
          >
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>

          {editingId && (
            <Alert severity="info">
              Stock cannot be edited directly. Use transactions to change stock.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseItemDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveItem}
            sx={{ bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" } }}
          >
            {editingId ? "Update Item" : "Save Item"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={openTransactionDialog} onClose={() => setOpenTransactionDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>Add Transaction</DialogTitle>

        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Select Item"
            value={transactionForm.itemId}
            onChange={(e) => setTransactionForm({ ...transactionForm, itemId: e.target.value })}
          >
            {items.map((item) => (
              <MenuItem key={item._id} value={item._id}>
                {item.name} ({item.currentStock} {item.unit})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Transaction Type"
            value={transactionForm.type}
            onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
          >
            <MenuItem value="purchase">Purchase</MenuItem>
            <MenuItem value="usage">Usage</MenuItem>
            <MenuItem value="adjustment">Adjustment</MenuItem>
          </TextField>

          <TextField
            label={transactionForm.type === "adjustment" ? "Quantity (+/-)" : "Quantity"}
            type="number"
            value={transactionForm.quantity}
            onChange={(e) => setTransactionForm({ ...transactionForm, quantity: e.target.value })}
          />

          <TextField
            type="date"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={transactionForm.date}
            onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
          />

          <TextField
            label="Reason"
            value={transactionForm.reason}
            onChange={(e) => setTransactionForm({ ...transactionForm, reason: e.target.value })}
          />

          <TextField
            label="Notes"
            multiline
            rows={3}
            value={transactionForm.notes}
            onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
          />

          <Alert
            severity={
              transactionForm.type === "purchase"
                ? "success"
                : transactionForm.type === "usage"
                ? "error"
                : "info"
            }
          >
            {transactionForm.type === "purchase" && "This will increase stock."}
            {transactionForm.type === "usage" && "This will reduce stock."}
            {transactionForm.type === "adjustment" && "Positive adds stock, negative reduces stock."}
          </Alert>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenTransactionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveTransaction}
            sx={{ bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" } }}
          >
            Save Transaction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onClose={() => setSelectedItem(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: "bold" }}>{selectedItem?.name}</DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Current Stock
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: "bold", color: "#22c55e" }}>
              {selectedItem?.currentStock} {selectedItem?.unit}
            </Typography>

            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
              <Chip label={selectedItem?.category} sx={{ bgcolor: "#0ea5e9", color: "#fff" }} />
              <Chip
                label={selectedItem?.status}
                color={selectedItem?.status === "active" ? "success" : "default"}
              />
              {selectedItem && selectedItem.currentStock <= selectedItem.lowStockLimit && (
                <Chip label="Low Stock" color="error" />
              )}
            </Stack>

            <Typography sx={{ mt: 2 }}>Unit Cost: ₹{selectedItem?.unitCost}</Typography>
            <Typography>Low Stock Limit: {selectedItem?.lowStockLimit}</Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Tabs value={detailsTab} onChange={(e, value) => setDetailsTab(value)} sx={{ mb: 2 }}>
            <Tab label="Transactions" />
            <Tab label="Summary" />
          </Tabs>

          {detailsTab === 0 && (
            <Stack spacing={2}>
              {transactions.length === 0 ? (
                <Alert severity="info">No transactions found for this item.</Alert>
              ) : (
                transactions.map((tx) => {
                  const qtyColor =
                    tx.type === "purchase"
                      ? "success.main"
                      : tx.type === "usage"
                      ? "error.main"
                      : "info.main";

                  const sign =
                    tx.type === "purchase"
                      ? "+"
                      : tx.type === "usage"
                      ? "-"
                      : Number(tx.quantity) >= 0
                      ? "+"
                      : "";

                  return (
                    <Card key={tx._id}>
                      <CardContent>
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(tx.date).toLocaleDateString()}
                            </Typography>
                            {tx.reason && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                Reason: {tx.reason}
                              </Typography>
                            )}
                            {tx.notes && (
                              <Typography variant="body2" color="text.secondary">
                                Notes: {tx.notes}
                              </Typography>
                            )}
                          </Box>

                          <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                            <Typography sx={{ color: qtyColor, fontWeight: "bold", fontSize: "1.2rem" }}>
                              {sign}
                              {tx.quantity}
                            </Typography>
                            <Typography variant="body2">₹{tx.cost}</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </Stack>
          )}

          {detailsTab === 1 && summary && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Total Purchased</Typography>
                    <Typography variant="h6">{summary.totalPurchased}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Total Used</Typography>
                    <Typography variant="h6">{summary.totalUsed}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Net Adjustments</Typography>
                    <Typography variant="h6">{summary.netAdjustments}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Current Stock</Typography>
                    <Typography variant="h6">
                      {selectedItem?.currentStock} {selectedItem?.unit}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Total Purchase Cost</Typography>
                    <Typography variant="h6">₹{summary.totalPurchaseCost}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Total Usage Cost</Typography>
                    <Typography variant="h6">₹{summary.totalUsageCost}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => handleOpenEditItem(selectedItem)}
          >
            Edit Item
          </Button>
          <Button
            variant="contained"
            startIcon={<SwapHorizIcon />}
            onClick={() => handleOpenTransactionDialog(selectedItem)}
            sx={{ bgcolor: "#0ea5e9", "&:hover": { bgcolor: "#0284c7" } }}
          >
            Add Transaction
          </Button>
          <Button onClick={() => setSelectedItem(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}