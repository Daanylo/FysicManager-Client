import React, { useState } from 'react';
import { Box } from '@mui/material';
import TopNavBar from '../components/schedule/TopNavBar';
import FilterBar from '../components/schedule/FilterBar';
import PatientPanel from '../components/schedule/PatientPanel';
import SchedulePanel from '../components/schedule/SchedulePanel';
import CalendarPanel from '../components/schedule/CalendarPanel';
import { Therapist } from '../types/Therapist';

const ScheduleView: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTherapists, setSelectedTherapists] = useState<Therapist[]>([]);
    const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([]);

    const handleTherapistsSelected = (therapists: Therapist[]) => {
        setSelectedTherapists(therapists);
    };

    const handleFilteredTherapistsChange = (therapists: Therapist[]) => {
        setFilteredTherapists(therapists);
    };

    const handleDateSelected = (date: Date | null) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopNavBar />
            <FilterBar 
                onTherapistsSelected={handleTherapistsSelected} 
                onFilteredTherapistsChange={handleFilteredTherapistsChange}
            />
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                <Box sx={{ width: '25%', height: '100%', overflowY: 'auto' }}>
                    <PatientPanel />
                </Box>
                <Box sx={{ flexGrow: 1, height: '100%', overflowY: 'hidden', overflowX: 'auto' }}>
                    <SchedulePanel 
                        selectedDate={selectedDate} 
                        selectedTherapists={selectedTherapists}
                        filteredTherapists={filteredTherapists}
                    />
                </Box>
                <Box sx={{ width: '25%', height: '100%', overflowY: 'auto' }}>
                    <CalendarPanel onDateSelected={handleDateSelected} />
                </Box>
            </Box>
        </Box>
    );
};

export default ScheduleView;
