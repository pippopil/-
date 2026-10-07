import React, { useState, useEffect } from 'react';

export interface SafeNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number | string;
  fallbackValue?: number;
  allowDecimals?: boolean;
}

/**
 * Надежный числовой инпут, не сбрасывающий значение при стирании цифр
 * (решает проблему зависания "20" при попытке стереть или изменить двойку).
 */
export const SafeNumberInput: React.FC<SafeNumberInputProps> = ({
  value,
  onChange,
  min = 1,
  max = 1000,
  fallbackValue = 20,
  allowDecimals = true,
  className,
  onBlur,
  ...rest
}) => {
  const [text, setText] = useState<string>(String(value ?? fallbackValue));

  useEffect(() => {
    const currentNum = parseFloat(text);
    if (!isNaN(value) && (isNaN(currentNum) || Math.abs(currentNum - value) > 0.0001)) {
      setText(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.');
    // Разрешаем ввод пустой строки, цифр и одной десятичной точки
    if (raw === '' || (allowDecimals ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/).test(raw)) {
      setText(raw);
      if (raw !== '' && raw !== '.') {
        const parsed = parseFloat(raw);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) {
          onChange(parsed);
        }
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const parsed = parseFloat(text);
    let finalVal: number;
    if (isNaN(parsed) || parsed < min) {
      finalVal = fallbackValue;
    } else if (parsed > max) {
      finalVal = max;
    } else {
      finalVal = allowDecimals ? Math.round(parsed * 100) / 100 : Math.round(parsed);
    }
    setText(String(finalVal));
    onChange(finalVal);
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      {...rest}
    />
  );
};
