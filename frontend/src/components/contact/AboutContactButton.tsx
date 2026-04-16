'use client';
import { useContactModal } from '../../context/ContactModalContext';

export default function AboutContactButton({ label }: { label: string }) {
  const { open } = useContactModal();
  return (
    <button
      onClick={open}
      className="px-8 py-3 btn-primary rounded-xl text-sm font-semibold"
    >
      {label}
    </button>
  );
}
