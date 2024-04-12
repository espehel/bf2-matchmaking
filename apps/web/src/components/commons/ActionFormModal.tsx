'use client';
import { MouseEventHandler, PropsWithChildren, useCallback, useRef } from 'react';
import ActionForm, { Props as ActionFormProps } from '@/components/commons/ActionForm';
import TransitionWrapper from '@/components/commons/TransitionWrapper';

interface Props extends PropsWithChildren {
  title: string;
  openBtnLabel: string;
  openBtnSize?: 'btn-sm' | 'btn-md' | 'btn-lg';
  openBtnKind?: 'btn-primary' | 'btn-secondary' | 'btn-accent';
  disabled?: boolean;
}

export default function ActionFormModal({
  title,
  openBtnLabel,
  openBtnSize = 'btn-sm',
  openBtnKind = 'btn-secondary',
  children,
  disabled,
  ...actionFormProps
}: Props & ActionFormProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const handleCloseForm: MouseEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      event.preventDefault();
      ref?.current?.close();
    },
    [ref]
  );
  return (
    <>
      <button
        className={`btn ${openBtnKind} ${openBtnSize}`}
        onClick={() => ref.current?.showModal()}
        disabled={disabled}
      >
        {openBtnLabel}
      </button>
      <dialog ref={ref} className="modal">
        <div className="modal-box">
          <ActionForm {...actionFormProps} onSuccess={() => ref.current?.close()}>
            <h3 className="font-bold text-lg">{title}</h3>
            {children}
            <div className="modal-action">
              <button type="submit" className="btn btn-primary">
                <TransitionWrapper keepSize={true}>Confirm</TransitionWrapper>
              </button>
              <button onClick={handleCloseForm} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </ActionForm>
        </div>
      </dialog>
    </>
  );
}
