import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const drawerWidth = 240;

const MainLayout = ({ children }) => {
  return (
    <Box sx={{ display: "flex" }}>
      <Topbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 3,
          px: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
