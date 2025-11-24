import { useState, useEffect } from 'react';
import SplashScreen from './pages/SplashScreen';
import MapPage from './pages/MapPage';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Switching to map page...');
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {showSplash ? <SplashScreen /> : <MapPage />}
    </div>
  );
}

export default App;