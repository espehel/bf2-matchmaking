import { Colors, Sizes } from '@/lib/types/daisyui';
import ActionForm, { Props as ActionFormProps } from '@/components/form/ActionForm';
import SubmitActionFormButton from '@/components/form/SubmitActionFormButton';
import InputField from '@/components/form/fields/InputField';

type Props = ActionFormProps & {
  size?: Sizes;
  kind?: Colors | 'ghost';
  inputClassName?: string;
  defaultValue?: number;
  type?: 'number' | 'text';
  placeholder: string;
  name: string;
};

export default function SingleInputActionForm({
  size,
  kind = 'primary',
  inputClassName,
  defaultValue,
  type,
  placeholder,
  name,
  ...actionFormProps
}: Props) {
  return (
    <ActionForm {...actionFormProps}>
      <div className="join">
        <InputField
          name={name}
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required
          className="join-item"
          size={size}
          kind={kind}
          label={placeholder}
        />
        <SubmitActionFormButton className="join-item" kind={kind} size={size}>
          Set
        </SubmitActionFormButton>
      </div>
    </ActionForm>
  );
}
