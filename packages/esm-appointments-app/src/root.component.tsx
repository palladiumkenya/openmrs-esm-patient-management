import React from 'react';
import { SWRConfig } from 'swr';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { spaBasePath, spaRoot } from './constants';
import AppointmentsDashboard from './dashboard/appointments-dashboard.component';
import Overlay from './overlay.component';
import AppointmentsCalendarListView from './appointments-calendar/appointments-calendar-list-view.component';
import MissedAppointmentList from './appointments/missed-appointment-list.component';
import CalendarPatientList from './appointments-calendar/calendar-patient-list/calendar-patient-list.component';

const swrConfiguration = {
  errorRetryCount: 3,
};

const Root: React.FC = () => {
  return (
    <main>
      <SWRConfig value={swrConfiguration}>
        <BrowserRouter basename={spaBasePath}>
          <Routes>
            <Route path="" element={<AppointmentsDashboard />} />
            <Route path="/calendar" element={<AppointmentsCalendarListView />} />
            <Route path="/calendarlist/:forDate/:serviceName" element={<CalendarPatientList />} />
          </Routes>
          <Overlay />
        </BrowserRouter>
      </SWRConfig>
    </main>
  );
};

export default Root;
