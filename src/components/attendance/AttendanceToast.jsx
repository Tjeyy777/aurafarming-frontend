import { Snackbar, Alert, AlertTitle } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

export default function AttendanceToast({ open, onClose, type, message }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{ top: { xs: 16, sm: 24 } }}
    >
      <Alert
        onClose={onClose}
        severity={type}
        variant="filled"
        iconMapping={{
          success: <CheckCircleIcon fontSize="inherit" />,
          error:   <ErrorIcon fontSize="inherit" />,
        }}
        sx={{
          borderRadius: 2,
          minWidth: 320,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          fontWeight: 600,
        }}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>
          {type === "success" ? "Attendance Saved" : "Failed to Save"}
        </AlertTitle>
        {message}
      </Alert>
    </Snackbar>
  );
}