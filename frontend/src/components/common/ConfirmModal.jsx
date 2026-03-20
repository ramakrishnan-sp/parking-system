import { Modal } from './Modal';
import { GlassButton } from './GlassButton';

export const ConfirmModal = ({ open, onOpenChange, title, message, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false }) => {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="space-y-6">
        <p className="text-white/80">{message}</p>
        <div className="flex gap-3">
          <GlassButton variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
            {cancelText}
          </GlassButton>
          <GlassButton 
            className={`flex-1 ${isDestructive ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30' : ''}`}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
};
