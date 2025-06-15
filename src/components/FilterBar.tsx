import React, { useEffect, useState } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  OutlinedInput,
  SelectChangeEvent,
  Paper,
  CircularProgress
} from '@mui/material';
import { getPractices, getSpecializations } from '../services/patientAPI';
import { Practice } from '../types/Practice';
import { Specialization } from '../types/Specialization';

interface FilterBarProps {
  onPracticesChange: (practices: number[]) => void;
  onSpecializationsChange: (specializations: number[]) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onPracticesChange, onSpecializationsChange }) => {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [selectedPractices, setSelectedPractices] = useState<number[]>([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const practicesData = await getPractices();
        const specializationsData = await getSpecializations();
        setPractices(practicesData);
        setSpecializations(specializationsData);
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePracticesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const valueArray = typeof value === 'string' ? value.split(',') : value;
    const numberValues = valueArray.map(v => Number(v));
    
    setSelectedPractices(numberValues);
    onPracticesChange(numberValues);
  };

  const handleSpecializationsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const valueArray = typeof value === 'string' ? value.split(',') : value;
    const numberValues = valueArray.map(v => Number(v));
    
    setSelectedSpecializations(numberValues);
    onSpecializationsChange(numberValues);
  };

  return (
    <Paper sx={{ p: 2, mb: 2, height: '64px', display: 'flex', alignItems: 'center' }}>
      {isLoading ? (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
          <FormControl sx={{ width: '48%' }}>
            <InputLabel id="practice-label">Practices</InputLabel>
            <Select
              labelId="practice-label"
              id="practice-select"
              multiple
              value={selectedPractices.map(String)}
              onChange={handlePracticesChange}
              input={<OutlinedInput id="select-multiple-practices" label="Practices" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const practiceId = Number(value);
                    const practice = practices.find(p => p.id === practiceId);
                    return (
                      <Chip key={value} label={practice?.name || value} />
                    );
                  })}
                </Box>
              )}
              size="small"
            >
              {practices.map((practice) => (
                <MenuItem key={practice.id} value={String(practice.id)}>
                  {practice.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ width: '48%' }}>
            <InputLabel id="specialization-label">Specializations</InputLabel>
            <Select
              labelId="specialization-label"
              id="specialization-select"
              multiple
              value={selectedSpecializations.map(String)}
              onChange={handleSpecializationsChange}
              input={<OutlinedInput id="select-multiple-specializations" label="Specializations" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const specializationId = Number(value);
                    const specialization = specializations.find(s => s.id === specializationId);
                    return (
                      <Chip key={value} label={specialization?.name || value} />
                    );
                  })}
                </Box>
              )}
              size="small"
            >
              {specializations.map((specialization) => (
                <MenuItem key={specialization.id} value={String(specialization.id)}>
                  {specialization.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}
    </Paper>
  );
};

export default FilterBar; 