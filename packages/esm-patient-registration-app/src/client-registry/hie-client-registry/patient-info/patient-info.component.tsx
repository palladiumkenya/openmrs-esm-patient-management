import React from 'react';
import styles from '../modal/confirm-hie.scss';

const PatientInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div className={styles.patientInfo}>
      <span className={styles.patientInfoLabel}>{label}</span>
      <span>{value || '--'}</span>
    </div>
  );
};

export default PatientInfo;
