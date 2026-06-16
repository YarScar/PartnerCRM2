import { PublicIntakeForm } from '@/components/PublicIntakeForm';

export default function PublicIntakePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold">Partnership Intake</h1>
          <p className="text-ink/60 mt-2">Please fill out this short form to start the intake process.</p>
        </div>
        <PublicIntakeForm />
      </div>
    </div>
  );
}
