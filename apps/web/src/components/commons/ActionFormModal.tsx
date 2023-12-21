'use client';
import { MouseEventHandler, PropsWithChildren, useCallback, useRef } from 'react';
import ActionForm, { Props as ActionFormProps } from '@/components/commons/ActionForm';

interface Props extends PropsWithChildren {
  title: string;
  openBtnLabel: string;
}

export default function ActionFormModal({
  title,
  openBtnLabel,
  children,
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
        className="btn btn-sm btn-secondary"
        onClick={() => ref.current?.showModal()}
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
                Confirm
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
