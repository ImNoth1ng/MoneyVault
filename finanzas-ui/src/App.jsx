import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import { router } from './router';
import './App.css';

function App() {
  const { initialize, checkTokenExpiration } = useAuthStore();

  useEffect(() => {
    initialize();

    const handleFocusOrVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkTokenExpiration();
      }
    };

    // Check token expiration periodically every 30 seconds
    const intervalId = setInterval(() => {
      checkTokenExpiration();
    }, 30000);

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
    };
  }, [initialize, checkTokenExpiration]);

  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export default App;

