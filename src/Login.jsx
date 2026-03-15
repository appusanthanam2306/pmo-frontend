import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./AuthContext";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
} from "@mui/material";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [redirectToHome, setRedirectToHome] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && redirectToHome) {
      navigate("/");
    }
  }, [isAuthenticated, redirectToHome, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          username,
          password,
        },
      );
      login(response.data.token, response.data.user);
      setRedirectToHome(true);
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 400 }}>
        <Typography
          component="h1"
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontWeight: 500 }}
        >
          Login to PMO Tracking
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
