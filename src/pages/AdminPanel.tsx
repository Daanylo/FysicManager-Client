import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Autocomplete,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { format } from 'date-fns';

// Import types
import { Therapist } from '../types/Therapist';
import { TherapistSimple } from '../types/Simple/TherapistSimple';
import { Practice } from '../types/Practice';
import { Specialization } from '../types/Specialization';
import { AppointmentType } from '../types/AppointmentType';
import { Workshift } from '../types/Workshift';

// Import API functions
import { 
  getAllTherapists, 
  createTherapist, 
  updateTherapist, 
  deleteTherapist 
} from '../services/therapistAPI';
import { 
  getAllPractices, 
  createPractice, 
  updatePractice, 
  deletePractice 
} from '../services/practiceAPI';
import { 
  getAllSpecializations, 
  createSpecialization, 
  updateSpecialization, 
  deleteSpecialization 
} from '../services/specializationAPI';
import { 
  getAllAppointmentTypes, 
  createAppointmentType, 
  updateAppointmentType, 
  deleteAppointmentType 
} from '../services/appointmentTypeAPI';
import { 
  getAllWorkshifts, 
  createWorkshift, 
  updateWorkshift, 
  deleteWorkshift 
} from '../services/workshiftAPI';

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
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
    // Data states
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
  const [workshifts, setWorkshifts] = useState<Workshift[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [dialogType, setDialogType] = useState<'therapist' | 'practice' | 'specialization' | 'appointmentType' | 'workshift'>('therapist');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Form states
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);  const loadAllData = async () => {
    setLoading(true);
    try {
      const [therapistsData, practicesData, specializationsData, appointmentTypesData, workshiftsData] = await Promise.all([
        getAllTherapists(),
        getAllPractices(),
        getAllSpecializations(),
        getAllAppointmentTypes(),
        getAllWorkshifts()
      ]);
      
      console.log('Loaded therapists:', therapistsData);
      console.log('Loaded specializations:', specializationsData);
      console.log('Loaded practices:', practicesData);
      
      setTherapists(therapistsData);
      setPractices(practicesData);
      setSpecializations(specializationsData);
      setAppointmentTypes(appointmentTypesData);
      setWorkshifts(workshiftsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      setError('Failed to load data. Please refresh the page.');
    }
    setLoading(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const openCreateDialog = (type: typeof dialogType) => {
    setDialogType(type);
    setDialogMode('create');
    setFormData({});
    setSelectedItem(null);
    setOpenDialog(true);
  };  const openEditDialog = (type: typeof dialogType, item: any) => {
    setDialogType(type);
    setDialogMode('edit');
    setSelectedItem(item);
    
    // Prepare form data based on the item type
    let formDataToSet = { ...item };
    if (type === 'workshift') {
      formDataToSet = {
        ...item,
        therapistId: item.therapist.id,
        practiceId: item.practice.id,
        startTime: item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : '',
        endTime: item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : ''
      };
    } else if (type === 'therapist') {
      // Properly set the specializations and practices for editing
      console.log('Opening edit dialog for therapist:', item);
      formDataToSet = {
        ...item,
        specializations: item.specializations || [],
        practices: item.practices || []
      };
      console.log('Form data set for editing:', formDataToSet);
    }
    
    setFormData(formDataToSet);
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setFormData({});
    setSelectedItem(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    
    try {
      if (dialogMode === 'create') {        switch (dialogType) {          case 'therapist':
            // Convert form data to TherapistSimple format for creation
            const therapistCreateData: Omit<TherapistSimple, "id"> = {
              name: formData.name,
              phoneNumber: formData.phoneNumber,
              email: formData.email,
              specializationIds: formData.specializations?.map((spec: Specialization) => spec.id) || [],
              practiceIds: formData.practices?.map((practice: Practice) => practice.id) || [],
              workshiftIds: [] // Add workshift IDs if needed
            };
            await createTherapist(therapistCreateData);
            break;
          case 'practice':
            await createPractice(formData);
            break;
          case 'specialization':
            await createSpecialization(formData);
            break;
          case 'appointmentType':
            await createAppointmentType(formData);
            break;case 'workshift':
            const createWorkshiftData = {
              startTime: new Date(formData.startTime).toISOString(),
              endTime: new Date(formData.endTime).toISOString(),
              therapistId: formData.therapistId,
              practiceId: formData.practiceId
            };
            await createWorkshift(createWorkshiftData);
            break;
        }
        setSuccess(`${dialogType} created successfully!`);
      } else {        switch (dialogType) {          case 'therapist':
            // Convert form data to TherapistSimple format
            const therapistUpdateData: TherapistSimple = {
              id: selectedItem.id,
              name: formData.name,
              phoneNumber: formData.phoneNumber,
              email: formData.email,
              specializationIds: formData.specializations?.map((spec: Specialization) => spec.id) || [],
              practiceIds: formData.practices?.map((practice: Practice) => practice.id) || [],
              workshiftIds: [] // Add workshift IDs if needed
            };
            await updateTherapist(selectedItem.id, therapistUpdateData);
            break;
          case 'practice':
            await updatePractice(selectedItem.id, formData);
            break;
          case 'specialization':
            await updateSpecialization(selectedItem.id, formData);
            break;
          case 'appointmentType':
            await updateAppointmentType(selectedItem.id, formData);
            break;case 'workshift':
            const updateWorkshiftData = {
              id: selectedItem.id,
              startTime: new Date(formData.startTime).toISOString(),
              endTime: new Date(formData.endTime).toISOString(),
              therapistId: formData.therapistId,
              practiceId: formData.practiceId
            };
            await updateWorkshift(updateWorkshiftData);
            break;
        }
        setSuccess(`${dialogType} updated successfully!`);
      }
      
      closeDialog();
      loadAllData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error(`Failed to ${dialogMode} ${dialogType}:`, error);
      setError(`Failed to ${dialogMode} ${dialogType}. Please try again.`);
    }
    
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setSubmitting(true);
    try {
      switch (itemToDelete.type) {
        case 'therapist':
          await deleteTherapist(itemToDelete.item.id);
          break;
        case 'practice':
          await deletePractice(itemToDelete.item.id);
          break;
        case 'specialization':
          await deleteSpecialization(itemToDelete.item.id);
          break;        case 'appointmentType':
          await deleteAppointmentType(itemToDelete.item.id);
          break;
        case 'workshift':
          await deleteWorkshift(itemToDelete.item.id);
          break;
      }
      
      setSuccess(`${itemToDelete.type} deleted successfully!`);
      setDeleteDialog(false);
      setItemToDelete(null);
      loadAllData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error(`Failed to delete ${itemToDelete.type}:`, error);
      setError(`Failed to delete ${itemToDelete.type}. It may be in use.`);
    }
    
    setSubmitting(false);
  };

  const openDeleteDialog = (type: typeof dialogType, item: any) => {
    setItemToDelete({ type, item });
    setDeleteDialog(true);
  };

  const renderFormFields = () => {
    switch (dialogType) {      case 'therapist':
        return (
          <>
            <TextField
              label="Naam *"
              fullWidth
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Telefoonnummer"
              fullWidth
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              margin="normal"
            />
            <Autocomplete
              multiple
              options={specializations}
              getOptionLabel={(option) => option.name}
              value={formData.specializations || []}
              onChange={(_, newValue) => setFormData({ ...formData, specializations: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Specialisaties" margin="normal" />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
            <Autocomplete
              multiple
              options={practices}
              getOptionLabel={(option) => option.name}
              value={formData.practices || []}
              onChange={(_, newValue) => setFormData({ ...formData, practices: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Praktijken" margin="normal" />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </>
        );
      
      case 'practice':
        return (
          <>
            <TextField
              label="Naam *"
              fullWidth
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              label="Adres"
              fullWidth
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Stad"
              fullWidth
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Postcode"
              fullWidth
              value={formData.postalCode || ''}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Telefoonnummer"
              fullWidth
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Kleur (hex)"
              fullWidth
              value={formData.color || ''}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              margin="normal"
              placeholder="#FF5722"
            />
          </>
        );
      
      case 'specialization':
        return (
          <>
            <TextField
              label="Naam *"
              fullWidth
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              label="Beschrijving"
              fullWidth
              multiline
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
            />
          </>
        );
      
      case 'appointmentType':
        return (
          <>
            <TextField
              label="Naam *"
              fullWidth
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              label="Beschrijving"
              fullWidth
              multiline
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
            />
            <TextField
              label="Kleur (hex)"
              fullWidth
              value={formData.color || ''}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              margin="normal"
              placeholder="#FF5722"
            />
          </>        );
      
      case 'workshift':
        return (
          <>
            <TextField
              label="Starttijd *"
              type="datetime-local"
              fullWidth
              value={formData.startTime || ''}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Eindtijd *"
              type="datetime-local"
              fullWidth
              value={formData.endTime || ''}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              margin="normal"
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Therapeut</InputLabel>
              <Select
                value={formData.therapistId || ''}
                onChange={(e) => setFormData({ ...formData, therapistId: e.target.value })}
                label="Therapeut"
              >
                {therapists.map((therapist) => (
                  <MenuItem key={therapist.id} value={therapist.id}>
                    {therapist.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Praktijk</InputLabel>
              <Select
                value={formData.practiceId || ''}
                onChange={(e) => setFormData({ ...formData, practiceId: e.target.value })}
                label="Praktijk"
              >
                {practices.map((practice) => (
                  <MenuItem key={practice.id} value={practice.id}>
                    {practice.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading admin data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Therapeuten" />
          <Tab label="Praktijken" />
          <Tab label="Specialisaties" />
          <Tab label="Afspraak Types" />
          <Tab label="Werkdiensten" />
        </Tabs>

        {/* Therapists Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Therapeuten</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCreateDialog('therapist')}
            >
              Nieuwe Therapeut
            </Button>
          </Box>
          
          <TableContainer>
            <Table>              <TableHead>
                <TableRow>
                  <TableCell>Naam</TableCell>
                  <TableCell>E-mail</TableCell>
                  <TableCell>Telefoon</TableCell>
                  <TableCell>Specialisaties</TableCell>
                  <TableCell>Praktijken</TableCell>
                  <TableCell>Acties</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>                {therapists.map((therapist) => (
                  <TableRow key={therapist.id}>
                    <TableCell>{therapist.name}</TableCell>
                    <TableCell>{therapist.email || '-'}</TableCell>
                    <TableCell>{therapist.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      {therapist.specializations?.map((spec) => (
                        <Chip key={spec.id} label={spec.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      {therapist.practices?.map((practice) => (
                        <Chip key={practice.id} label={practice.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => openEditDialog('therapist', therapist)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => openDeleteDialog('therapist', therapist)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Practices Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Praktijken</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCreateDialog('practice')}
            >
              Nieuwe Praktijk
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Naam</TableCell>
                  <TableCell>Adres</TableCell>
                  <TableCell>Stad</TableCell>
                  <TableCell>Telefoon</TableCell>
                  <TableCell>Kleur</TableCell>
                  <TableCell>Acties</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {practices.map((practice) => (
                  <TableRow key={practice.id}>
                    <TableCell>{practice.name}</TableCell>
                    <TableCell>{practice.address || '-'}</TableCell>
                    <TableCell>{practice.city || '-'}</TableCell>
                    <TableCell>{practice.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      {practice.color && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              backgroundColor: practice.color,
                              borderRadius: '50%',
                              mr: 1,
                              border: '1px solid #ccc'
                            }}
                          />
                          {practice.color}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => openEditDialog('practice', practice)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => openDeleteDialog('practice', practice)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Specializations Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Specialisaties</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCreateDialog('specialization')}
            >
              Nieuwe Specialisatie
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Naam</TableCell>
                  <TableCell>Beschrijving</TableCell>
                  <TableCell>Acties</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {specializations.map((specialization) => (
                  <TableRow key={specialization.id}>
                    <TableCell>{specialization.name}</TableCell>
                    <TableCell>{specialization.description || '-'}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => openEditDialog('specialization', specialization)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => openDeleteDialog('specialization', specialization)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Appointment Types Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Afspraak Types</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCreateDialog('appointmentType')}
            >
              Nieuw Afspraak Type
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Naam</TableCell>
                  <TableCell>Beschrijving</TableCell>
                  <TableCell>Kleur</TableCell>
                  <TableCell>Acties</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointmentTypes.map((appointmentType) => (
                  <TableRow key={appointmentType.id}>
                    <TableCell>{appointmentType.name}</TableCell>
                    <TableCell>{appointmentType.description || '-'}</TableCell>
                    <TableCell>
                      {appointmentType.color && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              backgroundColor: appointmentType.color,
                              borderRadius: '50%',
                              mr: 1,
                              border: '1px solid #ccc'
                            }}
                          />
                          {appointmentType.color}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => openEditDialog('appointmentType', appointmentType)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => openDeleteDialog('appointmentType', appointmentType)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>          </TableContainer>
        </TabPanel>

        {/* Workshifts Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">Werkdiensten</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openCreateDialog('workshift')}
            >
              Nieuwe Werkdienst
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Starttijd</TableCell>
                  <TableCell>Eindtijd</TableCell>
                  <TableCell>Therapeut</TableCell>
                  <TableCell>Praktijk</TableCell>
                  <TableCell>Acties</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workshifts.map((workshift) => (
                  <TableRow key={workshift.id}>
                    <TableCell>
                      {workshift.startTime ? format(new Date(workshift.startTime), 'dd/MM/yyyy HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {workshift.endTime ? format(new Date(workshift.endTime), 'dd/MM/yyyy HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell>{workshift.therapist.name}</TableCell>
                    <TableCell>{workshift.practice.name}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => openEditDialog('workshift', workshift)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => openDeleteDialog('workshift', workshift)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Nieuwe' : 'Bewerk'} {dialogType}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {renderFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Annuleren</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {submitting ? 'Bezig...' : (dialogMode === 'create' ? 'Aanmaken' : 'Bijwerken')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Bevestig Verwijdering</DialogTitle>
        <DialogContent>
          <Typography>
            Weet je zeker dat je deze {itemToDelete?.type} wilt verwijderen?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Naam:</strong> {itemToDelete?.item?.name}
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 'bold' }}>
            Deze actie kan niet ongedaan worden gemaakt.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Annuleren</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={submitting}
            startIcon={submitting && <CircularProgress size={16} />}
          >
            {submitting ? 'Verwijderen...' : 'Verwijderen'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
