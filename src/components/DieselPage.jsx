import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
    Fab,
    Grid,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useDiesel } from "../hooks/useDiesel";

const dieselTypeOptions = ["all", "machine", "other"];

const formatLabel = (value = "") =>
  value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function DieselPage() {
  const {
    entries,
    ownedMachines,
    selectedEntry,
    isLoading,
    fetchDieselEntries,
    fetchSingleDieselEntry,
    addDieselEntry,
    updateDieselEntry,
    deleteDieselEntry,
    setSelectedEntry,
  } = useDiesel();

  const [search, setSearch] = useState("");
  const [filterDieselType, setFilterDieselType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterMachine, setFilterMachine] = useState("");

  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openReportsDialog, setOpenReportsDialog] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    dieselFor: "machine",
    machineId: "",
    expenseName: "",
    date: new Date().toISOString().split("T")[0],
    litres: "",
    pricePerLitre: "",
    notes: "",
  });

  useEffect(() => {
    const params = {};
    if (filterDieselType !== "all") params.dieselFor = filterDieselType;
    if (filterDate) params.date = filterDate;
    if (filterMachine) params.machineId = filterMachine;
    fetchDieselEntries(params);
  }, [filterDieselType, filterDate, filterMachine]);

  const totalCostPreview = useMemo(() => {
    return Number(formData.litres || 0) * Number(formData.pricePerLitre || 0);
  }, [formData.litres, formData.pricePerLitre]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const displayName =
        entry.dieselFor === "machine"
          ? entry.machineId?.machineName || ""
          : entry.expenseName || "";

      return displayName.toLowerCase().includes(search.toLowerCase());
    });
  }, [entries, search]);

  const dashboardSummary = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    const todayEntries = entries.filter(
      (entry) => new Date(entry.date).toISOString().split("T")[0] === today
    );

    return {
      totalDieselToday: todayEntries.reduce((sum, e) => sum + Number(e.litres || 0), 0),
      totalDieselCostToday: todayEntries.reduce((sum, e) => sum + Number(e.totalCost || 0), 0),
      totalEntriesToday: todayEntries.length,
      machineDieselCostToday: todayEntries
        .filter((e) => e.dieselFor === "machine")
        .reduce((sum, e) => sum + Number(e.totalCost || 0), 0),
      otherDieselCostToday: todayEntries
        .filter((e) => e.dieselFor === "other")
        .reduce((sum, e) => sum + Number(e.totalCost || 0), 0),
    };
  }, [entries]);

  const reportData = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date).toISOString().split("T")[0];

      const dieselTypeMatch =
        filterDieselType === "all" ? true : entry.dieselFor === filterDieselType;

      const machineMatch = filterMachine
        ? (entry.machineId?._id || entry.machineId) === filterMachine
        : true;

      const dateMatch = filterDate ? entryDate === filterDate : true;

      return dieselTypeMatch && machineMatch && dateMatch;
    });
  }, [entries, filterDieselType, filterMachine, filterDate]);

  const reportSummary = useMemo(() => {
    const totalLitres = reportData.reduce((sum, e) => sum + Number(e.litres || 0), 0);
    const totalCost = reportData.reduce((sum, e) => sum + Number(e.totalCost || 0), 0);
    const machineDieselCost = reportData
      .filter((e) => e.dieselFor === "machine")
      .reduce((sum, e) => sum + Number(e.totalCost || 0), 0);
    const otherDieselCost = reportData
      .filter((e) => e.dieselFor === "other")
      .reduce((sum, e) => sum + Number(e.totalCost || 0), 0);

    return {
      totalLitres,
      totalCost,
      machineDieselCost,
      otherDieselCost,
      totalEntries: reportData.length,
    };
  }, [reportData]);

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setError("");
    setFormData({
      dieselFor: "machine",
      machineId: "",
      expenseName: "",
      date: new Date().toISOString().split("T")[0],
      litres: "",
      pricePerLitre: "",
      notes: "",
    });
    setOpenFormDialog(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setError("");
    setFormData({
      dieselFor: entry.dieselFor || "machine",
      machineId: entry.machineId?._id || "",
      expenseName: entry.expenseName || "",
      date: new Date(entry.date).toISOString().split("T")[0],
      litres: entry.litres || "",
      pricePerLitre: entry.pricePerLitre || "",
      notes: entry.notes || "",
    });
    setOpenFormDialog(true);
  };

  const handleSave = async () => {
    if (!formData.date) {
      setError("Date is required.");
      return;
    }

    if (!formData.litres || Number(formData.litres) <= 0) {
      setError("Litres must be greater than 0.");
      return;
    }

    if (formData.pricePerLitre === "" || Number(formData.pricePerLitre) < 0) {
      setError("Price per litre must be valid.");
      return;
    }

    if (formData.dieselFor === "machine" && !formData.machineId) {
      setError("Machine is required for machine diesel entry.");
      return;
    }

    if (formData.dieselFor === "other" && !formData.expenseName.trim()) {
      setError("Expense name is required for other diesel expense.");
      return;
    }

    const payload = {
      dieselFor: formData.dieselFor,
      machineId: formData.dieselFor === "machine" ? formData.machineId : null,
      expenseName: formData.dieselFor === "other" ? formData.expenseName : "",
      date: formData.date,
      litres: Number(formData.litres),
      pricePerLitre: Number(formData.pricePerLitre),
      notes: formData.notes,
    };

    const res = editingEntry
      ? await updateDieselEntry(editingEntry._id, payload)
      : await addDieselEntry(payload);

    if (res?.status === "error") {
      setError(res.message);
      return;
    }

    setOpenFormDialog(false);
    setEditingEntry(null);
    setError("");
  };

  const handleDelete = async () => {
    if (!selectedEntry?._id) return;

    const res = await deleteDieselEntry(selectedEntry._id);

    if (res?.status === "error") {
      setError(res.message);
      return;
    }

    setOpenDeleteDialog(false);
    setSelectedEntry(null);
    setError("");
  };

  const handleView = async (entry) => {
    await fetchSingleDieselEntry(entry._id);
    setOpenDetailDialog(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading Diesel Management...</Typography>
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
            Diesel Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track machine diesel and other diesel expenses
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<ReceiptLongIcon />} onClick={() => setOpenReportsDialog(true)}>
            Reports
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
            Add Diesel Entry
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Diesel Today</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                {dashboardSummary.totalDieselToday} L
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Diesel Cost Today</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                ₹{dashboardSummary.totalDieselCostToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Entries Today</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                {dashboardSummary.totalEntriesToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Machine Diesel Cost Today</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                ₹{dashboardSummary.machineDieselCostToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Other Diesel Cost Today</Typography>
              <Typography variant="h5" sx={{ fontWeight: "bold", mt: 1 }}>
                ₹{dashboardSummary.otherDieselCostToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Search machine or expense"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Diesel Type"
                value={filterDieselType}
                onChange={(e) => setFilterDieselType(e.target.value)}
                fullWidth
              >
                {dieselTypeOptions.map((type) => (
                  <MenuItem key={type} value={type}>
                    {formatLabel(type)}
                  </MenuItem>
                ))}
              </TextField>
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

            <Grid item xs={12} md={3}>
              <TextField
                select
                label="Filter by machine"
                value={filterMachine}
                onChange={(e) => setFilterMachine(e.target.value)}
                fullWidth
              >
                <MenuItem value="">All Machines</MenuItem>
                {ownedMachines.map((machine) => (
                  <MenuItem key={machine._id} value={machine._id}>
                    {machine.machineName} ({machine.machineCode})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {filteredEntries.map((entry) => (
          <Grid item xs={12} md={6} lg={4} key={entry._id}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>
                      {new Date(entry.date).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={entry.dieselFor === "machine" ? "Machine" : "Other Expense"}
                    color={entry.dieselFor === "machine" ? "primary" : "default"}
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary">
                  Diesel For
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {entry.dieselFor === "machine"
                    ? entry.machineId?.machineName || "Machine"
                    : entry.expenseName}
                </Typography>

                {entry.dieselFor === "machine" && (
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {entry.machineId?.machineCode || ""}
                  </Typography>
                )}

                <Typography>Litres: {entry.litres}</Typography>
                <Typography>Price / Litre: ₹{entry.pricePerLitre}</Typography>
                <Typography sx={{ fontWeight: 700, color: "primary.main", mt: 1 }}>
                  Total Cost: ₹{entry.totalCost}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {entry.notes || "No notes"}
                </Typography>

                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                  <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleView(entry)}>
                    View
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenEdit(entry)}>
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedEntry(entry);
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

      {filteredEntries.length === 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <LocalGasStationIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6">No diesel entries found</Typography>
            <Typography color="text.secondary">Try changing filters or add a new entry</Typography>
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
          {editingEntry ? "Edit Diesel Entry" : "Add Diesel Entry"}
        </DialogTitle>

        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Diesel For"
            value={formData.dieselFor}
            onChange={(e) =>
              setFormData({
                ...formData,
                dieselFor: e.target.value,
                machineId: "",
                expenseName: "",
              })
            }
          >
            <MenuItem value="machine">Machine</MenuItem>
            <MenuItem value="other">Other Expense</MenuItem>
          </TextField>

          <TextField
            type="date"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          {formData.dieselFor === "machine" ? (
            <TextField
              select
              label="Select Owned Machine"
              value={formData.machineId}
              onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
            >
              {ownedMachines.map((machine) => (
                <MenuItem key={machine._id} value={machine._id}>
                  {machine.machineName} ({machine.machineCode})
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              label="Expense Name"
              value={formData.expenseName}
              onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
            />
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Litres"
                type="number"
                value={formData.litres}
                onChange={(e) => setFormData({ ...formData, litres: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Price Per Litre"
                type="number"
                value={formData.pricePerLitre}
                onChange={(e) => setFormData({ ...formData, pricePerLitre: e.target.value })}
              />
            </Grid>
          </Grid>

          <TextField
            label="Total Cost"
            value={totalCostPreview}
            InputProps={{ readOnly: true }}
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
            {editingEntry ? "Update Entry" : "Save Entry"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: "bold", color: "error.main" }}>
          Delete Diesel Entry
        </DialogTitle>

        <DialogContent dividers>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this diesel entry? This action cannot be undone.
          </Typography>

          <Stack spacing={1}>
            <Typography><strong>Date:</strong> {selectedEntry?.date ? new Date(selectedEntry.date).toLocaleDateString() : ""}</Typography>
            <Typography><strong>Diesel For:</strong> {selectedEntry?.dieselFor === "machine" ? "Machine" : "Other Expense"}</Typography>
            <Typography>
              <strong>Name:</strong>{" "}
              {selectedEntry?.dieselFor === "machine"
                ? selectedEntry?.machineId?.machineName
                : selectedEntry?.expenseName}
            </Typography>
            <Typography><strong>Litres:</strong> {selectedEntry?.litres}</Typography>
            <Typography><strong>Total Cost:</strong> ₹{selectedEntry?.totalCost}</Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete Entry
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>Diesel Entry Details</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography><strong>Date:</strong> {selectedEntry?.date ? new Date(selectedEntry.date).toLocaleDateString() : ""}</Typography>
            <Typography><strong>Diesel For:</strong> {selectedEntry?.dieselFor === "machine" ? "Machine" : "Other Expense"}</Typography>
            <Typography>
              <strong>Name:</strong>{" "}
              {selectedEntry?.dieselFor === "machine"
                ? selectedEntry?.machineId?.machineName
                : selectedEntry?.expenseName}
            </Typography>
            {selectedEntry?.dieselFor === "machine" && (
              <Typography><strong>Machine Code:</strong> {selectedEntry?.machineId?.machineCode}</Typography>
            )}
            <Typography><strong>Litres:</strong> {selectedEntry?.litres}</Typography>
            <Typography><strong>Price Per Litre:</strong> ₹{selectedEntry?.pricePerLitre}</Typography>
            <Typography><strong>Total Cost:</strong> ₹{selectedEntry?.totalCost}</Typography>
            <Typography><strong>Notes:</strong> {selectedEntry?.notes || "—"}</Typography>
            <Typography><strong>Created At:</strong> {selectedEntry?.createdAt ? new Date(selectedEntry.createdAt).toLocaleString() : ""}</Typography>
            <Typography><strong>Updated At:</strong> {selectedEntry?.updatedAt ? new Date(selectedEntry.updatedAt).toLocaleString() : ""}</Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              setOpenDetailDialog(false);
              handleOpenEdit(selectedEntry);
            }}
          >
            Edit Entry
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
            Delete Entry
          </Button>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReportsDialog} onClose={() => setOpenReportsDialog(false)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ fontWeight: "bold" }}>Diesel Reports</DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Total Litres</Typography>
                  <Typography variant="h6">{reportSummary.totalLitres}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Total Diesel Cost</Typography>
                  <Typography variant="h6">₹{reportSummary.totalCost}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Machine Diesel Cost</Typography>
                  <Typography variant="h6">₹{reportSummary.machineDieselCost}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Other Diesel Cost</Typography>
                  <Typography variant="h6">₹{reportSummary.otherDieselCost}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Number of Entries</Typography>
                  <Typography variant="h6">{reportSummary.totalEntries}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Stack spacing={2}>
            {reportData.length === 0 ? (
              <Alert severity="info">No report data found.</Alert>
            ) : (
              reportData.map((entry) => (
                <Card key={entry._id}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={2}>
                        <Typography color="text.secondary">Date</Typography>
                        <Typography>{new Date(entry.date).toLocaleDateString()}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography color="text.secondary">Diesel For</Typography>
                        <Typography>{entry.dieselFor === "machine" ? "Machine" : "Other Expense"}</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography color="text.secondary">Name</Typography>
                        <Typography>
                          {entry.dieselFor === "machine"
                            ? entry.machineId?.machineName
                            : entry.expenseName}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={1.5}>
                        <Typography color="text.secondary">Litres</Typography>
                        <Typography>{entry.litres}</Typography>
                      </Grid>
                      <Grid item xs={6} md={1.5}>
                        <Typography color="text.secondary">Price/Litre</Typography>
                        <Typography>₹{entry.pricePerLitre}</Typography>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Typography color="text.secondary">Total Cost</Typography>
                        <Typography sx={{ fontWeight: 700 }}>₹{entry.totalCost}</Typography>
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