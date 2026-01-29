import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HashDisplayProps {
  hash: string;
  label: string;
  abbreviate?: boolean;
  className?: string;
}

export function HashDisplay({ hash, label, abbreviate = true, className = '' }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const displayHash = abbreviate && !expanded
    ? `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
    : hash;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-muted rounded-md text-xs font-mono break-all" data-testid={`text-${label.toLowerCase().replace(/\s+/g, '-')}`}>
          {displayHash}
        </code>
        <div className="flex items-center gap-1">
          {abbreviate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setExpanded(!expanded)}
                  data-testid={`button-toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{expanded ? 'Collapse' : 'Expand'}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={copyToClipboard}
                data-testid={`button-copy-${label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy to clipboard</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
