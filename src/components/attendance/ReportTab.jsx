import { useState } from "react";
import { Box, Button, Select, MenuItem } from "@mui/material";

export default function ReportsTab({ employees }) {
  const [emp, setEmp] = useState("");

  return (
    <Box>
      <Select value={emp} onChange={(e) => setEmp(e.target.value)}>
        {employees.map(e => (
          <MenuItem key={e._id} value={e._id}>
            {e.name}
          </MenuItem>
        ))}
      </Select>

      <Button sx={{ ml: 2 }} variant="contained">
        Load Report
      </Button>
    </Box>
  );
}