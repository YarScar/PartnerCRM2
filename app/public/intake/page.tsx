import { PublicIntakeForm } from '@/components/PublicIntakeForm';

export default function PublicIntakePage() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream p-6">
      <div className="max-w-3xl w-full">
        <h1 className="sr-only">Partnership Intake</h1>
        <PublicIntakeForm />
      </div>
    </div>
  );
}
