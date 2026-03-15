import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Login from "./Login";
import MainLayout from "./MainLayout";
import Upload from "./Upload";
import Sheet from "./Sheet";
import Users from "./Users";

const theme = createTheme();

function App() {
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <div>Welcome to PMO Tracking</div>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Upload />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sheets/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Sheet />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Users />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
