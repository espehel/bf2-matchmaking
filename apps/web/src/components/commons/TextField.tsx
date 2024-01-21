interface Props {
  name: string;
  label: string;
  defaultValue?: string;
  className?: string;
}

export default function TextField({ name, label, defaultValue, className }: Props) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        <span className="label-text">{label}</span>
      </label>
      <input
        className="input input-bordered w-full"
        name={name}
        defaultValue={defaultValue}
      />
    </div>
  );
}
