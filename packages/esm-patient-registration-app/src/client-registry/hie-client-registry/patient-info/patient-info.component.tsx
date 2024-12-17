import React from 'react';
import styles from '../modal/confirm-hie.scss';

const PatientInfo: React.FC<{ label: string; value?: string; customValue?: JSX.Element }> = ({
  label,
  value,
  customValue,
}) => {
  return (
    <div className={styles.patientInfo}>
      <span className={styles.patientInfoLabel}>{label}</span>
      <span>{value || customValue || '--'}</span>
    </div>
  );
};

export default PatientInfo;
