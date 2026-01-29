import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Shield, XCircle, CheckCircle2, Layers } from 'lucide-react';
import { SubtleOceanBackground } from '@/components/ocean-background';
import { BlockCard } from '@/components/block-card';
import { HashDisplay } from '@/components/hash-display';
import { sha256 } from 'js-sha256';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Explorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifyData, setVerifyData] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<'verified' | 'tampered' | null>(null);
  const [activeTab, setActiveTab] = useState('blocks');

  const { data: blocks = [] } = useQuery({
    queryKey: ['/api/blocks'],
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ['/api/transactions'],
  });

  const handleVerify = () => {
    const computedHash = sha256(verifyData);
    setVerificationResult(computedHash === verifyHash ? 'verified' : 'tampered');
  };

  const handleVerifyBlock = (data: string, hash: string) => {
    setVerifyData(data);
    setVerifyHash(hash);
    setVerificationResult(null); // Reset verification result
    setActiveTab('verify'); // Switch to verification tab
    // Scroll to verification section
    setTimeout(() => {
      const verifySection = document.getElementById('verify-section');
      if (verifySection) {
        verifySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const filteredBlocks = searchQuery
    ? blocks.filter((block: any) =>
        block.blockHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.merkleRoot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.index.toString().includes(searchQuery)
      )
    : blocks;

  const filteredTransactions = searchQuery
    ? allTransactions.filter((tx: any) =>
        tx.txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.projectId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getBlockTransactions = (blockId: string) => {
    return allTransactions.filter((tx: any) => tx.blockId === blockId);
  };

  return (
    <div className="min-h-screen">
      <SubtleOceanBackground />

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <Layers className="w-8 h-8 text-primary" />
            Blockchain Explorer
          </h1>
          <p className="text-muted-foreground mt-1">
            Search and verify blockchain transactions with complete transparency
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Blockchain
            </CardTitle>
            <CardDescription>
              Search by block hash, transaction ID, block number, or project ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by block hash, transaction ID, or block number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                data-testid="input-search"
              />
              <Button onClick={() => setSearchQuery('')} variant="outline" data-testid="button-clear-search">
                Clear
              </Button>
            </div>

            {searchQuery && filteredTransactions.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold">Matching Transactions:</h3>
                {filteredTransactions.map((tx: any, index: number) => (
                  <div key={tx.id} className="p-4 rounded-lg border" data-testid={`result-transaction-${index}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-primary">{tx.credits} tons CO₂</span>
                      <Badge variant="secondary">Transaction</Badge>
                    </div>
                    <HashDisplay hash={tx.txId} label="Transaction ID" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blocks" data-testid="tab-blocks">
              <Layers className="w-4 h-4 mr-2" />
              Blockchain ({blocks.length} blocks)
            </TabsTrigger>
            <TabsTrigger value="verify" data-testid="tab-verify">
              <Shield className="w-4 h-4 mr-2" />
              Hash Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blocks" className="space-y-6 mt-6">
            {filteredBlocks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No blocks match your search' : 'No blocks in the blockchain yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredBlocks.map((block: any, index: number) => (
                  <BlockCard
                    key={block.id}
                    block={block}
                    transactions={getBlockTransactions(block.id)}
                    showChainConnection={index > 0}
                    onVerifyBlock={handleVerifyBlock}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verify" className="mt-6" id="verify-section">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Hash Verification Tool
                </CardTitle>
                <CardDescription>
                  Verify blockchain integrity by recomputing block hashes and comparing with stored records
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Informational Banner */}
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        How Block Hash Verification Works
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Block hashes are deterministic</strong> and can be verified. Expand any block above and click "Verify This Block" to auto-fill this tool with the correct data.
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Transaction IDs use random salts</strong> for security and cannot be re-verified (this is by design to prevent ID collisions).
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verify-data">Data to Verify</Label>
                  <Input
                    id="verify-data"
                    value={verifyData}
                    onChange={(e) => setVerifyData(e.target.value)}
                    placeholder="Paste the 'Original Data (pre-hash)' from a block above..."
                    data-testid="input-verify-data"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Expand any block above → Find "Block Hash Verification Data" section → Copy the "Original Data (pre-hash)" text
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verify-hash">Expected Hash (SHA-256)</Label>
                  <Input
                    id="verify-hash"
                    value={verifyHash}
                    onChange={(e) => setVerifyHash(e.target.value)}
                    placeholder="Paste the 'Block Hash' from the same block..."
                    data-testid="input-verify-hash"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 Copy the "Block Hash" from the same block (shown at the top of each block card)
                  </p>
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={!verifyData || !verifyHash}
                  className="w-full"
                  data-testid="button-verify"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Hash
                </Button>

                {verificationResult && (
                  <div
                    className={`p-6 rounded-lg border-2 text-center ${
                      verificationResult === 'verified'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-red-500 bg-red-50 dark:bg-red-950/30'
                    }`}
                    data-testid="verification-result"
                  >
                    {verificationResult === 'verified' ? (
                      <>
                        <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
                        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                          Verified ✓
                        </h3>
                        <p className="text-emerald-600 dark:text-emerald-500">
                          The computed hash matches the expected hash. Data integrity confirmed.
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-12 h-12 mx-auto text-red-600 mb-3" />
                        <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                          Tampered ✗
                        </h3>
                        <p className="text-red-600 dark:text-red-500">
                          The computed hash does not match. Data may have been tampered with.
                        </p>
                      </>
                    )}

                    {verifyData && (
                      <div className="mt-6 pt-6 border-t border-current/20">
                        <HashDisplay
                          hash={sha256(verifyData)}
                          label="Computed Hash"
                          abbreviate={false}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
