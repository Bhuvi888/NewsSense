import { useState, useEffect, useCallback } from 'react';
import  api  from '../services/api';

export function useTopics() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('All');

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTopics();
      setTopics(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch topics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  return {
    topics,
    loading,
    error,
    selectedTopic,
    setSelectedTopic,
    refetch: fetchTopics
  };
}
