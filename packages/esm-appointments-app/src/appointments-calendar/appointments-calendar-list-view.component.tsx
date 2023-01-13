import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppointmentsHeader from '../appointments-header/appointments-header.component';
import CalendarHeader from './calendar-header.component';
import MonthlyCalendarView from './monthly-calendar-view.component';
import styles from './appointments-calendar-list-view.scss';
import WeeklyCalendarView from './weekly-calendar-view.component';
import DailyCalendarView from './daily-calendar-view.component';

interface AppointmentsCalendarListViewProps {}
type AppointmentsCalendarListView = 'daily' | 'weekly' | 'monthly';
const AppointmentsCalendarListView: React.FC<AppointmentsCalendarListViewProps> = () => {
  const { t } = useTranslation();
  const [calendarView, setCalendarView] = useState<AppointmentsCalendarListView>('monthly');
  return (
    <div className={styles.backgroundColor}>
      <AppointmentsHeader title={t('appointments', 'Appointments')} />
      <CalendarHeader onChangeView={setCalendarView} calendarView={calendarView} />
      {calendarView === 'monthly' && <MonthlyCalendarView type="monthly" events={events} />}
      {calendarView === 'weekly' && <WeeklyCalendarView type="weekly" events={events} />}
      {calendarView === 'daily' && <DailyCalendarView type="daily" events={events} />}
    </div>
  );
};

export default AppointmentsCalendarListView;
const events = [
  {
    appointmentDate: '2023-01-13 05:20:00',
    service: [
      { serviceName: 'HIV', count: 10 },
      { serviceName: 'Lab testing', count: 7 },
      { serviceName: 'Refill', count: 15 },
    ],
  },
  {
    appointmentDate: '2023-01-12 10:20:00',
    service: [
      { serviceName: 'HIV', count: 5 },
      { serviceName: 'Lab testing', count: 3 },
      { serviceName: 'Refill', count: 1 },
    ],
  },
  {
    appointmentDate: '2023-01-11 09:20:00',
    service: [
      { serviceName: 'Test', count: 10 },
      { serviceName: 'Lab testing', count: 10 },
    ],
  },
  {
    appointmentDate: '2022-12-20 10:00:00',
    service: [
      { serviceName: 'HIV', count: 1 },
      { serviceName: 'Lab testing', count: 1 },
      { serviceName: 'Refill', count: 1 },
    ],
  },
  {
    appointmentDate: '2022-12-23 08:20:00',
    service: [
      { serviceName: 'HIV', count: 21 },
      { serviceName: 'Drug Pickup', count: 4 },
      { serviceName: 'Lab testing', count: 10 },
      { serviceName: 'Refill', count: 3 },
    ],
  },
  {
    appointmentDate: '2022-12-14 12:20:00',
    service: [
      { serviceName: 'HIV', count: 10 },
      { serviceName: 'Refill', count: 2 },
    ],
  },
  {
    appointmentDate: '2022-12-16 14:20:00',
    service: [
      { serviceName: 'HIV', count: 1 },
      { serviceName: 'Lab testing', count: 10 },
    ],
  },
  {
    appointmentDate: '2022-11-26 13:20:00',
    service: [
      { serviceName: 'HIV', count: 10 },
      { serviceName: 'Lab testing', count: 10 },
      { serviceName: 'Refill', count: 15 },
    ],
  },
  {
    appointmentDate: '2022-10-27 15:20:00',
    service: [
      { serviceName: 'HIV', count: 1 },
      { serviceName: 'Drug pickup', count: 4 },
      { serviceName: 'Refill', count: 1 },
    ],
  },
  {
    appointmentDate: '2022-10-22 17:20:00',
    service: [{ serviceName: 'HIV', count: 13 }],
  },
];
