interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  type?: 'text' | 'number' | 'email' | 'password';
  min?: number;
  step?: number;
  className?: string;
}

export default function InputField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  type = 'text',
  min,
  step,
  className = 'form-field-name',
}: InputFieldProps) {
  return (
    <div className={className}>
      <label className="form-label">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        step={step}
      />
    </div>
  );
}





