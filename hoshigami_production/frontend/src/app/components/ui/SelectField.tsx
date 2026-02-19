interface SelectFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options?: { id: number | string; name: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = '選択してください',
  disabled = false,
  required = false,
  className = 'col-auto',
}: SelectFieldProps) {
  // optionsが配列でない場合は空配列として扱う（二重チェック）
  const safeOptions = Array.isArray(options) ? options : [];
  
  // デバッグ用：配列でない場合にコンソールに警告を出す
  if (!Array.isArray(options) && options !== undefined && options !== null) {
    console.warn('SelectField: options is not an array:', options);
  }
  
  return (
    <div className={className}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {safeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

