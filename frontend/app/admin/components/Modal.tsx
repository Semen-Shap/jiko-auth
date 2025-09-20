'use client';

import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white mx-auto mt-20 p-0 rounded-xl w-11/12 max-w-md shadow-2xl">
                <div className="p-6 pb-4 flex justify-between items-center border-b border-gray-100">
                    <h3 className="m-0 text-gray-800 font-bold">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-xl font-bold cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
                    >
                        &times;
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Удалить',
    cancelText = 'Отмена'
}: ConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="p-6">
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}