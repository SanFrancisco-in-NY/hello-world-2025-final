import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartPage.css';

function StartPage() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 중요한 리소스 프리로드 -> 속도이슈 문제
    const preloadImages = [
      '/toilet.png',
      '/restaurants.png',
      '/loading-toilet.gif'
    ];

    const imagePromises = preloadImages.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // 에러나도 계속 진행
        img.src = src;
      });
    });

    Promise.all(imagePromises).then(() => {
      console.log('Images preloaded');
      setIsReady(true);
    });

    // 2초 후 페이드 아웃 (2.5초 → 2초)
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // 2.5초 후 페이지 이동 (3초 → 2.5초)
    const navTimer = setTimeout(() => {
      navigate('/map');
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  const handleClick = () => {
    if (!isReady) return; // 준비 안됐으면 무시
    setFadeOut(true);
    setTimeout(() => {
      navigate('/map');
    }, 300); // 500ms → 300ms
  };

  return (
    <div 
      className={`start-page ${fadeOut ? 'fade-out' : ''}`}
      onClick={handleClick}
      style={{ cursor: isReady ? 'pointer' : 'default' }}
    >
      <div className="animation-container">
        <img 
          src="/starting-animation.gif" 
          alt="Starting Animation" 
          className="start-animation"
        />
      </div>
      <p className="tap-hint">Tap to continue</p>
    </div>
  );
}

export default StartPage;