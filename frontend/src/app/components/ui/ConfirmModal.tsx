import { ReactNode } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  children,
  onConfirm,
  onCancel,
  confirmText = '保存する',
  cancelText = 'キャンセル',
  size = 'lg',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'modal-sm' : size === 'md' ? 'modal-md' : 'modal-lg';

  return (
    <div className="modal d-block" tabIndex={-1}>
      <div className={`modal-dialog ${sizeClass}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onCancel} />
          </div>
          <div className="modal-body">
            <p>{message}</p>
            {children}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onCancel}>
              {cancelText}
            </button>
            <button className="btn btn-primary" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}







