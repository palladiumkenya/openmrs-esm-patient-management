import React from 'react';
import { TFunction, useTranslation } from 'react-i18next';
import { MappedAppointment } from '../types/index';
import styles from './appointment-details.scss';
import { usePatientAppointmentHistory } from '../hooks/usePatientAppointmentHistory';
import { formatDate } from '@openmrs/esm-framework';
import { getGender } from '../helpers';

interface AppointmentDetailsProps {
  appointment: MappedAppointment;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ appointment }) => {
  const { t } = useTranslation();
  const { appointmentsCount } = usePatientAppointmentHistory(appointment.patientUuid, new AbortController());

  return (
    <div className={styles.container}>
      <div className="header">
        <p className={styles.title}>{appointment.serviceType}</p>
        <p className={styles.subHeading}>{formatDate(new Date(appointment.dateTime), { mode: 'standard' })}</p>
      </div>
      <section>
        <div>
          <h4 className={styles.heading}>{t('patientDetails', 'Patient Details')}</h4>
          <p className={styles.label}>{appointment.name}</p>
          <p className={styles.label}>{appointment.age}</p>
          <p className={styles.label}>{getGender(appointment?.gender, t)}</p>
          <p className={styles.label}>{appointment?.dob}</p>
          <p className={styles.label}>{appointment?.phoneNumber}</p>
        </div>
        <div>
          <h4 className={styles.heading}>{t('appointmentNotes', 'Appointment Notes')}</h4>
          <p className={styles.label}>{appointment.comments}</p>
        </div>
        <div>
          <h4 className={styles.heading}>{t('appointmentHistory', 'Appointment History')}</h4>
          <div className={styles.appointmentHistory}>
            <div>
              <span className={styles.historyTitle}>{t('completed', 'Completed')}</span>
              <p className={styles.labelPrimary}> {appointmentsCount.completedAppointments}</p>
            </div>
            <div>
              <span className={styles.historyTitle}>{t('cancelled', 'Cancelled')}</span>
              <p className={styles.labelPrimary}> {appointmentsCount.cancelledAppointments}</p>
            </div>
            <div>
              <span className={styles.historyTitle}>{t('missed', 'Missed')}</span>
              <p className={styles.labelDanger}> {appointmentsCount.missedAppointments}</p>
            </div>
            <div>
              <span className={styles.historyTitle}>{t('upcoming', 'Upcoming')}</span>
              <p className={styles.labelPrimary}> {appointmentsCount.upcomingAppointments}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppointmentDetails;
