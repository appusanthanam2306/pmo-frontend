import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

const PlaceholderPage = ({ title }) => {
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizedRole = (user?.role || "").toUpperCase();

  useEffect(() => {
    const computeDashboard = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const sheetsRes = await axios.get("http://localhost:3000/api/sheets", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const sheets = sheetsRes.data.sheets || [];

        const pendingBySheet = [];
        let totalPending = 0;

        let dmPending = 0;
        let pmPending = 0;
        let irmPending = 0;
        const pmPendingByUser = {};

        const normalizedRole = (user.role || "").toUpperCase();
        const roleKeys = {
          PM: ["PM_ID", "PM ID", "PM"],
          DM: ["DM_ID", "DM ID", "DM"],
          IRM: ["IRM_ID", "IRM ID", "IRM"],
        };

        const roleFieldKeys = roleKeys[normalizedRole] || [];
        const userValues = [user.username, user.id?.toString()].filter(Boolean);

        for (const sheet of sheets) {
          const sheetDataRes = await axios.get(
            `http://localhost:3000/api/sheets/${sheet.id}/data`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          const rowData = sheetDataRes.data.data || [];

          const pendingRows = rowData.filter((row) => {
            const statusValue = (row.Status || row.status || "")
              .toString()
              .trim()
              .toLowerCase();
            const isPending = statusValue !== "completed";

            if (!isPending) {
              return false;
            }

            // Admin sees everything, others only matching role rows.
            if (normalizedRole !== "ADMIN") {
              const hasRoleMatch = roleFieldKeys.some((key) => {
                const v = row[key];
                return v != null && userValues.includes(v.toString());
              });
              return hasRoleMatch;
            }

            return true;
          });

          if (pendingRows.length > 0) {
            pendingBySheet.push({
              sheetId: sheet.id,
              sheetName: sheet.name,
              pending: pendingRows.length,
            });
            totalPending += pendingRows.length;
          }

          // Admin aggregates per-role and per-PM data from all pending rows
          if (normalizedRole === "ADMIN") {
            for (const row of pendingRows) {
              const dmId = row.DM_ID || row["DM ID"] || row.DM;
              const pmId = row.PM_ID || row["PM ID"] || row.PM;
              const irmId = row.IRM_ID || row["IRM ID"] || row.IRM;

              if (dmId) dmPending += 1;
              if (pmId) {
                pmPending += 1;
                const pmKey = pmId.toString();
                pmPendingByUser[pmKey] = (pmPendingByUser[pmKey] || 0) + 1;
              }
              if (irmId) irmPending += 1;
            }
          }
        }

        setDashboard({
          totalPending,
          pendingBySheet,
          dmPending,
          pmPending,
          irmPending,
          pmPendingByUser,
        });
      } catch (err) {
        console.error("Dashboard load error", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    computeDashboard();
  }, [token, user]);

  if (loading) {
    return (
      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
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
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title} Dashboard
      </Typography>
      <Typography variant="h6" gutterBottom>
        Role: {user?.role || "Unknown"}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Total pending items: {dashboard?.totalPending ?? 0}
      </Typography>

      {normalizedRole === "ADMIN" && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2">
            DM pending: {dashboard?.dmPending ?? 0}
          </Typography>
          <Typography variant="body2">
            PM pending: {dashboard?.pmPending ?? 0}
          </Typography>
          <Typography variant="body2">
            IRM pending: {dashboard?.irmPending ?? 0}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
            PM pending by user:
          </Typography>
          {Object.entries(dashboard?.pmPendingByUser || {}).map(
            ([pm, value]) => (
              <Typography key={pm} variant="body2">
                {pm}: {value}
              </Typography>
            ),
          )}
        </Box>
      )}

      {dashboard?.pendingBySheet?.length ? (
        dashboard.pendingBySheet.map((sheetMetric) => (
          <Box
            key={sheetMetric.sheetId}
            sx={{ mb: 1, p: 1, border: "1px solid #ddd", borderRadius: 1 }}
          >
            <Typography variant="subtitle1">{sheetMetric.sheetName}</Typography>
            <Typography variant="body2">
              Pending rows: {sheetMetric.pending}
            </Typography>
          </Box>
        ))
      ) : (
        <Typography>No pending data for your role.</Typography>
      )}
    </Box>
  );
};

export default PlaceholderPage;
