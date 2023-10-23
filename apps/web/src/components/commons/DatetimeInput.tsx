import moment from 'moment';

interface Props {
  defaultValue?: string;
  min?: string;
  max?: string;

  label: string;
  name: string;
}
export default function DatetimeInput({ label, name, defaultValue, min, max }: Props) {
  return (
    <div className="form-control grow">
      <label className="label" htmlFor={name}>
        <span className="label-text">{label}</span>
        <span className="label-text-alt">{`Timezone: ${
          Intl.DateTimeFormat().resolvedOptions().timeZone
        }`}</span>
      </label>
      <input
        className="input input-bordered"
        type="datetime-local"
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
      />
      <input
        type="hidden"
        id="timezone"
        name="timezone"
        value={Intl.DateTimeFormat().resolvedOptions().timeZone}
      />
    </div>
  );
}
