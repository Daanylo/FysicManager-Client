import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import TopNavBar from '../components/schedule/TopNavBar';
import FilterBar from '../components/schedule/FilterBar';
import PatientPanel from '../components/schedule/PatientPanel';
import SchedulePanel from '../components/schedule/SchedulePanel';
import CalendarPanel from '../components/schedule/CalendarPanel';
import { Therapist } from '../types/Therapist';
import { getAllTherapists } from '../services/therapistAPI';

const ScheduleView: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedTherapists, setSelectedTherapists] = useState<Therapist[]>([]);
    const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([]);
    const [allTherapists, setAllTherapists] = useState<Therapist[]>([]);

    // Load all therapists for navigation purposes
    useEffect(() => {
        const loadTherapists = async () => {
            try {
                const therapists = await getAllTherapists();
                setAllTherapists(therapists);
            } catch (error) {
                console.error('Failed to load therapists:', error);
            }
        };
        loadTherapists();
    }, []);

    const handleTherapistsSelected = (therapists: Therapist[]) => {
        setSelectedTherapists(therapists);
    };

    const handleFilteredTherapistsChange = (therapists: Therapist[]) => {
        setFilteredTherapists(therapists);
    };    const handleDateSelected = (date: Date | null) => {
        if (date) {
            setSelectedDate(date);
        }
    };    const handleNavigateToAppointment = (appointmentDate: Date, therapistId: string) => {
        // Set the date to navigate to
        setSelectedDate(appointmentDate);
        
        // Find the therapist by ID from all available therapists
        const therapist = allTherapists.find(t => t.id === therapistId);
        if (therapist) {
            // Select this specific therapist to show their schedule
            setSelectedTherapists([therapist]);
            // Clear filtered therapists to ensure we show only the selected one
            setFilteredTherapists([]);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopNavBar />
            <FilterBar 
                onTherapistsSelected={handleTherapistsSelected} 
                onFilteredTherapistsChange={handleFilteredTherapistsChange}
            />
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', gap: 1, margin: 1 }}>                <Box sx={{ width: '25%', height: '100%', overflowY: 'auto' }}>
                    <PatientPanel onNavigateToAppointment={handleNavigateToAppointment} />
                </Box>
                <Box sx={{ flexGrow: 1, height: '100%', overflowY: 'hidden', overflowX: 'auto' }}>
                    <SchedulePanel 
                        selectedDate={selectedDate} 
                        selectedTherapists={selectedTherapists}
                        filteredTherapists={filteredTherapists}
                    />
                </Box>                <Box sx={{ width: '20%', minWidth: '330px', height: '100%', overflowY: 'auto'}}>
                    <CalendarPanel onDateSelected={handleDateSelected} selectedDate={selectedDate} />
                </Box>
            </Box>
        </Box>
    );
};

export default ScheduleView;
