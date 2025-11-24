import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapPage.css';

//여기에 실제 Mapbox 토큰!
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FuZnJhbmNpc2NvLXNmIiwiYSI6ImNtaTg0aDlyYzA3enkycm9wZTdvNmkyaGkifQ.qmvNp4u9OWgDB6ecL3k_cw';

function MapPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  const [bathrooms, setBathrooms] = useState([]);
  const [userLocation, setUserLocation] = useState([-73.9855, 40.7580]);
  const [selectedBathroom, setSelectedBathroom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 지도 초기화
  useEffect(() => {
    if (map.current) return;

    console.log('🗺️ Initializing Mapbox...');
    console.log('📍 Token:', mapboxgl.accessToken ? 'Found' : 'Missing');

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: userLocation,
        zoom: 13,
        attributionControl: false
      });

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        
        // 현재 위치 가져오기
        getCurrentLocation();
        
        // 화장실 데이터 로드
        fetchBathrooms();
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e.error);
      });

    } catch (error) {
      console.error('❌ Map init error:', error);
    }
  }, []);

  // 현재 위치
  function getCurrentLocation() {
    if (!navigator.geolocation) {
      console.log('⚠️ Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        console.log('📍 User location:', coords);
        
        setUserLocation(coords);
        map.current.flyTo({ center: coords, zoom: 14 });

        // 현재 위치 마커
        new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat(coords)
          .addTo(map.current);
      },
      (error) => console.log('⚠️ Location error:', error.message)
    );
  }

  // 화장실 데이터
  async function fetchBathrooms() {
    try {
      console.log('📥 Fetching bathrooms...');
      
      const response = await fetch(
        'https://data.cityofnewyork.us/resource/i7jb-7jku.json?$limit=500'
      );
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} bathrooms`);

      const valid = data.filter(b => b.latitude && b.longitude);
      setBathrooms(valid);
      setIsLoading(false);

      // 마커 추가
      addMarkers(valid);

    } catch (error) {
      console.error('❌ Fetch error:', error);
      setIsLoading(false);
    }
  }

  // 마커 추가
  function addMarkers(bathrooms) {
    bathrooms.forEach((bathroom) => {
      const el = document.createElement('div');
      el.className = 'bathroom-marker';
      el.innerHTML = '🚻';
      el.title = bathroom.facility_name || 'Restroom';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([parseFloat(bathroom.longitude), parseFloat(bathroom.latitude)])
        .addTo(map.current);

      el.addEventListener('click', () => {
        console.log('🚻 Selected:', bathroom.facility_name);
        setSelectedBathroom(bathroom);
        map.current.flyTo({
          center: [parseFloat(bathroom.longitude), parseFloat(bathroom.latitude)],
          zoom: 16
        });
      });
    });
  }

  // 거리 계산
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDistance(bathroom) {
    const dist = calculateDistance(
      userLocation[1], userLocation[0],
      parseFloat(bathroom.latitude), parseFloat(bathroom.longitude)
    );
    return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
  }

  // 가장 가까운 화장실
  function findNearest() {
    if (bathrooms.length === 0) return;

    let nearest = null;
    let minDist = Infinity;

    bathrooms.forEach(bathroom => {
      const dist = calculateDistance(
        userLocation[1], userLocation[0],
        parseFloat(bathroom.latitude), parseFloat(bathroom.longitude)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = bathroom;
      }
    });

    if (nearest) {
      setSelectedBathroom(nearest);
      map.current.flyTo({
        center: [parseFloat(nearest.longitude), parseFloat(nearest.latitude)],
        zoom: 16
      });
    }
  }

  return (
    <div className="map-page">
      {/* 지도 컨테이너 */}
      <div ref={mapContainer} className="map-container" />

      {/* 로딩 */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading bathrooms...</p>
        </div>
      )}

      {/* 검색바 */}
      <div className="search-bar">
        <span>🔍</span>
        <span className="search-text">Search restrooms</span>
        <span className="count">{bathrooms.length}</span>
      </div>

      {/* 액션 버튼 */}
      <div className="action-buttons">
        <button onClick={() => map.current.flyTo({ center: userLocation, zoom: 15 })}>
          <span>📍</span>
          <span>My Location</span>
        </button>
        <button className="primary" onClick={findNearest}>
          <span>🚨</span>
          <span>Nearest</span>
        </button>
      </div>

      {/* 바텀시트 */}
      {selectedBathroom && (
        <div className="bathroom-sheet">
          <div className="handle"></div>
          
          <div className="header">
            <div>
              <h2>{selectedBathroom.facility_name || 'Public Restroom'}</h2>
              <p>{selectedBathroom.borough} • {formatDistance(selectedBathroom)}</p>
            </div>
            <button onClick={() => setSelectedBathroom(null)}>✕</button>
          </div>

          <div className="chips">
            <span>{selectedBathroom.handicap_accessible === 'Yes' ? '♿ Accessible' : '🚶 Standard'}</span>
            <span>{selectedBathroom.open_year_round === 'Yes' ? '🕐 Year-round' : '📅 Seasonal'}</span>
          </div>

          <button 
            className="directions"
            onClick={() => window.open(`https://maps.apple.com/?daddr=${selectedBathroom.latitude},${selectedBathroom.longitude}`, '_blank')}
          >
            Directions
          </button>
        </div>
      )}
    </div>
  );
}

export default MapPage;