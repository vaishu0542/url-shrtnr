import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UrlData {
  id: string;
  original_url: string;
  short_code: string;
  click_count: number;
  created_at: string;
}

const Admin = () => {
  const [urls, setUrls] = useState<UrlData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const { data, error } = await supabase
        .from('urls')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUrls(data || []);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load URLs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (shortCode: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast({
        title: 'Copied!',
        description: 'Short URL copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading URLs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage and track all shortened URLs</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{urls.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {urls.reduce((sum, url) => sum + url.click_count, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Average Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {urls.length > 0 
                  ? Math.round(urls.reduce((sum, url) => sum + url.click_count, 0) / urls.length)
                  : 0
                }
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Shortened URLs</CardTitle>
          </CardHeader>
          <CardContent>
            {urls.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No URLs have been shortened yet.
              </p>
            ) : (
              <div className="space-y-4">
                {urls.map((url) => (
                  <div key={url.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">
                            /{url.short_code}
                          </Badge>
                          <Badge variant="outline">
                            {url.click_count} clicks
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Original URL:
                        </p>
                        <p className="text-sm break-all mb-2">
                          {url.original_url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {formatDate(url.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(url.short_code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(url.original_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;