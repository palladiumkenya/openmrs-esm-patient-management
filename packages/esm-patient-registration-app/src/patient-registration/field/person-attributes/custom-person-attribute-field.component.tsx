import React, { useContext, useEffect } from 'react';
import { Field, type FieldProps } from 'formik';
import { Layer, Select, SelectItem } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { PatientRegistrationContext } from '../../patient-registration-context';
import styles from './../field.scss';
import useUpdateIdentifierRequirement from './useUpdateIdentifierRequirement';

interface PersonAttributeTypeResponse {
  uuid: string;
  display?: string;
}

interface ConceptAnswer {
  uuid?: string;
  name?: string;
  label?: string;
  showServiceExpression?: {
    attributeTypeUuid: string;
    value: string;
  };
}

interface CustomAnswer {
  label?: string;
  value: string;
}

interface CustomPersonAttributeFieldProps {
  id: string;
  personAttributeType: PersonAttributeTypeResponse;
  answerConceptSetUuid: string;
  label?: string;
  customConceptAnswers: ConceptAnswer[];
  customAnswers?: CustomAnswer[];
  required: boolean;
}

const CustomPersonAttributeField: React.FC<CustomPersonAttributeFieldProps> = ({
  personAttributeType,
  required,
  id,
  label,
  customConceptAnswers,
  customAnswers,
}) => {
  const { t } = useTranslation();
  const fieldName = `attributes.${personAttributeType.uuid}`;
  const { setFieldValue, values } = useContext(PatientRegistrationContext);
  useUpdateIdentifierRequirement(setFieldValue, values);

  const filteredCustomConceptAnswers = customConceptAnswers.filter((answer) => {
    const showExpression = answer.showServiceExpression;
    if (!showExpression) return true;

    const attributeValue = values?.attributes?.[showExpression.attributeTypeUuid];
    const answerCadreId = answer.name;

    if (answerCadreId == null) return true;

    return showExpression.value.toLowerCase() === attributeValue?.toLowerCase();
  });

  useEffect(() => {
    return () => {
      setFieldValue(fieldName, '');
    };
  }, [fieldName, setFieldValue]);

  const renderSelect = ({ field, form: { touched, errors } }: FieldProps) => {
    const hasError = errors[fieldName] && touched[fieldName];
    const displayLabel = label ?? personAttributeType?.display ?? '';

    const options = label === 'Relationship' && customAnswers?.length ? customAnswers : filteredCustomConceptAnswers;

    return (
      <Select
        id={id}
        name={`person-attribute-${personAttributeType.uuid}`}
        labelText={displayLabel}
        invalid={Boolean(hasError)}
        invalidText={hasError ? String(errors[fieldName]) : undefined}
        required={required}
        {...field}>
        <SelectItem value="" text={t('selectAnOption', 'Select an option')} />
        {options.map((answer) => (
          <SelectItem
            key={answer.value || answer.uuid || answer.name}
            value={answer.value || answer.uuid || answer.name || ''}
            text={answer.label || answer.value || answer.uuid || answer.name || ''}
          />
        ))}
      </Select>
    );
  };

  return (
    <div className={classNames(styles.customField, styles.halfWidthInDesktopView)}>
      <Layer>
        <Field name={fieldName}>{renderSelect}</Field>
      </Layer>
    </div>
  );
};

export default CustomPersonAttributeField;
