import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";

const Topbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    setAnchorEl(null);
    navigate("/login");
  };

  const userInitials =
    user?.name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  return (
    <AppBar
      position="fixed"
      elevation={1}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ minHeight: 56, px: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            PMO Tracking
          </Typography>
          {user?.name && (
            <Typography variant="body2" color="text.secondary">
              {user.name}
            </Typography>
          )}
        </Box>

        <IconButton onClick={handleAvatarClick} size="medium">
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            {userInitials}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
