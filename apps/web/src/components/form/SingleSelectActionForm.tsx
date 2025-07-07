'use client';
import { Colors, Sizes } from '@/lib/types/daisyui';
import ActionForm, { Props as ActionFormProps } from '@/components/form/ActionForm';
import SelectField from '@/components/form/fields/SelectField';

type Props = Omit<ActionFormProps, 'defaultValue'> & {
  size?: Sizes;
  kind?: Colors | 'ghost';
  defaultValue?: string | number | null;
  type?: 'number' | 'text';
  placeholder?: string;
  label?: string;
  name: string;
  options: Array<[string | number | undefined, string]> | Array<string>;
};

export default function SingleSelectActionForm({
  size,
  kind = 'primary',
  defaultValue,
  type,
  placeholder,
  label,
  name,
  options,
  ...actionFormProps
}: Props) {
  return (
    <ActionForm {...actionFormProps}>
      <SelectField
        options={options}
        kind={kind}
        size={size}
        defaultValue={defaultValue}
        placeholder={placeholder}
        label={label}
        name={name}
        onChange={(e) => {
          e.target.form?.requestSubmit();
        }}
      />
    </ActionForm>
  );
}
