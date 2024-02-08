import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import ActionForm from '@/components/commons/ActionForm';
import Select from '@/components/commons/Select';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import IconBtn from '@/components/commons/IconBtn';

interface Props {
  label: string;
  options: Array<[string | number, string]>;
  defaultValue?: string | number;
  disabled?: boolean;
  action: (
    formData: FormData
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  successMessage: string;
  errorMessage: string;
  placeholder?: string;
}
export default function SelectActionForm({
  options,
  action,
  defaultValue,
  label,
  disabled,
  successMessage,
  errorMessage,
  placeholder,
}: Props) {
  return (
    <ActionForm
      action={action}
      successMessage={successMessage}
      errorMessage={errorMessage}
      resetOnSuccess={false}
    >
      <div className="flex gap-2 items-end">
        <Select
          options={options}
          label={label}
          name="select"
          defaultValue={defaultValue}
          disabled={disabled}
          placeholder={placeholder}
        />
        <TransitionWrapper button={true}>
          <IconBtn
            type="submit"
            variant="primary"
            Icon={ArrowRightCircleIcon}
            disabled={disabled}
          />
        </TransitionWrapper>
      </div>
    </ActionForm>
  );
}
