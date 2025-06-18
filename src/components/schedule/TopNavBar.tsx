import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TopNavBar: React.FC = () => {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Schedule View
        </Typography>
        <Button
          color="inherit"
          startIcon={<AdminPanelSettings />}
          onClick={handleAdminClick}
        >
          Admin
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
