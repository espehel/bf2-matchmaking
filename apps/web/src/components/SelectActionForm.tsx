import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import ActionForm from '@/components/form/ActionForm';
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
  extras?: Record<string, string>;
  className?: string;
  name?: string;
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
  extras,
  className,
  name = 'select',
}: Props) {
  return (
    <ActionForm
      formAction={action}
      successMessage={successMessage}
      errorMessage={errorMessage}
      resetOnSuccess={false}
      extras={extras}
      className="w-full"
    >
      <div className="flex gap-2 items-end">
        <Select
          options={options}
          label={label}
          name={name}
          defaultValue={defaultValue}
          disabled={disabled}
          placeholder={placeholder}
          className={className}
        />
        <TransitionWrapper button={true}>
          <IconBtn
            type="submit"
            variant="secondary"
            Icon={ArrowRightCircleIcon}
            disabled={disabled}
          />
        </TransitionWrapper>
      </div>
    </ActionForm>
  );
}
