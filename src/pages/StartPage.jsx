import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartPage.css';

function StartPage() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 2.5초 후 페이드 아웃 시작
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2500);

    // 3초 후 페이지 이동
    const navTimer = setTimeout(() => {
      navigate('/map');
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(navTimer);
    };
  }, [navigate]);

  const handleClick = () => {
    setFadeOut(true);
    setTimeout(() => {
      navigate('/map');
    }, 500);
  };

  return (
    <div 
      className={`start-page ${fadeOut ? 'fade-out' : ''}`}
      onClick={handleClick}
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