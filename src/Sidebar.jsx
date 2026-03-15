import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";

const drawerWidth = 200;

const Sidebar = () => {
  const [sheets, setSheets] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchSheets();
    }
  }, []);

  const fetchSheets = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/sheets");
      setSheets(response.data.sheets);
    } catch (error) {
      console.error("Error fetching sheets:", error);
    }
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Navigation</Typography>
      </Box>
      <Divider />
      <List dense>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/upload")}>
            <ListItemText primary="Upload" />
          </ListItemButton>
        </ListItem>

        <ListItem>
          <ListItemText
            primary="Sheets"
            primaryTypographyProps={{ variant: "subtitle2" }}
          />
        </ListItem>
        {sheets.map((sheet) => (
          <ListItem key={sheet.id} disablePadding>
            <ListItemButton
              onClick={() => navigate(`/sheets/${sheet.id}`)}
              sx={{ pl: 4 }}
            >
              <ListItemText
                primary={sheet.name}
                primaryTypographyProps={{ variant: "body2" }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {user && user.role === "ADMIN" && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={() => navigate("/users")}>
                <ListItemText primary="Users" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;
