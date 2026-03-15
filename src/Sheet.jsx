import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from "@mui/material";

const Sheet = () => {
  const { id } = useParams();
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [changes, setChanges] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const authToken = localStorage.getItem("token");

  const fetchSheetData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `http://localhost:3000/api/sheets/${id}/data`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      setColumns(response.data.columns || []);
      setData(response.data.data || []);
      setChanges({});
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load sheet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, [id]);

  const handleCellChange = (rowIndex, columnName, value) => {
    const key = `${rowIndex}-${columnName}`;
    setChanges((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getCellValue = (rowIndex, columnName) => {
    const key = `${rowIndex}-${columnName}`;
    return changes[key] !== undefined
      ? changes[key]
      : data[rowIndex]?.[columnName] || "";
  };

  const isCellChanged = (rowIndex, columnName) => {
    const key = `${rowIndex}-${columnName}`;
    return changes[key] !== undefined;
  };

  const handleSave = async () => {
    if (Object.keys(changes).length === 0) return;

    setSaving(true);
    const cellsToUpdate = Object.entries(changes).map(([key, value]) => {
      const [rowIndex, columnName] = key.split("-");
      return {
        row_index: parseInt(rowIndex),
        column_name: columnName,
        value,
      };
    });

    try {
      await axios.put(
        `http://localhost:3000/api/sheets/${id}/cells`,
        { cells: cellsToUpdate },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      await fetchSheetData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Sheet Data
      </Typography>

      <TableContainer component={Paper} variant="outlined" sx={{ width: "100%" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.name}
                  sx={{
                    fontWeight: 700,
                    p: 0.5,
                    minWidth: 140,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((col) => (
                  <TableCell
                    key={col.name}
                    sx={{ p: 0.5, minWidth: 140, verticalAlign: "top" }}
                  >
                    {col.canEdit ? (
                      <TextField
                        size="small"
                        fullWidth
                        variant="outlined"
                        value={getCellValue(rowIndex, col.name)}
                        onChange={(e) =>
                          handleCellChange(rowIndex, col.name, e.target.value)
                        }
                        InputProps={{
                          sx: {
                            fontSize: 13,
                            padding: "4px 8px",
                            backgroundColor: isCellChanged(rowIndex, col.name)
                              ? "#fff3cd"
                              : "transparent",
                          },
                        }}
                      />
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: 13,
                          p: 0.75,
                          backgroundColor: isCellChanged(rowIndex, col.name)
                            ? "#fff3cd"
                            : "transparent",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {getCellValue(rowIndex, col.name)}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || Object.keys(changes).length === 0}
          size="small"
        >
          {saving ? <CircularProgress size={20} /> : "Save Changes"}
        </Button>
      </Box>
    </Box>
  );
};

export default Sheet;
