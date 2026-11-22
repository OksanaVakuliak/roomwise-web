import { type ChangeEvent, useId } from 'react';
import { cx } from '@/lib/cx';
import { TextArea } from '../TextArea/TextArea';
import { TextField } from '../TextField/TextField';
import styles from './LocalizedField.module.css';

export type LocalizedValue = { en: string; uk: string };
export type LocalizedLanguage = keyof LocalizedValue;

export type LocalizedFieldProps = {
  label: string;
  value: LocalizedValue;
  onChange: (next: LocalizedValue) => void;
  languageLabels: Record<LocalizedLanguage, string>;
  requiredForPublishLabel: string;
  multiline?: boolean;
  requiredForPublish?: boolean;
  errors?: Partial<Record<LocalizedLanguage, string>>;
  rows?: number;
  disabled?: boolean;
  id?: string;
  className?: string;
};

const LANGUAGES: LocalizedLanguage[] = ['en', 'uk'];

export function LocalizedField({
  label,
  value,
  onChange,
  languageLabels,
  requiredForPublishLabel,
  multiline,
  requiredForPublish,
  errors,
  rows,
  disabled,
  id,
  className,
}: LocalizedFieldProps) {
  const generated = useId();
  const base = id ?? generated;

  return (
    <fieldset className={cx(styles.root, className)} disabled={disabled}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.fields}>
        {LANGUAGES.map((language) => {
          const missing = requiredForPublish && value[language].trim() === '';
          const common = {
            id: `${base}-${language}`,
            lang: language,
            label: `${label} (${languageLabels[language]})`,
            value: value[language],
            error: errors?.[language],
            hint: missing ? requiredForPublishLabel : undefined,
            onChange: (
              event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => onChange({ ...value, [language]: event.target.value }),
          };
          return multiline ? (
            <TextArea key={language} {...common} rows={rows} />
          ) : (
            <TextField key={language} {...common} />
          );
        })}
      </div>
    </fieldset>
  );
}
