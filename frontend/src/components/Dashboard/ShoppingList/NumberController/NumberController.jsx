import React, { useState, useEffect } from 'react';
import { NumberField } from '@base-ui-components/react';
import styles from './numfield.module.css';

export default function NumberController({
  id,
  value: controlledValue,
  defaultValue,
  label = null,
  disabled = false,
  onBlur = (value) => {
    console.log('onBlur', value);
  },
}) {
  const initialValue = controlledValue !== undefined ? controlledValue : defaultValue;
  const [localValue, setLocalValue] = useState(initialValue);

  useEffect(() => {
    if (controlledValue !== undefined) {
      setLocalValue(controlledValue);
    }
  }, [controlledValue]);

  const handleValueChange = (newValue) => {
    setLocalValue(newValue);
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue) || 0;
    onBlur(numValue);
  };
  function CursorGrowIcon(props) {
    return (
      <svg
        width='26'
        height='14'
        viewBox='0 0 24 14'
        fill='black'
        stroke='white'
        xmlns='http://www.w3.org/2000/svg'
        {...props}
      >
        <path d='M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z' />
      </svg>
    );
  }
  function PlusIcon(props) {
    return (
      <svg
        className='muiicon'
        width='10'
        height='10'
        viewBox='0 0 10 10'
        fill='none'
        stroke='currentcolor'
        strokeWidth='1.6'
        xmlns='http://www.w3.org/2000/svg'
        {...props}
      >
        <path d='M0 5H5M10 5H5M5 5V0M5 5V10' />
      </svg>
    );
  }

  function MinusIcon(props) {
    return (
      <svg
        className='muiicon'
        width='10'
        height='10'
        viewBox='0 0 10 10'
        fill='none'
        stroke='currentcolor'
        strokeWidth='1.6'
        xmlns='http://www.w3.org/2000/svg'
        {...props}
      >
        <path d='M0 5H10' />
      </svg>
    );
  }
  if (label === 'totalprice') {
    return (
      <NumberField.Root
        id={id}
        value={localValue}
        onValueChange={handleValueChange}
        className={styles.Field}
        disabled={disabled}
      >
        <NumberField.ScrubArea className={styles.ScrubArea}>
          <NumberField.ScrubAreaCursor className={styles.ScrubAreaCursor}>
            <CursorGrowIcon />
          </NumberField.ScrubAreaCursor>
        </NumberField.ScrubArea>
        <NumberField.Group className={styles.Group}>
          <span style={{ margin: 'auto', padding: 'auto' }}>{'$'}</span>{' '}
          <NumberField.Input className={styles.Input} disabled={disabled} onBlur={handleBlur} />
        </NumberField.Group>
      </NumberField.Root>
    );
  }
  return (
    <NumberField.Root
      id={id}
      value={localValue}
      onValueChange={handleValueChange}
      className={styles.Field}
      disabled={disabled}
    >
      <NumberField.ScrubArea className={styles.ScrubArea}>
        <NumberField.ScrubAreaCursor className={styles.ScrubAreaCursor}>
          <CursorGrowIcon />
        </NumberField.ScrubAreaCursor>
      </NumberField.ScrubArea>
      <NumberField.Group className={styles.Group}>
        <NumberField.Input className={styles.Input} disabled={disabled} onBlur={handleBlur} />
      </NumberField.Group>
    </NumberField.Root>
  );
}
