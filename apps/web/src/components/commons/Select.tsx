interface Props {
  options: Array<[string | number, string]>;
  defaultValue?: string | number;
  placeholder?: string;
  label: string;
  name: string;
}
export default function Select({
  options,
  defaultValue,
  placeholder,
  label,
  name,
}: Props) {
  return (
    <div className="form-control grow">
      <label className="label" htmlFor={name}>
        <span className="label-text">{label}</span>
      </label>
      <select
        name={name}
        className="select select-bordered"
        defaultValue={defaultValue}
        placeholder={placeholder}
      >
        {options.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
