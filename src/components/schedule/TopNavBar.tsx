import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const TopNavBar: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Schedule View
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default TopNavBar;
