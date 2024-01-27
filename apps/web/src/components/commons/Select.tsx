interface Props {
  options: Array<[string | number, string]>;
  defaultValue?: string | number;
  placeholder?: string;
  label: string;
  name: string;
  disabled?: boolean;
}
export default function Select({
  options,
  defaultValue,
  placeholder,
  label,
  name,
  disabled,
}: Props) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        <span className="label-text">{label}</span>
      </label>
      <select
        key={defaultValue}
        name={name}
        className="select select-bordered w-full"
        defaultValue={defaultValue}
        disabled={disabled}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
