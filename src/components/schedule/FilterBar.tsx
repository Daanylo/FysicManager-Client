import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  MenuItem, 
  CircularProgress, 
  Typography, 
  Chip, 
  OutlinedInput, 
  InputLabel, 
  FormControl, 
  Select, 
  SelectChangeEvent 
} from '@mui/material';
import { Practice } from '../../types/Practice';
import { Specialization } from '../../types/Specialization';
import { Therapist } from '../../types/Therapist';
import { getAllPractices } from '../../services/practiceAPI';
import { getAllSpecializations } from '../../services/specializationAPI';
import { getAllTherapists } from '../../services/therapistAPI';

interface FilterBarProps {
  onTherapistsSelected?: (therapists: Therapist[]) => void;
  onFilteredTherapistsChange?: (therapists: Therapist[]) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onTherapistsSelected, onFilteredTherapistsChange }) => {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([]);
  
  // Replace single selection with multi selection (storing arrays of IDs)
  const [selectedTherapistIds, setSelectedTherapistIds] = useState<string[]>([]);
  const [selectedPracticeIds, setSelectedPracticeIds] = useState<string[]>([]);
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<string[]>([]);
  
  const [loadingPractices, setLoadingPractices] = useState<boolean>(true);
  const [loadingSpecializations, setLoadingSpecializations] = useState<boolean>(true);
  const [loadingTherapists, setLoadingTherapists] = useState<boolean>(true);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [practicesData, specializationsData, therapistsData] = await Promise.all([
          getAllPractices(),
          getAllSpecializations(),
          getAllTherapists()
        ]);
        
        setPractices(practicesData);
        setSpecializations(specializationsData);
        setTherapists(therapistsData);
        setFilteredTherapists(therapistsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingPractices(false);
        setLoadingSpecializations(false);
        setLoadingTherapists(false);
      }
    };

    fetchData();
  }, []);
  // Filter therapists when selections change
  useEffect(() => {
    if (therapists.length === 0) return;

    let filtered = [...therapists];

    if (selectedPracticeIds.length > 0) {
      filtered = filtered.filter(therapist => 
        therapist.practices?.some(practice => selectedPracticeIds.includes(practice.id))
      );
    }

    if (selectedSpecializationIds.length > 0) {
      filtered = filtered.filter(therapist =>
        therapist.specializations?.some(spec => selectedSpecializationIds.includes(spec.id))
      );
    }

    setFilteredTherapists(filtered);

    // Notify parent component about filtered therapists
    if (onFilteredTherapistsChange) {
      onFilteredTherapistsChange(filtered);
    }

    // Update selected therapists if they're not in filtered list anymore
    const validSelectedTherapists = selectedTherapistIds.filter(
      id => filtered.some(t => t.id === id)
    );
    
    if (validSelectedTherapists.length !== selectedTherapistIds.length) {
      setSelectedTherapistIds(validSelectedTherapists);
      updateSelectedTherapists(validSelectedTherapists);
    }
  }, [selectedPracticeIds, selectedSpecializationIds, therapists, selectedTherapistIds, onFilteredTherapistsChange]);

  // Helper function to update parent component with selected therapists
  const updateSelectedTherapists = (therapistIds: string[]) => {
    if (onTherapistsSelected) {
      const selected = therapists.filter(t => therapistIds.includes(t.id));
      onTherapistsSelected(selected);
    }
  };

  // Handle practice selection
  const handlePracticeChange = (event: SelectChangeEvent<string[]>) => {
    const values = event.target.value as string[];
    setSelectedPracticeIds(values);
  };

  // Handle specialization selection
  const handleSpecializationChange = (event: SelectChangeEvent<string[]>) => {
    const values = event.target.value as string[];
    setSelectedSpecializationIds(values);
  };

  // Handle therapist selection
  const handleTherapistChange = (event: SelectChangeEvent<string[]>) => {
    const therapistIds = event.target.value as string[];
    setSelectedTherapistIds(therapistIds);
    updateSelectedTherapists(therapistIds);
  };
  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      },
    },
  };

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 2, backgroundColor: 'background.paper', flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="practices-label">Practices</InputLabel>
        <Select
          labelId="practices-label"
          id="practices-select"
          multiple
          value={selectedPracticeIds}
          onChange={handlePracticeChange}
          input={<OutlinedInput id="select-multiple-practices" label="Practices" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const practice = practices.find(p => p.id === value);
                return practice ? (
                  <Chip key={value} label={practice.name} size="small" />
                ) : null;
              })}
            </Box>
          )}
          MenuProps={MenuProps}
          disabled={loadingPractices}
        >
          {practices.map((practice) => (
            <MenuItem key={practice.id} value={practice.id}>
              {practice.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="specializations-label">Specializations</InputLabel>
        <Select
          labelId="specializations-label"
          id="specializations-select"
          multiple
          value={selectedSpecializationIds}
          onChange={handleSpecializationChange}
          input={<OutlinedInput id="select-multiple-specializations" label="Specializations" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const specialization = specializations.find(s => s.id === value);
                return specialization ? (
                  <Chip key={value} label={specialization.name} size="small" />
                ) : null;
              })}
            </Box>
          )}
          MenuProps={MenuProps}
          disabled={loadingSpecializations}
        >
          {specializations.map((specialization) => (
            <MenuItem key={specialization.id} value={specialization.id}>
              {specialization.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="therapists-label">Therapists</InputLabel>
        <Select
          labelId="therapists-label"
          id="therapists-select"
          multiple
          value={selectedTherapistIds}
          onChange={handleTherapistChange}
          input={<OutlinedInput id="select-multiple-therapists" label="Therapists" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => {
                const therapist = therapists.find(t => t.id === value);
                return therapist ? (
                  <Chip key={value} label={therapist.name} size="small" />
                ) : null;
              })}
            </Box>
          )}
          MenuProps={MenuProps}
          disabled={loadingTherapists || filteredTherapists.length === 0}
        >
          {loadingTherapists ? (
            <MenuItem disabled>
              <CircularProgress size={20} />
            </MenuItem>
          ) : filteredTherapists.length === 0 ? (
            <MenuItem disabled>
              No therapists match filters
            </MenuItem>
          ) : (
            filteredTherapists.map((therapist) => (
              <MenuItem key={therapist.id} value={therapist.id}>
                {therapist.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {selectedTherapistIds.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            {selectedTherapistIds.length} therapists selected
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FilterBar;
