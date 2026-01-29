import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSubmissionSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Calculator } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';

interface ProjectSubmissionFormProps {
  onSuccess: () => void;
}

export function ProjectSubmissionForm({ onSuccess }: ProjectSubmissionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [carbonEstimate, setCarbonEstimate] = useState<{ annualCO2: number; lifetimeCO2: number } | null>(null);

  const form = useForm({
    resolver: zodResolver(projectSubmissionSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      area: 0,
      ecosystemType: 'Mangrove' as 'Mangrove' | 'Seagrass' | 'Salt Marsh' | 'Coastal' | 'Other',
      userId: user?.id || '',
      proofFileUrl: '',
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('location', data.location);
      formData.append('area', data.area.toString());
      formData.append('ecosystemType', data.ecosystemType);
      
      // Add proof file if selected (optional)
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      const res = await apiRequest('POST', '/api/projects', formData);
      return await res.json();
    },
    onSuccess: (data: any) => {
      // Store carbon calculation results
      if (data.carbonCalculation) {
        setCarbonEstimate(data.carbonCalculation);
      }
      
      toast({
        title: data.message || 'Project submitted!',
        description: data.carbonCalculation 
          ? `Annual: ${data.carbonCalculation.annualCO2.toFixed(2)} tons CO₂/year • Lifetime (20yr): ${data.carbonCalculation.lifetimeCO2.toFixed(2)} tons`
          : 'Your project has been submitted for verification',
      });
      form.reset();
      setProofFile(null);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: error.message || 'Could not submit project',
      });
    },
  });

  const onSubmit = (data: any) => {
    submitMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          {...form.register('name')}
          placeholder="Mangrove Restoration Initiative"
          data-testid="input-project-name"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Describe your blue carbon project, including location, methods, and impact..."
          rows={4}
          data-testid="input-project-description"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          {...form.register('location')}
          placeholder="e.g., Caribbean Sea, Pacific Islands, Southeast Asia"
          data-testid="input-location"
        />
        {form.formState.errors.location && (
          <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Include region or country for accurate carbon calculations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="area">Area (hectares) *</Label>
          <Input
            id="area"
            type="number"
            step="0.01"
            min="0"
            {...form.register('area', { valueAsNumber: true })}
            placeholder="100"
            data-testid="input-area"
          />
          {form.formState.errors.area && (
            <p className="text-sm text-destructive">{form.formState.errors.area.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ecosystemType">Ecosystem Type *</Label>
          <Select 
            value={form.watch('ecosystemType')}
            onValueChange={(value) => form.setValue('ecosystemType', value as any)}
          >
            <SelectTrigger id="ecosystemType" data-testid="select-ecosystem-type">
              <SelectValue placeholder="Select ecosystem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mangrove" data-testid="option-mangrove">Mangrove (8.0 t/ha/yr)</SelectItem>
              <SelectItem value="Seagrass" data-testid="option-seagrass">Seagrass (5.5 t/ha/yr)</SelectItem>
              <SelectItem value="Salt Marsh" data-testid="option-salt-marsh">Salt Marsh (4.5 t/ha/yr)</SelectItem>
              <SelectItem value="Coastal" data-testid="option-coastal">Coastal (3.5 t/ha/yr)</SelectItem>
              <SelectItem value="Other" data-testid="option-other">Other (2.0 t/ha/yr)</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.ecosystemType && (
            <p className="text-sm text-destructive">{form.formState.errors.ecosystemType.message}</p>
          )}
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Calculator className="w-4 h-4" />
          <span>Carbon Sequestration Estimate</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on area, ecosystem type, and location, the backend will calculate annual and 20-year CO₂ sequestration after submission.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proof-file">Proof Document (optional)</Label>
        <div className="flex items-center gap-4">
          <Input
            id="proof-file"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="hidden"
            data-testid="input-proof-file"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('proof-file')?.click()}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {proofFile ? proofFile.name : 'Upload Proof Document'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload evidence such as satellite imagery, reports, or certifications
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={submitMutation.isPending || uploadingProof}
        data-testid="button-submit-project-form"
      >
        {submitMutation.isPending || uploadingProof ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {uploadingProof ? 'Uploading proof...' : 'Submitting...'}
          </>
        ) : (
          'Submit Project'
        )}
      </Button>
    </form>
  );
}
