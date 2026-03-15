import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./Login";
import MainLayout from "./MainLayout";
import Upload from "./Upload";
import Sheet from "./Sheet";
import Users from "./Users";
import PlaceholderPage from "./PlaceholderPage";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1D4ED8",
    },
    background: {
      default: "#F7F9FC",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: "Lato, Arial, sans-serif",
  },
});

function AppContent() {
  const { isAuthenticated } = useAuth();

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
                  <PlaceholderPage title="Home" />
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
          <Route
            path="/clients"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlaceholderPage title="Clients" />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlaceholderPage title="Schedule" />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlaceholderPage title="Projects" />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
