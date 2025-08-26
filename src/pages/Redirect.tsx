import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Redirect = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!shortCode) {
        setError('Invalid short code');
        return;
      }

      try {
        // Get the original URL
        const { data: urlData, error: fetchError } = await supabase
          .from('urls')
          .select('original_url, click_count, id')
          .eq('short_code', shortCode)
          .single();

        if (fetchError || !urlData) {
          setError('Short URL not found');
          return;
        }

        // Increment click count
        await supabase
          .from('urls')
          .update({ click_count: urlData.click_count + 1 })
          .eq('id', urlData.id);

        // Redirect to original URL
        window.location.href = urlData.original_url;
      } catch (error) {
        console.error('Redirect error:', error);
        setError('An error occurred while redirecting');
      }
    };

    handleRedirect();
  }, [shortCode]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-4">{error}</p>
          <a 
            href="/" 
            className="text-primary hover:underline"
          >
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
};

export default Redirect;