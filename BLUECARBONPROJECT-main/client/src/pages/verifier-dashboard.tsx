import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, Layers, FileCheck } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { SubtleOceanBackground } from '@/components/ocean-background';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-context';

export default function VerifierDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects/pending'],
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ['/api/projects/my-reviews'],
    enabled: !!user?.id,
  });

  const { data: blocks = [] } = useQuery({
    queryKey: ['/api/blocks'],
  });

  const reviewMutation = useMutation({
    mutationFn: ({ projectId, action, rejectionReason }: any) =>
      apiRequest('POST', `/api/projects/${projectId}/review`, { action, rejectionReason }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blocks'] });
      setSelectedProject(null);
      setShowRejectDialog(false);
      setRejectionReason('');
      toast({
        title: variables.action === 'approve' ? 'Project approved!' : 'Project rejected',
        description: variables.action === 'approve'
          ? 'Transaction created and added to blockchain'
          : 'Project has been rejected',
      });
    },
  });

  const handleApprove = (projectId: string) => {
    reviewMutation.mutate({ projectId, action: 'approve' });
  };

  const handleReject = () => {
    if (!selectedProject || !rejectionReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Rejection reason required',
        description: 'Please provide a reason for rejection',
      });
      return;
    }
    reviewMutation.mutate({
      projectId: selectedProject.id,
      action: 'reject',
      rejectionReason,
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
                    <h3 className="font-semibold mb-2">CO₂ Captured</h3>
                    <p className="text-2xl font-bold text-primary">{selectedProject.co2Captured} tons</p>
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

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Project</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide detailed feedback about why this project cannot be verified..."
                rows={4}
                data-testid="input-rejection-reason"
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
              disabled={reviewMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
