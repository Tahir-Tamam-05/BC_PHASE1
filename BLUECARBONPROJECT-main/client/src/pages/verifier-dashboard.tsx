import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, Layers, FileCheck, Map, Loader2, MessageSquare } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { SubtleOceanBackground } from '@/components/ocean-background';
import { format } from 'date-fns';
import { useState, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';
import type { Project, Block } from "@shared/schema";

// Task 2.1: Standardized rejection reason codes (mirrors server schema)
const REJECTION_REASON_CODES = [
  { value: 'INSUFFICIENT_DOCUMENTATION', label: 'Insufficient Documentation' },
  { value: 'INVALID_GIS_BOUNDARY', label: 'Invalid GIS Boundary' },
  { value: 'MRV_INCOMPLETE', label: 'MRV Data Incomplete' },
  { value: 'OWNERSHIP_UNCLEAR', label: 'Ownership Unclear' },
  { value: 'OTHER', label: 'Other (specify in comment)' },
] as const;


const GISLandMap = lazy(() => import('@/components/gis-land-map'));

export default function VerifierDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  // Task 2.1: Separate state for rejection reason code and free-text comment
  const [rejectionReasonCode, setRejectionReasonCode] = useState('');
  const [rejectionComment, setRejectionComment] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  // Task 2.1: Clarification dialog state
  const [showClarifyDialog, setShowClarifyDialog] = useState(false);
  const [clarificationNote, setClarificationNote] = useState('');

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects/pending'],
  });

  const { data: myReviews = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects/my-reviews'],
    enabled: !!user?.id,
  });

  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ['/api/blocks'],
  });


  const reviewMutation = useMutation({
    mutationFn: ({ projectId, action, rejectionReason, comment, clarificationNote }: any) =>
      apiRequest('POST', `/api/projects/${projectId}/review`, {
        action,
        rejectionReason,
        comment,
        clarificationNote,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blocks'] });
      setSelectedProject(null);
      setShowRejectDialog(false);
      setShowClarifyDialog(false);
      setRejectionReasonCode('');
      setRejectionComment('');
      setClarificationNote('');
      const actionLabels: Record<string, { title: string; description: string }> = {
        approve: { title: 'Project approved!', description: 'Transaction created and added to blockchain' },
        reject: { title: 'Project rejected', description: 'The contributor has been notified' },
        clarify: { title: 'Clarification requested', description: 'The contributor has been asked to provide more information' },
      };
      const label = actionLabels[variables.action] ?? { title: 'Done', description: '' };
      toast({ title: label.title, description: label.description });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Action failed',
        description: error?.message || 'Could not complete the review action',
      });
    },
  });

  const handleApprove = (projectId: string) => {
    reviewMutation.mutate({ projectId, action: 'approve' });
  };

  const handleReject = () => {
    if (!selectedProject || !rejectionReasonCode) {
      toast({
        variant: 'destructive',
        title: 'Rejection reason required',
        description: 'Please select a rejection reason code',
      });
      return;
    }
    reviewMutation.mutate({
      projectId: selectedProject.id,
      action: 'reject',
      rejectionReason: rejectionReasonCode,
      comment: rejectionComment || undefined,
    });
  };

  // Task 2.1: Handle clarification request
  const handleClarify = () => {
    if (!selectedProject || clarificationNote.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Clarification note required',
        description: 'Please provide at least 10 characters explaining what needs clarification',
      });
      return;
    }
    reviewMutation.mutate({
      projectId: selectedProject.id,
      action: 'clarify',
      clarificationNote,
    });
  };

  const pendingCount = projects.length;
  const reviewedCount = myReviews.length;
  const blocksCount = blocks.length;

  return (
    <div className="min-h-screen">
      <SubtleOceanBackground />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Verifier Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review and verify blue carbon projects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Pending Review"
            value={pendingCount}
            icon={FileText}
            gradient
          />
          <StatsCard
            title="My Reviews"
            value={reviewedCount}
            icon={FileCheck}
          />
          <StatsCard
            title="Blockchain Blocks"
            value={blocksCount}
            icon={Layers}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pending Projects
            </CardTitle>
            <CardDescription>Projects awaiting your verification</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No pending projects to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project: any) => (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg border hover-elevate"
                    data-testid={`card-project-${project.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-semibold ml-2">{project.location || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Area:</span>
                            <span className="font-semibold ml-2">{project.area || 'N/A'} ha</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ecosystem:</span>
                            <span className="font-semibold ml-2">{project.ecosystemType || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Annual:</span>
                            <span className="font-semibold ml-2">{project.annualCO2?.toFixed(2) || '0.00'} t/yr</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">20yr Total:</span>
                            <span className="font-semibold ml-2">{project.lifetimeCO2?.toFixed(2) || project.co2Captured?.toFixed(2) || '0.00'} tons</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedProject(project)}
                          data-testid={`button-view-${project.id}`}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(project.id)}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-approve-${project.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowClarifyDialog(true);
                          }}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-clarify-${project.id}`}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Clarify
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowRejectDialog(true);
                          }}
                          disabled={reviewMutation.isPending}
                          data-testid={`button-reject-${project.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              My Reviews
            </CardTitle>
            <CardDescription>Projects you've reviewed</CardDescription>
          </CardHeader>
          <CardContent>
            {myReviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No reviews yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Project</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Annual CO₂</th>
                      <th className="pb-3 font-medium">20-Year Total</th>
                      <th className="pb-3 font-medium">Reviewed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myReviews.map((project: any) => (
                      <tr key={project.id} className="border-b hover-elevate" data-testid={`row-review-${project.id}`}>
                        <td className="py-4 font-medium">{project.name}</td>
                        <td className="py-4">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="py-4">{project.annualCO2?.toFixed(2) || '0.00'} t/yr</td>
                        <td className="py-4">{project.lifetimeCO2?.toFixed(2) || project.co2Captured?.toFixed(2) || '0.00'} tons</td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {format(new Date(project.submittedAt), 'PP')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedProject && !showRejectDialog} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading">{selectedProject.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Location</h3>
                    <p className="text-muted-foreground">{selectedProject.location}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Ecosystem Type</h3>
                    <p className="text-muted-foreground">{selectedProject.ecosystemType}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Land Area</h3>
                    <p className="text-2xl font-bold text-primary">{selectedProject.area} hectares</p>
                    {selectedProject.landBoundary && (
                      <p className="text-xs text-muted-foreground mt-1">GIS-verified measurement</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">CO₂ Captured (20yr)</h3>
                    <p className="text-2xl font-bold text-primary">{selectedProject.co2Captured?.toFixed(2) || selectedProject.lifetimeCO2?.toFixed(2)} tons</p>
                  </div>
                </div>
                {selectedProject.landBoundary && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Map className="w-4 h-4" />
                      Land Boundary Map (Two-Factor Verification - Part 1)
                    </h3>
                    <div className="bg-muted/30 p-2 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">
                        GIS polygon drawn by contributor - verify boundaries match claimed location
                      </p>
                      <Suspense fallback={
                        <div className="h-[300px] flex items-center justify-center border rounded-lg bg-muted/50">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      }>
                        <GISLandMap
                          initialBoundary={(() => {
                            try {
                              return JSON.parse(selectedProject.landBoundary);
                            } catch {
                              return [];
                            }
                          })()}
                          onBoundaryChange={() => { }}
                          readOnly={true}
                        />
                      </Suspense>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Annual CO₂</h3>
                    <p className="text-muted-foreground">{selectedProject.annualCO2?.toFixed(2)} tons/year</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Submitted</h3>
                    <p>{format(new Date(selectedProject.submittedAt), 'PPp')}</p>
                  </div>
                </div>
                {selectedProject.proofFileUrl && (
                  <div>
                    <h3 className="font-semibold mb-2">Proof Document</h3>
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedProject.proofFileUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="w-4 h-4 mr-2" />
                        View Proof
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Task 2.1: Rejection Dialog with standardized reason codes */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Project</DialogTitle>
            <DialogDescription>
              Select a standardized rejection reason code and optionally add a comment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason-code">Rejection Reason Code *</Label>
              <Select
                value={rejectionReasonCode}
                onValueChange={setRejectionReasonCode}
              >
                <SelectTrigger id="rejection-reason-code" data-testid="select-rejection-reason">
                  <SelectValue placeholder="Select a reason code..." />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASON_CODES.map((code) => (
                    <SelectItem key={code.value} value={code.value}>
                      {code.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rejection-comment">Additional Comment (optional)</Label>
              <Textarea
                id="rejection-comment"
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Provide additional context for the contributor..."
                rows={3}
                data-testid="input-rejection-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewMutation.isPending || !rejectionReasonCode}
              data-testid="button-confirm-reject"
            >
              {reviewMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task 2.1: Clarification Request Dialog */}
      <Dialog open={showClarifyDialog} onOpenChange={setShowClarifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Request Clarification
            </DialogTitle>
            <DialogDescription>
              Ask the contributor to provide additional information before you can make a decision.
              The project status will change to "Needs Clarification".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clarification-note">Clarification Note *</Label>
              <Textarea
                id="clarification-note"
                value={clarificationNote}
                onChange={(e) => setClarificationNote(e.target.value)}
                placeholder="Describe exactly what information or documentation is needed from the contributor..."
                rows={4}
                data-testid="input-clarification-note"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. Be specific so the contributor knows exactly what to provide.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClarifyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleClarify}
              disabled={reviewMutation.isPending || clarificationNote.trim().length < 10}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-confirm-clarify"
            >
              {reviewMutation.isPending ? 'Sending...' : 'Request Clarification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
