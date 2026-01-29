import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Layers, Clock, Copy, CheckCircle2, Shield } from 'lucide-react';
import { HashDisplay } from './hash-display';
import type { Block } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface BlockCardProps {
  block: Block;
  transactions: any[];
  showChainConnection?: boolean;
  onVerifyBlock?: (data: string, hash: string) => void;
}

export function BlockCard({ block, transactions, showChainConnection = false, onVerifyBlock }: BlockCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Reset copied state when block changes or card is collapsed
  useEffect(() => {
    setCopied(false);
  }, [block.id, expanded]);

  const handleCopyHashInput = async () => {
    try {
      await navigator.clipboard.writeText(block.blockHashInput);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Block hash input data copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleVerifyBlock = () => {
    if (onVerifyBlock) {
      onVerifyBlock(block.blockHashInput, block.blockHash);
    }
  };

  return (
    <div className="relative">
      {showChainConnection && block.index > 0 && (
        <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-primary/30 transform -translate-x-1/2" />
      )}

      <Card className="hover-elevate transition-all" data-testid={`card-block-${block.index}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-heading">Block #{block.index}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(block.timestamp), 'PPp')}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              data-testid={`button-toggle-block-${block.index}`}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Transactions</span>
            <span className="font-semibold" data-testid={`text-transaction-count-${block.index}`}>{block.transactionCount}</span>
          </div>

          <HashDisplay hash={block.blockHash} label="Block Hash" />

          {expanded && (
            <div className="space-y-4 pt-4 border-t animate-accordion-down">
              <HashDisplay hash={block.merkleRoot} label="Merkle Root" />
              <HashDisplay hash={block.previousHash} label="Previous Hash" />

              {block.validatorSignature && (
                <HashDisplay hash={block.validatorSignature} label="Validator Signature" />
              )}

              {/* Block Hash Verification Section */}
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Block Hash Verification Data
                  </h4>
                  {onVerifyBlock && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleVerifyBlock}
                      className="text-xs"
                      data-testid={`button-verify-block-${block.index}`}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Verify This Block
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  This is the exact data that was hashed to create the block hash above. You can verify this block's integrity by hashing this data.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">Original Data (pre-hash):</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyHashInput}
                      className="h-6 px-2 text-xs"
                      data-testid={`button-copy-hash-input-${block.index}`}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-3 rounded bg-white dark:bg-black font-mono text-xs break-all border border-emerald-200 dark:border-emerald-800">
                    {block.blockHashInput}
                  </div>
                  <p className="text-xs text-muted-foreground italic">
                    Format: index + timestamp + merkleRoot + previousHash + transactionCount
                  </p>
                </div>
              </div>

              {transactions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Transactions in this block:</h4>
                    <p className="text-xs text-muted-foreground italic">
                      Note: TX IDs use random salts and cannot be re-verified
                    </p>
                  </div>
                  {transactions.map((tx, index) => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-lg bg-muted/50 space-y-2"
                      data-testid={`transaction-${index}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Transaction {index + 1}</span>
                        <span className="text-xs font-mono text-primary">
                          {tx.credits} tons CO₂
                        </span>
                      </div>
                      <HashDisplay hash={tx.txId} label="TX ID" abbreviate />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">From:</span>
                          <p className="font-mono truncate">{tx.from}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">To:</span>
                          <p className="font-mono truncate">{tx.to}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
