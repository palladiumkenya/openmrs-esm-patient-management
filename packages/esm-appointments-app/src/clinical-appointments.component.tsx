import React from 'react';
import AppointmentList from './appointments/appointment-list.component';
import ClinicMetrics from './appointments-metrics/appointments-metrics.component';

interface ClinicalAppointmentsProps {
  appointmentServiceType: string;
}

const ClinicalAppointments: React.FC<ClinicalAppointmentsProps> = ({ appointmentServiceType }) => {
  return (
    <div>
      <ClinicMetrics serviceUuid={appointmentServiceType} />
      <AppointmentList appointmentServiceType={appointmentServiceType} />
    </div>
  );
};

export default ClinicalAppointments;
