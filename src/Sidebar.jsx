import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Collapse from "@mui/material/Collapse";
import HomeIcon from "@mui/icons-material/Home";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import StorageIcon from "@mui/icons-material/Storage";
import FolderIcon from "@mui/icons-material/Folder";
import GroupIcon from "@mui/icons-material/Group";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const drawerWidth = 240;

const Sidebar = () => {
  const [sheets, setSheets] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const [sheetsOpen, setSheetsOpen] = useState(true);

  const isActive = (path) => location.pathname === path;
  const isActiveStartsWith = (path) => location.pathname.startsWith(path);

  const fetchSheets = async () => {
    console.log("Sidebar: fetchSheets called", { token });
    try {
      const response = await axios.get("http://localhost:3000/api/sheets");
      setSheets(response.data.sheets);
    } catch (error) {
      console.error("Error fetching sheets:", error);
    }
  };

  useEffect(() => {
    // Ensure the Sheets section is expanded when the user is on a sheet.
    if (isActiveStartsWith("/sheets")) {
      setSheetsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    console.log("Sidebar token effect", { token });
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchSheets();
    }
  }, [token]);

  const menuItems = useMemo(
    () => [
      {
        key: "home",
        label: "Home",
        icon: <HomeIcon fontSize="small" />,
        path: "/",
      },
      ...(user?.role === "ADMIN"
        ? [
            {
              key: "upload",
              label: "Upload",
              icon: <UploadFileIcon fontSize="small" />,
              path: "/upload",
            },
          ]
        : []),
      {
        key: "sheets",
        label: "Sheets",
        icon: <StorageIcon fontSize="small" />,
      },
      {
        key: "users",
        label: "Users",
        icon: <GroupIcon fontSize="small" />,
        path: "/users",
        adminOnly: true,
      },
    ],
    [user?.role],
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          columnGap: 1,
          px: 2,
          py: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DashboardCustomizeIcon color="primary" fontSize="small" />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          PMO Tracking
        </Typography>
      </Box>

      <List dense disablePadding>
        {menuItems.map((item) => {
          if (item.adminOnly && user?.role !== "ADMIN") {
            return null;
          }

          if (item.key === "sheets") {
            const parentSelected = isActiveStartsWith("/sheets");

            return (
              <Box key={item.key}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => setSheetsOpen((prev) => !prev)}
                    selected={parentSelected}
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderRadius: 1,
                      mx: 1,
                      mt: 1,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                    {sheetsOpen ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={sheetsOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {sheets.map((sheet) => (
                      <ListItem disablePadding key={sheet.id}>
                        <ListItemButton
                          onClick={() => navigate(`/sheets/${sheet.id}`)}
                          selected={isActiveStartsWith(`/sheets/${sheet.id}`)}
                          sx={{
                            pl: 6,
                            py: 1,
                            borderRadius: 1,
                            mx: 1,
                            mt: 0.5,
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                            <FolderIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={sheet.name}
                            primaryTypographyProps={{ variant: "body2" }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          }

          return (
            <ListItem disablePadding key={item.key}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive(item.path)}
                sx={{
                  px: 2,
                  py: 1.25,
                  borderRadius: 1,
                  mx: 1,
                  mt: 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
