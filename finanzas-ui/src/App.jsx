import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryProvider } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import { router } from './router';
import './App.css';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  );
}

export default App;
