import React, { useContext, useEffect } from 'react';
import { Field, type FieldProps } from 'formik';
import { Layer, Select, SelectItem } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { evaluateAsBoolean } from '@openmrs/esm-framework';
import { PatientRegistrationContext } from '../../patient-registration-context';
import styles from './../field.scss';

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

interface CustomPersonAttributeFieldProps {
  id: string;
  personAttributeType: PersonAttributeTypeResponse;
  answerConceptSetUuid: string;
  label?: string;
  customConceptAnswers: ConceptAnswer[];
  required: boolean;
}

interface PatientRegistrationContextType {
  setFieldValue: (field: string, value: any) => void;
  values: {
    attributes?: Record<string, string>;
  };
}

const CustomPersonAttributeField: React.FC<CustomPersonAttributeFieldProps> = ({
  personAttributeType,
  required,
  id,
  label,
  customConceptAnswers,
}) => {
  const { t } = useTranslation();
  const fieldName = `attributes.${personAttributeType.uuid}`;
  const { setFieldValue, values } = useContext(PatientRegistrationContext) as PatientRegistrationContextType;

  // TODO: Improve this logic
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

    return (
      <Select
        id={id}
        name={`person-attribute-${personAttributeType.uuid}`}
        labelText={displayLabel}
        invalid={Boolean(hasError)}
        required={required}
        {...field}>
        <SelectItem value="" text={t('selectAnOption', 'Select an option')} />
        {filteredCustomConceptAnswers.map((answer) => (
          <SelectItem
            key={answer.uuid ?? answer.name}
            value={answer.uuid ?? answer.name ?? ''}
            text={answer.label ?? answer.uuid ?? answer.name ?? ''}
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
