import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper 
} from '@mui/material';
import PracticesManager from '../components/admin/PracticesManager';
import TherapistsManager from '../components/admin/TherapistsManager';
import SpecializationsManager from '../components/admin/SpecializationsManager';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
      style={{ overflow: 'auto', height: 'calc(100vh - 180px)' }}
    >
      {value === index && (
        <Box sx={{ p: 1.5 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', overflow: 'hidden', py: 1.5 }}>
      <Paper sx={{ mt: 2, p: 1.5, height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontSize: '1.2rem', mb: 1 }}>
          Admin Dashboard
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="admin dashboard tabs"
            sx={{ minHeight: '40px' }}
          >
            <Tab label="Practices" {...a11yProps(0)} sx={{ py: 0.5, minHeight: '40px' }} />
            <Tab label="Therapists" {...a11yProps(1)} sx={{ py: 0.5, minHeight: '40px' }} />
            <Tab label="Specializations" {...a11yProps(2)} sx={{ py: 0.5, minHeight: '40px' }} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <PracticesManager />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TherapistsManager />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <SpecializationsManager />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminPage; 