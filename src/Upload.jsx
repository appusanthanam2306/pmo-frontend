import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  Box,
  Button,
  CircularProgress,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import axios from "axios";

const steps = ["Upload file", "Configure columns", "Save data"];

const Upload = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [sheetName, setSheetName] = useState("");
  const [columnConfig, setColumnConfig] = useState([]);
  const [sheetId, setSheetId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { token } = useAuth();
  const [roles, setRoles] = useState([]);

  const loadRoles = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/sheets/roles",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setRoles(response.data.roles || []);
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Load roles once (for editable roles dropdown)
  useEffect(() => {
    loadRoles();
  }, []);

  const uploadFile = async () => {
    if (!file) {
      setError("Please select a CSV or XLSX file.");
      return;
    }
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/sheets/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setColumns(response.data.columns || []);
      setData(response.data.data || []);
      setColumnConfig(
        (response.data.columns || []).map((col) => ({
          name: col,
          editableRoles: roles.length > 0 ? [roles[0]] : ["ADMIN"],
        })),
      );
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConfigure = async () => {
    if (!sheetName) {
      setError("Please provide a sheet name.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/sheets/configure",
        {
          name: sheetName,
          columns: columnConfig,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSheetId(response.data.sheetId);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Configure failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveData = async () => {
    if (!sheetId) {
      setError("Sheet ID missing.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await axios.post(
        `http://localhost:3000/api/sheets/${sheetId}/data`,
        { data },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setSuccess("Sheet created and data saved successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Save data failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (colName, rolesSelected) => {
    setColumnConfig((prev) =>
      prev.map((col) =>
        col.name === colName ? { ...col, editableRoles: rolesSelected } : col,
      ),
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1">
              Upload a CSV or XLSX file
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderStyle: "dashed",
                borderColor: "divider",
                textAlign: "center",
              }}
            >
              <Typography sx={{ mb: 1 }}>
                Drag & drop a file here, or click to select one.
              </Typography>
              <Button component="label" variant="outlined">
                Choose file
                <input
                  type="file"
                  hidden
                  accept=",.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                />
              </Button>
              {file && (
                <Typography
                  sx={{ mt: 1 }}
                  variant="body2"
                  color="text.secondary"
                >
                  Selected: {file.name}
                </Typography>
              )}
            </Paper>
            <Button
              variant="contained"
              onClick={uploadFile}
              disabled={loading || !file}
              fullWidth
              size="large"
            >
              {loading ? <CircularProgress size={20} /> : "Upload"}
            </Button>
          </Box>
        );
      case 1:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Configure sheet
            </Typography>
            <TextField
              label="Sheet name"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              fullWidth
              size="small"
            />

            <Typography variant="body2" sx={{ mt: 1, mb: 0.5 }}>
              Set editable roles per column
            </Typography>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ maxWidth: 760, mx: "auto" }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Column</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Editable roles
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {columnConfig.map((col) => (
                    <TableRow key={col.name}>
                      <TableCell sx={{ width: 220, fontWeight: 600 }}>
                        {col.name}
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`roles-label-${col.name}`}>
                            Editable roles
                          </InputLabel>
                          <Select
                            labelId={`roles-label-${col.name}`}
                            multiple
                            value={col.editableRoles}
                            onChange={(e) =>
                              handleRoleChange(col.name, e.target.value)
                            }
                            input={<OutlinedInput label="Editable roles" />}
                            renderValue={(selected) => selected.join(", ")}
                          >
                            {roles.length === 0 ? (
                              <MenuItem disabled>
                                <ListItemText primary="Loading roles..." />
                              </MenuItem>
                            ) : (
                              roles.map((role) => (
                                <MenuItem key={role} value={role}>
                                  <Checkbox
                                    checked={col.editableRoles.includes(role)}
                                  />
                                  <ListItemText primary={role} />
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button
              variant="contained"
              onClick={handleConfigure}
              disabled={loading}
              size="small"
            >
              {loading ? <CircularProgress size={20} /> : "Create sheet"}
            </Button>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1">Save data</Typography>
            <Typography>
              Sheet ID: <strong>{sheetId}</strong>
            </Typography>
            <Typography>{`Parsed rows: ${data.length}`}</Typography>
            <Button
              variant="contained"
              onClick={handleSaveData}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Save data"}
            </Button>
            {success && <Alert severity="success">{success}</Alert>}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Upload & Configure Sheet
      </Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 2 }} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderStepContent()}
    </Paper>
  );
};

export default Upload;
