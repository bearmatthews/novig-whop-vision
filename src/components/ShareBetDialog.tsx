import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Channel {
  id: string;
  name: string;
  type: string;
}

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
  const location = useLocation();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchChannels();
    }
  }, [open]);

  const getExperienceIdFromPath = () => {
    // Extract experienceId from path like /experience/:experienceId
    const match = location.pathname.match(/\/experience\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const fetchChannels = async () => {
    setLoadingChannels(true);
    try {
      const isInIframe = window.self !== window.top;
      const host = window.location.hostname;
      const ref = document.referrer || '';
      const isLovablePreview = host.includes('lovableproject.com') || host.includes('lovable.app');
      const isWhopEmbed = isInIframe && (
        ref.includes('apps.whop.com') ||
        ref.includes('whop.com') ||
        host.endsWith('.apps.whop.com')
      );

      const experienceId = getExperienceIdFromPath();

      // Dev/preview: show mock channels
      if (!isWhopEmbed || isLovablePreview) {
        const mock = [
          { id: experienceId || 'exp_demo', name: 'Current Experience', type: 'experience' },
        ];
        setChannels(mock);
        setChannelId(mock[0].id);
        setLoadingChannels(false);
        return;
      }

      // In Whop: list channels for current experience via proxy
      if (experienceId) {
        try {
          const vercelUrl = '/whop-list-channels';
          const res = await fetch(vercelUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ experience_id: experienceId }),
          });

          if (res.ok) {
            const payload = await res.json();
            if (payload?.channels && payload.channels.length > 0) {
              setChannels(payload.channels);
              setChannelId(payload.channels[0].id);
              setLoadingChannels(false);
              return;
            }
          }
        } catch (e) {
          console.error('Proxy listing failed, trying fallback invoke:', e);
        }

        // Fallback to direct Supabase function call
        const { data, error } = await supabase.functions.invoke('whop-list-channels', {
          method: 'POST',
          body: { experience_id: experienceId },
        });

        if (error) throw error;

        if (data?.channels && data.channels.length > 0) {
          setChannels(data.channels);
          setChannelId(data.channels[0].id);
          setLoadingChannels(false);
          return;
        }

        // Ultimate fallback: default to experience itself
        const defaultChannel = { id: experienceId, name: 'Current Experience', type: 'experience' };
        setChannels([defaultChannel]);
        setChannelId(experienceId);
        setLoadingChannels(false);
        return;
      }
    } catch (error) {
      console.error('Failed to load channels:', error);
      toast({
        title: 'Failed to load channels',
        description: 'Using current experience as default',
        variant: 'destructive',
      });
    } finally {
      setLoadingChannels(false);
    }
  };

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
      
      // Try Vercel proxy first
      try {
        const vercelUrl = '/whop-share-message';
        const res = await fetch(vercelUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel_id: channelId.trim(),
            content,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            toast({
              title: 'Shared successfully!',
              description: 'Your bet has been shared to the chat',
            });
            
            onOpenChange(false);
            setChannelId('');
            setCustomMessage('');
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Proxy share failed, trying fallback:', e);
      }

      // Fallback to direct Supabase function call
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
            <Label htmlFor="channel-select">Share To</Label>
            {loadingChannels ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : channels.length === 0 ? (
              <div className="space-y-2">
                <Input
                  id="channel-id"
                  placeholder="Enter a channel or experience ID (exp_... or channel_...)"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  No channels found automatically. Enter a channel ID to share.
                </p>
              </div>
            ) : channels.length === 1 ? (
              <div className="p-3 bg-secondary rounded-md">
                <p className="text-sm font-medium">{channels[0].name}</p>
                <p className="text-xs text-muted-foreground">
                  Sharing to current experience
                </p>
              </div>
            ) : (
              <>
                <Select value={channelId} onValueChange={setChannelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a channel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select where to share this bet
                </p>
              </>
            )}
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
            disabled={loading || !channelId.trim() || loadingChannels}
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
