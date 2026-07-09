import { useState, useEffect, useCallback } from 'react';
import  api  from '../services/api';

export function useSources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSources();
      setSources(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch sources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFollow = useCallback(async (id) => {
    try {
      const updated = await api.toggleFollowSource(id);
      setSources(prev => prev.map(src => src.id === id ? updated : src));
    } catch (err) {
      console.error('Failed to update source:', err);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return {
    sources,
    loading,
    error,
    toggleFollow,
    refetch: fetchSources
  };
}
