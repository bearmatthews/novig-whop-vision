import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Share2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShareBetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventName: string;
  marketName?: string;
  outcomeName?: string;
  odds?: string;
}

export function ShareBetDialog({
  open,
  onOpenChange,
  eventName,
  marketName,
  outcomeName,
  odds,
}: ShareBetDialogProps) {
  const [channelId, setChannelId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateDefaultMessage = () => {
    let message = `🎯 **Check out this bet!**\n\n`;
    message += `**Event:** ${eventName}\n`;
    if (marketName) message += `**Market:** ${marketName}\n`;
    if (outcomeName) message += `**Outcome:** ${outcomeName}\n`;
    if (odds) message += `**Odds:** ${odds}\n`;
    return message;
  };

  const handleShare = async () => {
    if (!channelId.trim()) {
      toast({
        title: 'Channel ID required',
        description: 'Please enter a Whop channel ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const content = customMessage.trim() || generateDefaultMessage();
      
      const { data, error } = await supabase.functions.invoke('whop-share-message', {
        body: {
          channel_id: channelId.trim(),
          content,
        },
      });

      if (error) throw error;

      toast({
        title: 'Shared successfully!',
        description: 'Your bet has been shared to the chat',
      });
      
      onOpenChange(false);
      setChannelId('');
      setCustomMessage('');
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Failed to share',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share to Whop Chat
          </DialogTitle>
          <DialogDescription>
            Share this bet with your Whop community
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-id">Channel ID</Label>
            <Input
              id="channel-id"
              placeholder="exp_xxxxxxxxxxxxx or channel_xxxxxxxxxxxxx"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the Whop channel or experience ID where you want to share this bet
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (optional)</Label>
            <Textarea
              id="message"
              placeholder={generateDefaultMessage()}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default formatted message
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={loading || !channelId.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
