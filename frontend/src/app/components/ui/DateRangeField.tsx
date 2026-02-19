interface DateRangeFieldProps {
  label: string;
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  required?: boolean;
  showValidation?: boolean;
  helpText?: string;
  className?: string;
}

export default function DateRangeField({
  label,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  required = false,
  showValidation = false,
  helpText,
  className = 'col-12 col-md-auto',
}: DateRangeFieldProps) {
  const isValid = fromValue && toValue;
  const showWarning = showValidation && !isValid;

  return (
    <div className={className}>
      <label className="form-label">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      <div className="date-range-flex">
        <input
          type="date"
          className={`form-control ${showWarning ? 'border-warning' : ''}`}
          value={fromValue}
          onChange={(e) => onFromChange(e.target.value)}
          placeholder="開始日"
        />
        <span className="fw-bold date-range-separator">から</span>
        <input
          type="date"
          className={`form-control ${showWarning ? 'border-warning' : ''}`}
          value={toValue}
          onChange={(e) => onToChange(e.target.value)}
          placeholder="終了日"
        />
      </div>
    </div>
  );
}





