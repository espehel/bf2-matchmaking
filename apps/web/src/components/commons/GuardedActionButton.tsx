import ActionFormModal from '@/components/commons/ActionFormModal';
import ActionButton from '@/components/ActionButton';

interface Props {
  label: string;
  guard: boolean;
  guardLabel: string;
  action: () => Promise<{ data: unknown; error: { message: string } | null }>;
  successMessage: string;
  errorMessage: string;
}

export default function GuardedActionButton({
  label,
  guard,
  guardLabel,
  ...actionProps
}: Props) {
  if (guard) {
    return (
      <ActionFormModal title={label} openBtnLabel={label} {...actionProps}>
        {guardLabel}
      </ActionFormModal>
    );
  }
  return <ActionButton {...actionProps}>{label}</ActionButton>;
}
