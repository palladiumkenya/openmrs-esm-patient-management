import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tab, TabList, Tabs, TabPanel, TabPanels } from '@carbon/react';
import { Calendar, Download } from '@carbon/react/icons';
import styles from './appointment-list.scss';
import { formatDate, navigate } from '@openmrs/esm-framework';
import { spaBasePath } from '../constants';
import ScheduledAppointments from '../appointments-tabs/schedule-appointment.component';
import { useAppointmentDate } from '../helpers';
import dayjs from 'dayjs';
import UnScheduledAppointments from '../appointments-tabs/unscheduled-appointments.component';
import { useAppointments } from '../appointments-tabs/appointments-table.resource';
import { useVisits } from '../hooks/useVisits';
import { DownloadAppointmentAsExcel } from '../helpers/excel';

const AppointmentList: React.FC<{ appointmentServiceType: string }> = ({ appointmentServiceType }) => {
  const { t } = useTranslation();
  const startDate = useAppointmentDate();
  const { appointments } = useAppointments();
  const [selectedTab, setSelectedTab] = useState(0);
  const { isLoading, visits } = useVisits();

  return (
    <div className={styles.appointmentList}>
      <div className={styles.downloadButton}>
        {appointments.length > 0 && (
          <Button renderIcon={Download} kind="ghost" onClick={() => DownloadAppointmentAsExcel(appointments)}>
            {t('downloadAppointmentList', 'Download appointment list')}
          </Button>
        )}
      </div>
      <Tabs
        selectedIndex={selectedTab}
        onChange={({ selectedIndex }) => setSelectedTab(selectedIndex)}
        className={styles.tabs}>
        <TabList style={{ paddingLeft: '1rem' }} aria-label="Appointment tabs" contained>
          <Tab style={{ minWidth: '12rem' }}>{t('scheduled', 'Scheduled')}</Tab>
          <Tab style={{ minWidth: '12rem' }}>{t('unScheduled', 'UnScheduled')}</Tab>
          <Button
            className={styles.calendarButton}
            kind="primary"
            onClick={() => navigate({ to: `${spaBasePath}/calendar` })}
            renderIcon={(props) => <Calendar size={16} {...props} />}
            data-floating-menu-primary-focus
            iconDescription={t('viewCalendar', 'View Calendar')}>
            {t('viewCalendar', 'View Calendar')}
          </Button>
        </TabList>
        <TabPanels>
          <TabPanel style={{ padding: 0 }}>
            <ScheduledAppointments
              visits={visits}
              isLoading={isLoading}
              appointmentServiceType={appointmentServiceType}
            />
          </TabPanel>
          <TabPanel style={{ padding: 0 }}>
            <UnScheduledAppointments />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default AppointmentList;
