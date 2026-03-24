import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
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
  Typography,
  Alert,
  Select,
  TextField,
  Menu,
  MenuItem,
  FormControl,
  Checkbox,
  ListItemText,
  IconButton,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

class SheetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Sheet render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            <strong>Something went wrong loading this page.</strong>
            <br />
            {this.state.error?.message}
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

const Sheet = () => {
  const { id } = useParams();
  const [sheetName, setSheetName] = useState("Sheet Data");
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [columnFilters, setColumnFilters] = useState({});
  const [filterMenu, setFilterMenu] = useState({
    anchorEl: null,
    column: null,
  });
  const [changes, setChanges] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newRowData, setNewRowData] = useState("{}");

  const { token, user } = useAuth();
  const navigate = useNavigate();

  const fetchSheetData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `http://localhost:3000/api/sheets/${id}/data`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const cols = response.data.columns || [];
      const rows = response.data.data || [];

      setSheetName(response.data.sheetName || "Sheet Data");
      setColumns(cols);
      setData(rows);
      setChanges({});
      updateFiltersForData(rows, cols);
      // Debug: Log columns and data
      console.log("[DEBUG] Columns from backend:", cols);
      console.log("[DEBUG] Data from backend:", rows);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load sheet data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSheet = async () => {
    if (!window.confirm("Delete this sheet? This will hide it from the UI."))
      return;

    try {
      await axios.delete(`http://localhost:3000/api/sheets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete sheet");
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchSheetData();
  }, [id, token]);

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

  const updateFiltersForData = (dataRows, cols) => {
    const options = {};
    const filterableCols = cols.filter((col) => col?.filterable);

    filterableCols.forEach((col) => {
      const colName = col?.name || col;
      const values = new Set();
      dataRows.forEach((row) => {
        const value = row[colName];
        if (value !== undefined && value !== null) {
          values.add(value.toString());
        }
      });
      options[colName] = Array.from(values).sort();
    });

    setFilterOptions(options);
    setColumnFilters((prev) => {
      const next = {};
      filterableCols.forEach((col) => {
        const colName = col?.name || col;
        next[colName] = prev[colName] ?? options[colName] ?? [];
      });
      // Debug: Log filter options and column filters
      console.log("[DEBUG] Filter options:", options);
      console.log("[DEBUG] Column filters:", next);
      return next;
    });
  };

  const handleFilterChange = (columnName, selected) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnName]: selected,
    }));
  };

  const openFilterMenu = (event, columnName) => {
    setFilterMenu({ anchorEl: event.currentTarget, column: columnName });
  };

  const closeFilterMenu = () => {
    setFilterMenu({ anchorEl: null, column: null });
  };

  const handleFilterToggle = (columnName, value) => {
    const current = columnFilters[columnName] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    handleFilterChange(columnName, next);
  };

  const handleSelectAll = (columnName) => {
    const options = filterOptions[columnName] || [];
    const selected = columnFilters[columnName] || [];
    const allSelected = selected.length === options.length;

    handleFilterChange(columnName, allSelected ? [] : [...options]);
  };

  const filteredData = data.filter((row, rowIdx) => {
    // Row-level access control: Non-admin users only see rows where their name appears in any column
    if ((user?.role || "").toUpperCase() !== "ADMIN") {
      const hasMatchingValue = Object.values(row).some(
        (val) => val && val.toString() === user.username,
      );
      console.log(
        `[FILTER DEBUG] Row ${rowIdx} check: hasMatchingValue=${hasMatchingValue}, user=${user.username}, rowValues=${JSON.stringify(row)}`,
      );
      if (!hasMatchingValue) {
        return false;
      }
    }

    return columns.every((col) => {
      const colName = col?.name || col;
      if (!col?.filterable) return true;

      const selected = columnFilters[colName] || [];
      if (!selected || selected.length === 0) return true;

      const value = row[colName] ?? "";
      const match = selected.includes(value.toString());
      // Debug output for filtering
      if (!match) {
        console.log(
          `[FILTER DEBUG] Row ${rowIdx} excluded for column '${colName}': value='${value}' selected=`,
          selected,
        );
      } else {
        console.log(
          `[FILTER DEBUG] Row ${rowIdx} included for column '${colName}': value='${value}' selected=`,
          selected,
        );
      }
      return match;
    });
  });

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
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      await fetchSheetData(); // Refresh data
      window.dispatchEvent(new Event("dashboard-refresh"));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAddColumnAndRow = async () => {
    if (!newColumnName.trim()) {
      setError("New column name is required");
      return;
    }

    let rowDataObj = {};
    try {
      rowDataObj = JSON.parse(newRowData);
      if (typeof rowDataObj !== "object" || Array.isArray(rowDataObj)) {
        throw new Error("Row data must be a JSON object");
      }
    } catch (parseError) {
      setError("rowData must be valid JSON object");
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `http://localhost:3000/api/sheets/${id}/admin/add-column-row`,
        { newColumnName: newColumnName.trim(), rowData: rowDataObj },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setNewColumnName("");
      setNewRowData("{}");
      await fetchSheetData();
      window.dispatchEvent(new Event("dashboard-refresh"));
    } catch (err) {
      console.error("Add column/row error", err);
      setError(err.response?.data?.error || "Failed to add column and row");
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
    <SheetErrorBoundary>
      <Box sx={{ width: "100%", mt: 2, px: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {sheetName}
          </Typography>
          {user?.role === "ADMIN" && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleDeleteSheet}
            >
              Delete
            </Button>
          )}
        </Box>

        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}
        >
          <Table size="small" sx={{ width: "100%" }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => {
                  const colName = col?.name || col;
                  return (
                    <TableCell
                      key={colName}
                      sx={{
                        fontWeight: 700,
                        fontSize: 12,
                        p: 0.5,
                        minWidth: 140,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        {colName}
                        {col.filterable && (
                          <IconButton
                            size="small"
                            onClick={(e) => openFilterMenu(e, colName)}
                            sx={{ p: 0, minWidth: 24, height: 24 }}
                          >
                            <FilterListIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} sx={{ py: 4 }}>
                    <Typography align="center" color="text.secondary">
                      No rows match the current filter or the sheet has no data.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, filteredIdx) => {
                  // Try to use a unique key for each row, fallback to index if not available
                  const rowKey =
                    row.id ||
                    row["NEMS ID"] ||
                    row["Project ID"] ||
                    Object.values(row).join("|") ||
                    filteredIdx;
                  // Find the index of this row in the original data array for correct cell/changes mapping
                  const originalIdx = data.findIndex((d) => {
                    if (row.id && d.id) return row.id === d.id;
                    if (row["NEMS ID"] && d["NEMS ID"])
                      return row["NEMS ID"] === d["NEMS ID"];
                    if (row["Project ID"] && d["Project ID"])
                      return row["Project ID"] === d["Project ID"];
                    return JSON.stringify(row) === JSON.stringify(d);
                  });
                  return (
                    <TableRow key={rowKey}>
                      {columns.map((col) => {
                        const colName = col?.name || col;
                        return (
                          <TableCell
                            key={colName}
                            sx={{ p: 0.5, verticalAlign: "top" }}
                          >
                            {col.canEdit ? (
                              col.datatype === "Dropdown" ? (
                                <FormControl
                                  fullWidth
                                  size="small"
                                  sx={{ m: 0 }}
                                >
                                  <Select
                                    displayEmpty
                                    value={
                                      getCellValue(originalIdx, colName) || ""
                                    }
                                    onChange={(e) =>
                                      handleCellChange(
                                        originalIdx,
                                        colName,
                                        e.target.value,
                                      )
                                    }
                                    renderValue={(selected) =>
                                      selected ? (
                                        selected
                                      ) : (
                                        <em style={{ color: "#6b7280" }}>
                                          Select
                                        </em>
                                      )
                                    }
                                    sx={{
                                      fontSize: 13,
                                      backgroundColor: isCellChanged(
                                        originalIdx,
                                        colName,
                                      )
                                        ? "#fff3cd"
                                        : "transparent",
                                      height: 36,
                                      "& .MuiSelect-select": {
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "6px 32px 6px 10px",
                                      },
                                    }}
                                  >
                                    <MenuItem disabled value="">
                                      <em>Select</em>
                                    </MenuItem>
                                    {(col.dropdownOptions || []).map(
                                      (option) => (
                                        <MenuItem key={option} value={option}>
                                          {option}
                                        </MenuItem>
                                      ),
                                    )}
                                  </Select>
                                </FormControl>
                              ) : (
                                <TextField
                                  size="small"
                                  fullWidth
                                  variant="outlined"
                                  type={
                                    col.datatype === "Number"
                                      ? "number"
                                      : "text"
                                  }
                                  placeholder={
                                    col.datatype === "Date"
                                      ? "dd-MMM-yy"
                                      : undefined
                                  }
                                  inputProps={
                                    col.datatype === "Date"
                                      ? { pattern: "\\d{2}-[A-Za-z]{3}-\\d{2}" }
                                      : undefined
                                  }
                                  value={getCellValue(originalIdx, colName)}
                                  onChange={(e) =>
                                    handleCellChange(
                                      originalIdx,
                                      colName,
                                      e.target.value,
                                    )
                                  }
                                  InputProps={{
                                    sx: {
                                      fontSize: 13,
                                      backgroundColor: isCellChanged(
                                        originalIdx,
                                        colName,
                                      )
                                        ? "#fff3cd"
                                        : "transparent",
                                    },
                                  }}
                                />
                              )
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: 13,
                                  p: 0.75,
                                  backgroundColor: isCellChanged(
                                    originalIdx,
                                    colName,
                                  )
                                    ? "#fff3cd"
                                    : "transparent",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {getCellValue(originalIdx, colName)}
                              </Typography>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Menu
          anchorEl={filterMenu.anchorEl}
          open={Boolean(filterMenu.anchorEl)}
          onClose={closeFilterMenu}
          MenuListProps={{ dense: true }}
        >
          {filterMenu.column && (
            <Box sx={{ minWidth: 220, maxHeight: 300, overflow: "auto" }}>
              <MenuItem
                onClick={() => handleSelectAll(filterMenu.column)}
                dense
              >
                <Checkbox
                  checked={
                    (columnFilters[filterMenu.column] || []).length ===
                    (filterOptions[filterMenu.column] || []).length
                  }
                />
                <ListItemText primary="Select all" />
              </MenuItem>
              {(filterOptions[filterMenu.column] || []).map((option) => (
                <MenuItem
                  key={option}
                  onClick={() => handleFilterToggle(filterMenu.column, option)}
                  dense
                >
                  <Checkbox
                    checked={(columnFilters[filterMenu.column] || []).includes(
                      option,
                    )}
                  />
                  <ListItemText primary={option} />
                </MenuItem>
              ))}
            </Box>
          )}
        </Menu>

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
    </SheetErrorBoundary>
  );
};

export default Sheet;
