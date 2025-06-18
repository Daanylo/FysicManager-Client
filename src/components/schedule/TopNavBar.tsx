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
        <img 
          src="/fysicmanager_logo.png" 
          alt="Logo" 
          style={{ height: 40, marginRight: 16 }}
        />
        <Button
          color="inherit"
          sx={{ marginLeft: 'auto' }}
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
