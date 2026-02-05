import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import IconBtn from '@/components/commons/IconBtn';
import ActionForm from './ActionForm';
import { FormActionFunction } from '@/lib/types/form';
import SelectField, { SelectFieldProps } from '@/components/form/fields/SelectField';
import classNames from 'classnames';
import SubmitActionFormButton from './SubmitActionFormButton';

interface Props extends SelectFieldProps {
  action: FormActionFunction;
  extras?: Record<string, string>;
}
export default function SelectActionForm({
  action,
  extras,
  className,
  ...selectFieldProps
}: Props) {
  const selectClasses = classNames('join-item', className);
  return (
    <ActionForm formAction={action} extras={extras}>
      <div className="join">
        <SelectField className={selectClasses} {...selectFieldProps} />
        <SubmitActionFormButton
          kind={selectFieldProps.kind}
          className="join-item"
          disabled={selectFieldProps.disabled}
        >
          <ArrowRightCircleIcon className="size-8" />
        </SubmitActionFormButton>
      </div>
    </ActionForm>
  );
}
