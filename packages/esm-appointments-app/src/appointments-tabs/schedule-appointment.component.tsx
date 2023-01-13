import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppointments } from './appointments-table.resource';
import { ContentSwitcher, Switch } from '@carbon/react';
import { useQueues } from '../patient-queue/visit-form/useVisit';
import { useSession } from '@openmrs/esm-framework';
import useAppointmentList from '../dashboard-patient-list/useAppointmentList';
import AppointmentsBaseTable from './appointments-base-table.component';
import { useAppointmentDate } from '../helpers';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrBefore);

interface ScheduledAppointmentsProps {
  visits: Array<any>;
  isLoading: boolean;
}
type scheduleType = 'CameEarly' | 'Rescheduled' | 'Honoured' | 'Pending' | 'Scheduled';

const ScheduledAppointments: React.FC<ScheduledAppointmentsProps> = ({ isLoading: isLoadingVisit, visits }) => {
  const { t } = useTranslation();
  const session = useSession();
  const appointmentDate = useAppointmentDate();

  const { appointments, isLoading } = useAppointments();
  const [scheduleType, setScheduleType] = useState<scheduleType>('Scheduled');
  const { appointmentList } = useAppointmentList(scheduleType);
  const isDateInPast = !dayjs(appointmentDate).isBefore(dayjs(), 'date');

  const rowData = appointmentList.map((appointment, index) => {
    return {
      id: `${index}`,
      ...appointment,
    };
  });
  return (
    <div>
      <div style={{ padding: '0.425rem 0 0.25rem 1rem' }}>
        <ContentSwitcher style={{ maxWidth: '70%' }} size="sm" onChange={({ name }) => setScheduleType(name)}>
          <Switch name={'Scheduled'} text={t('scheduled', 'Scheduled')} />
          <Switch name={'CameEarly'} text={t('CameEarly', 'Came Early')} />
          <Switch name={'Rescheduled'} text={t('Rescheduled', 'Rescheduled')} />
          <Switch name={'Honoured'} text={t('honored', 'Honored')} />
          <Switch name={'Pending'} text={isDateInPast ? t('notArrived', 'Not arrived') : t('missed', 'Missed')} />
        </ContentSwitcher>
        {scheduleType === 'Scheduled' && (
          <AppointmentsBaseTable
            appointments={appointments}
            isLoading={isLoading}
            tableHeading={t('scheduled', 'Scheduled')}
            visits={visits}
          />
        )}
        {scheduleType === 'CameEarly' && (
          <AppointmentsBaseTable
            appointments={rowData}
            isLoading={isLoading}
            tableHeading={t('cameEarly', 'Came Early')}
            visits={visits}
          />
        )}
        {scheduleType === 'Honoured' && (
          <AppointmentsBaseTable
            appointments={rowData}
            isLoading={isLoading}
            tableHeading={t('honoured', 'Honoured')}
            visits={visits}
          />
        )}
        {scheduleType === 'Rescheduled' && (
          <AppointmentsBaseTable
            appointments={rowData}
            isLoading={isLoading}
            tableHeading={t('rescheduled', 'Rescheduled')}
            visits={visits}
          />
        )}
        {scheduleType === 'Pending' && (
          <AppointmentsBaseTable
            appointments={rowData}
            isLoading={isLoading}
            tableHeading={isDateInPast ? t('notArrived', 'Not arrived') : t('missed', 'Missed')}
            visits={visits}
          />
        )}
      </div>
    </div>
  );
};

export default ScheduledAppointments;
