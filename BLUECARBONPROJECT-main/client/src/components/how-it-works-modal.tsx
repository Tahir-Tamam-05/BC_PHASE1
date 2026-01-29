import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, FileText, Shield, Link2, CheckCircle2, ChevronRight } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Project Submission',
    description: 'Users submit blue carbon projects with details about CO₂ captured and upload proof documents. Each project is recorded in our system awaiting verification.',
  },
  {
    icon: Shield,
    title: 'Verifier Review',
    description: 'Authorized verifiers review project submissions and proof documents. They can approve or reject projects based on evidence quality and environmental impact.',
  },
  {
    icon: Link2,
    title: 'Blockchain Recording',
    description: 'Approved projects generate blockchain transactions with cryptographic hashes (SHA-256). Transactions are grouped into immutable blocks with Merkle roots for tamper-proof verification.',
  },
  {
    icon: CheckCircle2,
    title: 'Transparent Ledger',
    description: 'All transactions and blocks are publicly viewable in the blockchain explorer. Anyone can verify data integrity by checking hashes, ensuring complete transparency.',
  },
];

interface HowItWorksModalProps {
  children?: React.ReactNode;
}

export function HowItWorksModal({ children }: HowItWorksModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" data-testid="button-how-it-works">
            <HelpCircle className="w-4 h-4 mr-2" />
            How it works
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">How BlueCarbon Ledger Works</DialogTitle>
          <DialogDescription>
            Understanding blockchain transparency for carbon credit verification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all ${
                  isActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      isActive || isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      {index + 1}. {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep ? 'bg-primary w-6' : 'bg-muted'
                  }`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
