import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSubmissionSchema } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, Calculator, Map } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';

const GISLandMap = lazy(() => import('@/components/gis-land-map'));

interface ProjectSubmissionFormProps {
  onSuccess: () => void;
}

interface LatLng {
  lat: number;
  lng: number;
}

export function ProjectSubmissionForm({ onSuccess }: ProjectSubmissionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [carbonEstimate, setCarbonEstimate] = useState<{ annualCO2: number; lifetimeCO2: number } | null>(null);
  const [landBoundary, setLandBoundary] = useState<LatLng[]>([]);
  const [gisArea, setGisArea] = useState<number>(0);
  const [useManualArea, setUseManualArea] = useState(false);

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

  const handleBoundaryChange = (boundary: LatLng[], area: number) => {
    setLandBoundary(boundary);
    setGisArea(area);
    if (area > 0) {
      form.setValue('area', area);
    }
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('location', data.location);
      formData.append('area', data.area.toString());
      formData.append('ecosystemType', data.ecosystemType);
      
      if (landBoundary.length > 0) {
        formData.append('landBoundary', JSON.stringify(landBoundary));
      }
      
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      const res = await apiRequest('POST', '/api/projects', formData);
      return await res.json();
    },
    onSuccess: (data: any) => {
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
      setLandBoundary([]);
      setGisArea(0);
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
    if (!useManualArea && landBoundary.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Land boundary required',
        description: 'Please draw your land boundary on the map or switch to manual area entry',
      });
      return;
    }
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Land Area Measurement *
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setUseManualArea(!useManualArea)}
          >
            {useManualArea ? 'Use Map Drawing' : 'Enter Manually'}
          </Button>
        </div>

        {useManualArea ? (
          <div className="space-y-2">
            <Input
              id="area"
              type="number"
              step="0.01"
              min="0"
              {...form.register('area', { valueAsNumber: true })}
              placeholder="Enter area in hectares"
              data-testid="input-area"
            />
            {form.formState.errors.area && (
              <p className="text-sm text-destructive">{form.formState.errors.area.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              For accurate measurements, we recommend using the map drawing tool
            </p>
          </div>
        ) : (
          <Suspense fallback={
            <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted/50">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <GISLandMap
              onBoundaryChange={handleBoundaryChange}
              readOnly={false}
            />
          </Suspense>
        )}

        {!useManualArea && gisArea > 0 && (
          <input type="hidden" {...form.register('area', { valueAsNumber: true })} value={gisArea} />
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
