import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, XCircle, Layers, FileCheck, Map, Loader2, MessageSquare, Satellite, Shield, Clock, CheckCircle2, TrendingUp, TrendingDown, Award, Zap, Activity } from 'lucide-react';
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
  { value: 'RJ-01', label: 'RJ-01: Invalid Boundary / GIS Discrepancy' },
  { value: 'RJ-02', label: 'RJ-02: Incorrect Ecosystem Classification' },
  { value: 'RJ-03', label: 'RJ-03: Insufficient Documentation / Proof' },
  { value: 'RJ-04', label: 'RJ-04: Ownership / Land Title Unclear' },
  { value: 'RJ-05', label: 'RJ-05: Other (Specify in Comment)' },
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

  const { data: verifierStatus } = useQuery<any>({
    queryKey: ['/api/verifier/status'],
    refetchInterval: 30000,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects/pending'],
    refetchInterval: 30000,
  });

  const { data: myReviews = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects/my-reviews'],
    enabled: !!user?.id,
    refetchInterval: 30000,
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
      queryClient.invalidateQueries({ queryKey: ['/api/verifier/status'] });
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

  const perf = verifierStatus?.performance || { verified: 0, rejected: 0, totalCO2: 0, avgReviewTime: 1.8 };
  const trustScore = verifierStatus?.trustScore ?? 100;
  const mintingEnabled = verifierStatus?.mintingEnabled ?? true;
  const warningCount = verifierStatus?.warningCount ?? 0;

  // Workload indicator (0-3 Low, 4-8 Moderate, 9+ High)
  const getWorkloadStatus = () => {
    if (pendingCount === 0) return { label: 'No Pending', color: 'text-muted-foreground', bg: 'bg-muted' };
    if (pendingCount <= 3) return { label: 'Low Workload', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
    if (pendingCount <= 8) return { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' };
    return { label: 'High Workload', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };
  const workload = getWorkloadStatus();

  return (
    <div className="min-h-screen">
      <SubtleOceanBackground />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Verifier Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review and verify blue carbon projects</p>
        </div>

        {/* Dual-Layer Verification Framework Banner */}
        <Card className="relative overflow-hidden border-0 bg-slate-950 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32" />
          <CardContent className="relative p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <Shield className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Dual-Layer Verification Framework</h2>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                  BlueCarbon Ledger implements a rigid MRV standard. Every project undergoes
                  <strong> GIS boundary mapping (Phase 1)</strong> for baseline area verification,
                  followed by <strong>MRV satellite trend analysis (Phase 2)</strong> to certify long-term sequestration.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-w-[240px]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Phase 1 Active</p>
                    <p className="text-xs font-medium text-slate-200">GIS Mapping Tools</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md opacity-60">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Phase 2 Planned</p>
                    <p className="text-xs font-medium text-slate-200">MRV Satellite Analysis</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Verifier Performance & Workload Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance Stats */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3 border-b border-muted/30 mb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-500" />
                Verifier Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Verified</span>
                  </div>
                  <p className="text-2xl font-bold">{perf.verified}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Rejected</span>
                  </div>
                  <p className="text-2xl font-bold">{perf.rejected}</p>
                </div>
                <div className="p-4 rounded-xl bg-cyan-50/50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-800/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-cyan-600 dark:text-cyan-400">
                    <Award className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">CO₂ Certified</span>
                  </div>
                  <p className="text-2xl font-bold">{perf.totalCO2.toFixed(0)} <span className="text-xs font-normal">t</span></p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Avg Review</span>
                  </div>
                  <p className="text-2xl font-bold">{perf.avgReviewTime} <span className="text-xs font-normal">days</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Workload */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-cyan-900/20 shadow-lg">
              <div className="bg-cyan-900 h-1" />
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Status Board
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${workload.bg} ${workload.color}`}>
                    {workload.label}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 divide-x dark:divide-muted/20">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Minting Status</p>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <div className={`w-2 h-2 rounded-full ${mintingEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      {mintingEnabled ? 'ON' : 'OFF'}
                    </div>
                  </div>
                  <div className="pl-3">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Warnings</p>
                    <p className="text-sm font-bold">{warningCount}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-muted/20">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Verifier Trust Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${trustScore}%` }} />
                    </div>
                    <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{trustScore}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium">Role: <span className="text-primary font-bold">Verifier Console</span></span>
                </div>
              </CardContent>
            </Card>
          </div>
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
                {projects.map((project: any) => {
                  const isRemoved = project.isListed === false;
                  return (
                    <div
                      key={project.id}
                      className={`p-4 rounded-lg border hover-elevate ${isRemoved ? 'opacity-75 grayscale-[0.5] bg-muted/20' : ''}`}
                      data-testid={`card-project-${project.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <div className="flex gap-1">
                              {isRemoved ? (
                                <span className="px-2 py-0.5 text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-full font-bold uppercase">Removed by Admin ❌</span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase">Listed ✅</span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm flex-wrap">
                            <div>
                              <span className="text-muted-foreground">Area:</span>
                              <span className="font-semibold ml-1">{project.area} ha</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Estimated CO₂:</span>
                              <span className="font-semibold ml-1">{project.lifetimeCO2?.toFixed(0) || project.co2Captured?.toFixed(0)} t</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ecosystem:</span>
                              <span className="font-semibold ml-1">{project.ecosystemType}</span>
                            </div>
                          </div>
                          {/* Verification Progress Indicator */}
                          <div className="mt-3 p-2 rounded-md bg-muted/30 border border-muted/50 max-w-fit">
                            <div className="flex items-center gap-3 text-[11px] font-medium">
                              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                GIS Boundary Verified
                              </div>
                              <div className="w-px h-3 bg-muted-foreground/30" />
                              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                <Clock className="w-3.5 h-3.5" />
                                MRV Satellite Pending
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[140px]">
                          {!mintingEnabled ? (
                            <div className="text-[10px] text-red-500 font-bold uppercase text-center mb-1">
                              Verification paused by Admin
                            </div>
                          ) : isRemoved && (
                            <div className="text-[10px] text-red-500 font-bold uppercase text-center mb-1">
                              Project removed from Marketplace
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProject(project)}
                            data-testid={`button-view-${project.id}`}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Review Project
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(project.id)}
                            disabled={reviewMutation.isPending || !mintingEnabled || isRemoved}
                            className="bg-emerald-600 hover:bg-emerald-700"
                            data-testid={`button-approve-${project.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify & Mint
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSelectedProject(project);
                              setShowClarifyDialog(true);
                            }}
                            disabled={reviewMutation.isPending || isRemoved}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Request Clarification
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              My History
            </CardTitle>
            <CardDescription>Comprehensive log of your past verification decisions</CardDescription>
          </CardHeader>
          <CardContent>
            {myReviews.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                <Shield className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">No verification projects found in your history.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                      <th className="pb-3 font-bold">Project</th>
                      <th className="pb-3 font-bold">Result</th>
                      <th className="pb-3 font-bold">Phase</th>
                      <th className="pb-3 font-bold">Credits</th>
                      <th className="pb-3 font-bold text-center">Date</th>
                      <th className="pb-3 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30">
                    {myReviews.map((project: any) => {
                      const isApproved = project.status === 'verified' || project.status === 'verified_phase1';
                      const isRejected = project.status === 'rejected';
                      return (
                        <tr key={project.id} className="hover:bg-muted/5 transition-colors">
                          <td className="py-4">
                            <p className="font-semibold text-sm">{project.name}</p>
                            <p className="text-[10px] text-muted-foreground">{project.ecosystemType}</p>
                          </td>
                          <td className="py-4">
                            {isApproved ? (
                              <span className="text-emerald-600 font-bold text-xs uppercase tracking-tighter flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Approved
                              </span>
                            ) : isRejected ? (
                              <span className="text-red-500 font-bold text-xs uppercase tracking-tighter flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Rejected
                              </span>
                            ) : (
                              <span className="text-amber-500 font-bold text-xs uppercase tracking-tighter flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="text-[10px] font-bold bg-cyan-500/10 text-cyan-600 px-2 py-0.5 rounded border border-cyan-500/10">Phase 1</span>
                          </td>
                          <td className="py-4">
                            <p className="text-sm font-bold">{project.lifetimeCO2?.toFixed(0) || project.co2Captured?.toFixed(0) || '0'} <span className="text-[10px] font-normal text-muted-foreground">t</span></p>
                          </td>
                          <td className="py-4 text-center text-xs text-muted-foreground">
                            {format(new Date(project.submittedAt), 'MMM d, yyyy')}
                          </td>
                          <td className="py-4 text-right">
                            {isApproved ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase shadow-sm shadow-emerald-500/20">Minted</span>
                            ) : isRejected ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-muted-foreground text-[9px] font-black uppercase">Archived</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase italic">In Review</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Verification Activity
            </CardTitle>
            <CardDescription>Real-time audit log of your contributions</CardDescription>
          </CardHeader>
          <CardContent>
            {myReviews.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-sm">No recent activity</div>
            ) : (
              <div className="relative space-y-6 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                {myReviews.slice(0, 5).map((project: any) => (
                  <div key={project.id} className="relative pl-10">
                    <div className={`absolute left-0 top-1 w-9 h-9 rounded-full border-4 border-background flex items-center justify-center shadow-sm ${project.status === 'verified' ? 'bg-emerald-500 text-white' :
                      project.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
                      }`}>
                      {project.status === 'verified' ? <CheckCircle2 className="w-4 h-4" /> :
                        project.status === 'rejected' ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{project.name}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(project.submittedAt), 'PPp')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {project.status === 'verified' ? (
                          <>Action: <span className="text-emerald-500 font-bold">Approved</span> • Verified <span className="font-bold">{project.lifetimeCO2?.toFixed(0) || project.co2Captured?.toFixed(0)}t CO₂</span></>
                        ) : project.status === 'rejected' ? (
                          <>Action: <span className="text-red-500 font-bold">Rejected</span> • Standard Code Applied</>
                        ) : (
                          <>Action: <span className="text-amber-500 font-bold">Pending</span> • Awaiting verification session</>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedProject && !showRejectDialog && !showClarifyDialog} onOpenChange={() => setSelectedProject(null)}>
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
                      Phase 1 – GIS Verification
                    </h3>
                    <div className="bg-muted/30 p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Completed</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        GIS boundary mapping confirms project area and ecosystem classification.
                      </p>
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

                {/* Phase 2 - MRV Satellite Verification */}
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Satellite className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold">Phase 2 – MRV Satellite Verification</h3>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                      Planned
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    MRV satellite verification will analyze historical vegetation and carbon trends using multi-year satellite imagery.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This feature will be integrated in future platform versions.
                  </p>
                </div>
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
