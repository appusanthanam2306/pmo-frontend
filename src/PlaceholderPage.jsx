import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const PlaceholderPage = ({ title }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography>
        This page is a placeholder. Implement the feature for “{title}” here.
      </Typography>
    </Box>
  );
};

export default PlaceholderPage;
