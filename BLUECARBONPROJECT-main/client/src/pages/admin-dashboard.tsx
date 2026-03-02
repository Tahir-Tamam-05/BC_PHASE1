import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText, Users, Layers, TrendingUp, Download, UserCheck,
  ShoppingCart, Leaf, ShieldAlert, History, AlertTriangle,
  Gavel, Search, Filter, ArrowDownToLine, Trash2,
  AlertCircle, Activity, Settings, Database
} from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { StatusBadge } from '@/components/status-badge';
import { SubtleOceanBackground } from '@/components/ocean-background';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Project, User, Block } from "@shared/schema";

type DashboardStats = {
  totalProjects: number;
  verifiedProjects: number;
  totalCO2Captured: number;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [warningData, setWarningData] = useState({ contributorId: '', message: '', severity: 'Medium' });

  const [rollbackId, setRollbackId] = useState('');
  const [rollbackType, setRollbackType] = useState('Transaction');
  const [rollbackReason, setRollbackReason] = useState('');

  // Data fetching
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/stats'],
    refetchInterval: 30000, // Auto-refresh 30s
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    refetchInterval: 30000,
  });

  const { data: verifiers = [] } = useQuery<User[]>({
    queryKey: ['/api/users/verifiers'],
  });

  const { data: blocks = [] } = useQuery<Block[]>({
    queryKey: ['/api/blocks'],
  });

  const { data: topBuyers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/top-buyers'],
    refetchInterval: 30000,
  });

  const { data: topContributors = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/top-contributors'],
    refetchInterval: 30000,
  });

  const { data: ledger = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/ledger'],
    refetchInterval: 30000,
  });

  const { data: mintingStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/admin/minting-status'],
  });

  // Mutations
  const updateMintingStatus = useMutation({
    mutationFn: (enabled: boolean) => apiRequest('PATCH', '/api/admin/minting-status', { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/minting-status'] });
      toast({ title: 'System Setting Updated', description: `Minting status changed.` });
    },
  });

  const removeProject = useMutation({
    mutationFn: (projectId: string) => apiRequest('POST', `/api/admin/projects/${projectId}/remove`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Marketplace Updated', description: 'Project has been hidden from marketplace' });
    },
  });

  const issueWarning = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/warnings', data),
    onSuccess: () => {
      toast({ title: 'Warning Issued', description: 'Contributor has been notified of the warning.' });
      setWarningData({ contributorId: '', message: '', severity: 'Medium' });
    },
  });

  const rollbackAction = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/rollback', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ledger'] });
      toast({ title: 'Rollback Successful', description: 'Action has been recorded and transaction marked as rolled back.' });
    },
  });

  // Filtered queries
  const filteredLedger = useMemo(() => {
    if (!ledgerSearch) return ledger;
    const s = ledgerSearch.toLowerCase();
    return ledger.filter(item =>
      item.txId?.toLowerCase().includes(s) ||
      item.projectName?.toLowerCase().includes(s) ||
      item.buyerName?.toLowerCase().includes(s) ||
      item.contributorName?.toLowerCase().includes(s)
    );
  }, [ledger, ledgerSearch]);

  const exportCSV = () => {
    if (ledger.length === 0) return;
    const headers = ['Date', 'Transaction ID', 'Type', 'Project', 'Contributor', 'Buyer', 'Credits', 'Status'];
    const rows = ledger.map(item => [
      format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm'),
      item.txId,
      item.type,
      item.projectName || 'N/A',
      item.contributorName || 'N/A',
      item.buyerName || 'N/A',
      item.credits,
      item.status
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BlueCarbon_Ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    toast({ title: 'Export Complete', description: 'Master ledger exported to CSV.' });
  };

  return (
    <div className="min-h-screen pb-12">
      <SubtleOceanBackground />

      <div className="container mx-auto px-6 pt-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-6 h-6 text-primary" />
              <h1 className="text-4xl font-heading font-bold tracking-tight text-foreground">Governance Console</h1>
            </div>
            <p className="text-muted-foreground text-lg">Central control authority for the BlueCarbon ecosystem</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">System Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${mintingStatus?.enabled ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-medium">{mintingStatus?.enabled ? 'Systems Operational' : 'Minting Paused'}</span>
              </div>
            </div>
            <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5 transition-all" onClick={exportCSV}>
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Export General Ledger
            </Button>
          </div>
        </div>

        {/* Global Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-background/50 backdrop-blur-md border border-primary/10 p-1 rounded-xl h-14">
            <TabsTrigger value="overview" className="px-8 h-12 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="ledger" className="px-8 h-12 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <History className="w-4 h-4 mr-2" />
              Master Ledger
            </TabsTrigger>
            <TabsTrigger value="governance" className="px-8 h-12 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              <Gavel className="w-4 h-4 mr-2" />
              Authority
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard title="Carbon Managed" value={`${(stats?.totalCO2Captured || 0).toLocaleString()}t`} icon={Leaf} gradient />
              <StatsCard title="Active Projects" value={stats?.totalProjects || 0} icon={FileText} />
              <StatsCard title="Protocol Verification" value={stats?.verifiedProjects || 0} icon={UserCheck} />
              <StatsCard title="Ledger Entries" value={ledger.length} icon={Layers} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Buyers */}
              <Card className="border-primary/10 bg-card/60 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-3 border-b border-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        Top Buyers
                      </CardTitle>
                      <CardDescription>By total credits acquired</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {topBuyers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground italic">No buyers recorded yet</div>
                  ) : (
                    <div className="space-y-4">
                      {topBuyers.slice(0, 5).map((buyer, idx) => (
                        <div key={buyer.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/30 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-muted-foreground w-4">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-foreground text-sm">{buyer.name || 'Anonymous Buyer'}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{buyer.id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{parseFloat(buyer.credits).toFixed(2)}t</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">${parseFloat(buyer.amount).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card className="border-primary/10 bg-card/60 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-3 border-b border-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-emerald-500" />
                        Top Contributors
                      </CardTitle>
                      <CardDescription>By total credits generated</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {topContributors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground italic">No contributors registered yet</div>
                  ) : (
                    <div className="space-y-4">
                      {topContributors.slice(0, 5).map((contributor, idx) => (
                        <div key={contributor.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-muted-foreground w-4">{idx + 1}</span>
                            <div>
                              <p className="font-bold text-foreground text-sm">{contributor.name}</p>
                              <p className="text-xs text-muted-foreground italic">{contributor.projectsCount} Projects</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">{parseFloat(contributor.credits).toFixed(2)}t</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">CO2 OFFSET</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Governance Snapshot */}
              <Card className="border-primary/10 bg-card/60 backdrop-blur-sm shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Settings className="w-24 h-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-xl">System Control</CardTitle>
                  <CardDescription>Real-time governance parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-primary/5">
                    <div className="space-y-1">
                      <p className="font-bold text-sm">Credit Minting</p>
                      <p className="text-xs text-muted-foreground">Global verification issuance status</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase tracking-tighter ${mintingStatus?.enabled ? 'text-emerald-500' : 'text-red-500'}`}>
                        {mintingStatus?.enabled ? 'Enabled' : 'Paused'}
                      </span>
                      <Switch
                        checked={mintingStatus?.enabled}
                        onCheckedChange={(checked) => updateMintingStatus.mutate(checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Personnel</p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {verifiers.slice(0, 5).map((v) => (
                          <div key={v.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-background bg-primary/20 flex items-center justify-center text-[10px] font-bold">
                            {v.name?.slice(0, 2).toUpperCase()}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">{verifiers.length} Authorized Verifiers</p>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12"
                    onClick={() => setActiveTab('governance')}
                  >
                    Manage Control Authority
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ledger" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-primary/10 bg-card/60 backdrop-blur-sm shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap pb-6 border-b border-primary/5">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Master General Ledger</CardTitle>
                    <CardDescription>Full immutable history of all platform operations</CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search IDs, Projects, Parties..."
                      className="pl-10 h-11 bg-background/50"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon" className="h-11 w-11">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Timestamp</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Transaction ID</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Activity</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Project</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Parties</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Volume</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-widest py-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLedger.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                          No ledger entries found matching your query
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLedger.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-primary/5 transition-colors border-b border-primary/5 group">
                          <TableCell className="py-4 text-sm font-medium">
                            {format(new Date(tx.timestamp), 'MMM dd, HH:mm')}
                          </TableCell>
                          <TableCell className="py-4">
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                              {tx.txId || tx.id.slice(-8).toUpperCase()}
                            </code>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${tx.type === 'Mint' ? 'bg-emerald-500' :
                                tx.type === 'Buy' ? 'bg-blue-500' :
                                  'bg-amber-500'
                                }`} />
                              <span className="font-bold text-sm">{tx.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 font-semibold text-sm max-w-[150px] truncate">
                            {tx.projectName || '—'}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-xs space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground w-8 uppercase tracking-tighter font-bold opacity-50">From:</span>
                                <span className="font-medium truncate max-w-[100px]">{tx.contributorName || 'System'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground w-8 uppercase tracking-tighter font-bold opacity-50">To:</span>
                                <span className="font-medium truncate max-w-[100px]">{tx.buyerName || 'Contr.'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 font-bold text-primary">
                            {tx.credits.toFixed(2)}t
                          </TableCell>
                          <TableCell className="py-4">
                            <StatusBadge status={tx.status?.toLowerCase() || 'completed'} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="governance" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Marketplace Integrity & Removal */}
              <Card className="border-red-500/10 bg-card/60 backdrop-blur-sm shadow-xl">
                <CardHeader className="border-b border-red-500/5 pb-4">
                  <CardTitle className="text-xl flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Trash2 className="w-5 h-5" />
                    Inventory Control
                  </CardTitle>
                  <CardDescription>Soft-delete and marketplace visibility management</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Admins can remove credits from the marketplace. This is a "soft delete" that preserves blockchain integrity while stopping future sales.
                  </p>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                    {projects.filter(p => p.status === 'verified').map(project => (
                      <div key={project.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/10 bg-background/50">
                        <div>
                          <p className="font-bold text-sm">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.creditsEarned.toFixed(2)}t Available</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Remove "${project.name}" from marketplace?`)) {
                              removeProject.mutate(project.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contributor Warnings */}
              <Card className="border-amber-500/10 bg-card/60 backdrop-blur-sm shadow-xl">
                <CardHeader className="border-b border-amber-500/5 pb-4">
                  <CardTitle className="text-xl flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                    Behavioral Enforcement
                  </CardTitle>
                  <CardDescription>Issue system warnings and governance notifications</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Select Target Contributor</p>
                    <Select
                      value={warningData.contributorId}
                      onValueChange={(v) => setWarningData({ ...warningData, contributorId: v })}
                    >
                      <SelectTrigger className="bg-background/50 h-11">
                        <SelectValue placeholder="Select contributor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(p => p.userId).filter((v, i, a) => a.indexOf(v) === i).map(id => (
                          <SelectItem key={id} value={id}>UID: {id.slice(0, 12)}...</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <p className="text-sm font-semibold">Warning Message</p>
                    <Textarea
                      placeholder="Detailed reason for warning..."
                      className="bg-background/50 min-h-[100px]"
                      value={warningData.message}
                      onChange={(e) => setWarningData({ ...warningData, message: e.target.value })}
                    />

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-2">Severity Level</p>
                        <Select
                          value={warningData.severity}
                          onValueChange={(v) => setWarningData({ ...warningData, severity: v })}
                        >
                          <SelectTrigger className="bg-background/50 h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">Low (Informational)</SelectItem>
                            <SelectItem value="Medium">Medium (Cautionary)</SelectItem>
                            <SelectItem value="Critical">Critical (Action Required)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="mt-6 h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold px-8"
                        onClick={() => issueWarning.mutate(warningData)}
                        disabled={!warningData.contributorId || !warningData.message}
                      >
                        Issue Formal Warning
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rollback Authority */}
              <Card className="border-primary/10 bg-card/60 backdrop-blur-sm shadow-xl md:col-span-2">
                <CardHeader className="border-b border-primary/5 pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Administrative Rollback Authority
                  </CardTitle>
                  <CardDescription>Emergency correction of erroneous or fraudulent transactions</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <p className="text-sm text-muted-foreground">
                        This tool allows admins to mark a transaction as "Rolled Back". While the original block remains (immutability), the platform logic will treat the transaction as voided.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Transaction ID (TX-...) or Database ID"
                          value={rollbackId}
                          onChange={(e) => setRollbackId(e.target.value)}
                        />
                        <Select value={rollbackType} onValueChange={setRollbackType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Action Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Credit mint">Credit Minting</SelectItem>
                            <SelectItem value="Transaction">Sales Transaction</SelectItem>
                            <SelectItem value="Marketplace listing">Marketplace Listing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        placeholder="Specific reason for rollback (Audit Log requirement)..."
                        value={rollbackReason}
                        onChange={(e) => setRollbackReason(e.target.value)}
                      />
                      <Button
                        variant="destructive"
                        className="w-full h-12 font-bold"
                        onClick={() => {
                          if (rollbackId && rollbackReason) {
                            if (confirm(`Perform emergency rollback on ${rollbackId}?`)) {
                              rollbackAction.mutate({
                                targetId: rollbackId,
                                type: rollbackType,
                                reason: rollbackReason
                              });
                            }
                          } else {
                            toast({ title: 'Input Required', description: 'Please provide ID and Reason.', variant: 'destructive' });
                          }
                        }}
                      >
                        Perform Emergency Rollback
                      </Button>
                    </div>

                    <div className="flex-1 bg-background/40 rounded-2xl border border-primary/5 p-4">
                      <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                        <AlertCircle className="w-4 h-4" />
                        Compliance Notice
                      </h4>
                      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
                        <p>1. Every rollback action is cryptographically linked to your Admin ID.</p>
                        <p>2. Rollbacks are audited by external observers through the public blockchain API.</p>
                        <p>3. Carbon credits involved in a rolled-back transaction are NOT automatically restored unless "Credit Mint" type is selected.</p>
                        <p>4. Use only for documented fraud or critical data entry errors.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

