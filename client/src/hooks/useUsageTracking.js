import { useState, useEffect } from 'react';

const USAGE_LIMIT = 3;
const USAGE_KEY = 'codeunity_usage_count';
const USER_KEY = 'codeunity_user';

export const useUsageTracking = () => {
  const [usageCount, setUsageCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem(USER_KEY);
      }
    }

    // Check usage count for non-authenticated users
    if (!storedUser) {
      const storedUsage = localStorage.getItem(USAGE_KEY);
      const currentUsage = storedUsage ? parseInt(storedUsage, 10) : 0;
      setUsageCount(currentUsage);
      setIsLimitReached(currentUsage >= USAGE_LIMIT);
    }
  }, []);

  const incrementUsage = () => {
    // Don't track usage for authenticated users
    if (user) return false;

    const newUsage = usageCount + 1;
    setUsageCount(newUsage);
    localStorage.setItem(USAGE_KEY, newUsage.toString());
    
    // Check if limit is reached AFTER the current usage
    const limitReached = newUsage >= USAGE_LIMIT;
    setIsLimitReached(limitReached);
    
    // Return true if this usage puts us at or over the limit
    return limitReached;
  };

  const resetUsage = () => {
    setUsageCount(0);
    setIsLimitReached(false);
    localStorage.removeItem(USAGE_KEY);
  };

  const setUserAuth = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      resetUsage(); // Reset usage count when user logs in
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  return {
    usageCount,
    isLimitReached,
    user,
    incrementUsage,
    resetUsage,
    setUserAuth,
    isAuthenticated,
    remainingUsage: Math.max(0, USAGE_LIMIT - usageCount)
  };
};
