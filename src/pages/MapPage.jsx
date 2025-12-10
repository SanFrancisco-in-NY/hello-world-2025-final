import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import './MapPage.css';

mapboxgl.accessToken = 'pk.eyJ1Ijoic2FuZnJhbmNpc2NvLXNmIiwiYSI6ImNtaTg0aDlyYzA3enkycm9wZTdvNmkyaGkifQ.qmvNp4u9OWgDB6ecL3k_cw';

function MapPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const directionsControl = useRef(null);
  const bathroomMarkersRef = useRef([]);
  const restaurantMarkersRef = useRef([]);
  const fetchTimeoutRef = useRef(null);
  
  const [bathrooms, setBathrooms] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState([-73.9855, 40.7580]);
  const [selectedBathroom, setSelectedBathroom] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDirections, setShowDirections] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);

  const MIN_ZOOM_FOR_MARKERS = 14;

  // 컨트롤 버튼 커스터마이징 함수
  function customizeMapControls() {
    setTimeout(() => {
      // Zoom In 버튼
      const zoomInBtn = document.querySelector('.mapboxgl-ctrl-zoom-in');
      if (zoomInBtn) {
        const icon = zoomInBtn.querySelector('.mapboxgl-ctrl-icon');
        if (icon) icon.style.display = 'none';
        
        zoomInBtn.innerHTML = '<span style="font-size: 20px; font-weight: 600; color: rgba(0,0,0,0.8);">+</span>';
        zoomInBtn.style.display = 'flex';
        zoomInBtn.style.alignItems = 'center';
        zoomInBtn.style.justifyContent = 'center';
      }

      // Zoom Out 버튼
      const zoomOutBtn = document.querySelector('.mapboxgl-ctrl-zoom-out');
      if (zoomOutBtn) {
        const icon = zoomOutBtn.querySelector('.mapboxgl-ctrl-icon');
        if (icon) icon.style.display = 'none';
        
        zoomOutBtn.innerHTML = '<span style="font-size: 24px; font-weight: 600; color: rgba(0,0,0,0.8);">−</span>';
        zoomOutBtn.style.display = 'flex';
        zoomOutBtn.style.alignItems = 'center';
        zoomOutBtn.style.justifyContent = 'center';
      }

      // Compass 버튼
      const compassBtn = document.querySelector('.mapboxgl-ctrl-compass');
      if (compassBtn) {
        compassBtn.style.display = 'flex';
        compassBtn.style.alignItems = 'center';
        compassBtn.style.justifyContent = 'center';
      }

      console.log('✅ Map controls customized');
    }, 100);
  }

  // 지도 초기화
  useEffect(() => {
    if (map.current) return;

    console.log('🗺️ Initializing Mapbox...');

    try {
      const nycBounds = [
        [-74.3, 40.4],
        [-73.6, 41.0]
      ];

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/standard',
        center: userLocation,
        zoom: 13,
        attributionControl: false,
        maxBounds: nycBounds
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }),
        'top-right'
      );

      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true,
        showUserLocation: true
      });

      map.current.addControl(geolocateControl, 'top-right');
      map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

      directionsControl.current = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving-traffic',
        alternatives: true,
        congestion: true,
        interactive: false,
        controls: {
          inputs: false,
          instructions: true,
          profileSwitcher: false
        }
      });

      map.current.on('load', () => {
        console.log('Map loaded');
        
        // 컨트롤 커스터마이징
        customizeMapControls();
        
        geolocateControl.trigger();
        
        const zoom = map.current.getZoom();
        setCurrentZoom(zoom);
        
        if (zoom >= MIN_ZOOM_FOR_MARKERS) {
          fetchDataInBounds();
        }
      });

      map.current.on('zoom', () => {
        const zoom = map.current.getZoom();
        setCurrentZoom(zoom);
        
        if (zoom >= MIN_ZOOM_FOR_MARKERS) {
          showMarkers();
        } else {
          hideMarkers();
        }
      });

      map.current.on('moveend', () => {
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        
        fetchTimeoutRef.current = setTimeout(() => {
          const zoom = map.current.getZoom();
          if (zoom >= MIN_ZOOM_FOR_MARKERS) {
            fetchDataInBounds();
          }
        }, 500);
      });

      geolocateControl.on('geolocate', (e) => {
        const coords = [e.coords.longitude, e.coords.latitude];
        console.log('📍 User location:', coords);
        setUserLocation(coords);
      });

      geolocateControl.on('error', (error) => {
        console.error('❌ Geolocation error:', error);
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e.error);
      });

    } catch (error) {
      console.error('❌ Map init error:', error);
    }
  }, []);

  // 마커 표시
  function showMarkers() {
    bathroomMarkersRef.current.forEach(marker => {
      marker.getElement().style.display = 'block';
    });
    restaurantMarkersRef.current.forEach(marker => {
      marker.getElement().style.display = 'block';
    });
  }

  // 마커 숨김
  function hideMarkers() {
    bathroomMarkersRef.current.forEach(marker => {
      marker.getElement().style.display = 'none';
    });
    restaurantMarkersRef.current.forEach(marker => {
      marker.getElement().style.display = 'none';
    });
  }

  // Bounding Box로 데이터 가져오기
  async function fetchDataInBounds() {
    if (!map.current) return;

    const bounds = map.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    console.log('📦 Bounding Box:', {
      south: sw.lat.toFixed(4),
      west: sw.lng.toFixed(4),
      north: ne.lat.toFixed(4),
      east: ne.lng.toFixed(4)
    });

    await Promise.all([
      fetchBathroomsInBounds(sw, ne),
      fetchRestaurantsInBounds(sw, ne)
    ]);

    setIsLoading(false);
  }

  // 화장실 데이터
  async function fetchBathroomsInBounds(sw, ne) {
    try {
      const query = `https://data.cityofnewyork.us/resource/i7jb-7jku.json?$where=latitude>${sw.lat} AND latitude<${ne.lat} AND longitude>${sw.lng} AND longitude<${ne.lng}&$limit=1000`;
      
      const response = await fetch(query);
      const data = await response.json();
      
      console.log(`🚻 Loaded ${data.length} bathrooms`);

      const valid = data.filter(b => b.latitude && b.longitude);
      const filtered = filterByDistance(valid, 0.001);
      
      setBathrooms(filtered);

      bathroomMarkersRef.current.forEach(m => m.remove());
      bathroomMarkersRef.current = [];

      addBathroomMarkers(filtered);

    } catch (error) {
      console.error('❌ Fetch bathrooms error:', error);
    }
  }

  // 레스토랑 데이터
  async function fetchRestaurantsInBounds(sw, ne) {
    try {
      const query = `https://data.cityofnewyork.us/resource/43nn-pn8j.json?grade=A&$where=latitude>${sw.lat} AND latitude<${ne.lat} AND longitude>${sw.lng} AND longitude<${ne.lng}&$limit=1000`;
      
      const response = await fetch(query);
      const data = await response.json();
      
      console.log(`🍽️ Loaded ${data.length} restaurants`);

      const valid = data.filter(r => r.latitude && r.longitude);
      const filtered = filterByDistance(valid, 0.001);
      
      setRestaurants(filtered);

      restaurantMarkersRef.current.forEach(m => m.remove());
      restaurantMarkersRef.current = [];

      addRestaurantMarkers(filtered);

    } catch (error) {
      console.error('❌ Fetch restaurants error:', error);
    }
  }

  // 거리 기준으로 필터링
  function filterByDistance(items, minDistance) {
    const filtered = [];
    
    items.forEach(item => {
      const tooClose = filtered.some(existing => {
        const latDiff = Math.abs(parseFloat(item.latitude) - parseFloat(existing.latitude));
        const lngDiff = Math.abs(parseFloat(item.longitude) - parseFloat(existing.longitude));
        return latDiff < minDistance && lngDiff < minDistance;
      });
      
      if (!tooClose) {
        filtered.push(item);
      }
    });
    
    return filtered;
  }

  // 화장실 마커 추가
  function addBathroomMarkers(bathrooms) {
    bathrooms.forEach((bathroom) => {
      const el = document.createElement('div');
      el.className = 'custom-marker bathroom-marker-img';
      
      el.style.backgroundImage = 'url(/toilet.png)';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';
      el.title = bathroom.facility_name || 'Restroom';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([parseFloat(bathroom.longitude), parseFloat(bathroom.latitude)])
        .addTo(map.current);

      bathroomMarkersRef.current.push(marker);

      el.addEventListener('click', () => {
        console.log('🚻 Selected:', bathroom.facility_name);
        setSelectedBathroom(bathroom);
        setSelectedRestaurant(null);
        setShowDirections(false);
        map.current.flyTo({
          center: [parseFloat(bathroom.longitude), parseFloat(bathroom.latitude)],
          zoom: 16
        });
      });
    });
  }

  // 레스토랑 마커 추가
  function addRestaurantMarkers(restaurants) {
    restaurants.forEach((restaurant) => {
      const el = document.createElement('div');
      el.className = 'custom-marker restaurant-marker-img';
      
      el.style.backgroundImage = 'url(/restaurants.png)';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';
      el.title = restaurant.dba || 'Restaurant';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([parseFloat(restaurant.longitude), parseFloat(restaurant.latitude)])
        .addTo(map.current);

      restaurantMarkersRef.current.push(marker);

      el.addEventListener('click', () => {
        console.log('🍽️ Selected:', restaurant.dba);
        setSelectedRestaurant(restaurant);
        setSelectedBathroom(null);
        setShowDirections(false);
        map.current.flyTo({
          center: [parseFloat(restaurant.longitude), parseFloat(restaurant.latitude)],
          zoom: 16
        });
      });
    });
  }


 //길찾기 시작
function startDirections(location) {
  console.log('Starting directions');
  
  if (!map.current.hasControl(directionsControl.current)) {
    map.current.addControl(directionsControl.current, 'top-left');
  }

  directionsControl.current.setOrigin(userLocation);
  directionsControl.current.setDestination([
    parseFloat(location.longitude),
    parseFloat(location.latitude)
  ]);

  setShowDirections(true);

  // 간단하게 - CSS가 알아서 처리
  console.log('✅ Directions started - CSS will handle styling');
}

  // 길찾기 종료
  function stopDirections() {
    if (directionsControl.current && map.current.hasControl(directionsControl.current)) {
      map.current.removeControl(directionsControl.current);
      
      directionsControl.current = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving-traffic',
        alternatives: true,
        congestion: true,
        interactive: false,
        controls: {
          inputs: false,
          instructions: true,
          profileSwitcher: false
        }
      });
    }
    setShowDirections(false);
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

  function formatDistance(item) {
    const dist = calculateDistance(
      userLocation[1], userLocation[0],
      parseFloat(item.latitude), parseFloat(item.longitude)
    );
    return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
  }

  // 가장 가까운 장소 찾기
  function findNearest() {
    const allLocations = [
      ...bathrooms.map(b => ({ ...b, type: 'bathroom' })),
      ...restaurants.map(r => ({ ...r, type: 'restaurant' }))
    ];

    if (allLocations.length === 0) {
      alert('⚠️ Zoom in to see nearby locations');
      return;
    }

    let nearest = null;
    let minDist = Infinity;

    allLocations.forEach(location => {
      const dist = calculateDistance(
        userLocation[1], userLocation[0],
        parseFloat(location.latitude), parseFloat(location.longitude)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = location;
      }
    });

    if (nearest) {
      if (nearest.type === 'bathroom') {
        setSelectedBathroom(nearest);
        setSelectedRestaurant(null);
      } else {
        setSelectedRestaurant(nearest);
        setSelectedBathroom(null);
      }
      
      setShowDirections(false);
      map.current.flyTo({
        center: [parseFloat(nearest.longitude), parseFloat(nearest.latitude)],
        zoom: 16
      });

      console.log(`✅ Nearest: ${nearest.type} at ${minDist.toFixed(0)}m`);
    }
  }

  return (
    <div className="map-page">
      <div ref={mapContainer} className="map-container" />
  
      {isLoading && (
        <div className="loading-overlay">
          <img 
            src="/loading-toilet.gif" 
            alt="Loading" 
            className="loading-gif"
          />
          <p>Loading Toilets...</p>
        </div>
      )}
  
      {currentZoom < MIN_ZOOM_FOR_MARKERS && (
        <div className="zoom-hint">
          🔍 Zoom in to see locations
        </div>
      )}
  
      {!selectedBathroom && !selectedRestaurant && (
        <div className="action-buttons">
          <button className="primary" onClick={findNearest}>
            <span>Find Nearest</span>
          </button>
        </div>
      )}
  
      {selectedBathroom && (
        <div className="bathroom-sheet">
          <div className="handle"></div>
          
          <div className="header">
            <div>
              <h2>🚻 {selectedBathroom.facility_name || 'Public Restroom'}</h2>
              <p>{selectedBathroom.borough} • {formatDistance(selectedBathroom)}</p>
            </div>
            <button onClick={() => {
              setSelectedBathroom(null);
              stopDirections();
            }}>✕</button>
          </div>
  
          <div className="chips">
            <span>{selectedBathroom.handicap_accessible === 'Yes' ? '♿ Accessible' : '🚶 Standard'}</span>
            <span>{selectedBathroom.open_year_round === 'Yes' ? '🕐 Year-round' : '📅 Seasonal'}</span>
          </div>
  
          {!showDirections ? (
            <button 
              className="directions"
              onClick={() => startDirections(selectedBathroom)}
            >
              Show Route
            </button>
          ) : (
            <button 
              className="directions stop"
              onClick={stopDirections}
            >
              Stop Navigation
            </button>
          )}
        </div>
      )}
  
      {selectedRestaurant && (
        <div className="bathroom-sheet">
          <div className="handle"></div>
          
          <div className="header">
            <div>
              <h2>🍽️ {selectedRestaurant.dba || 'Restaurant'}</h2>
              <p>{selectedRestaurant.boro} • {formatDistance(selectedRestaurant)}</p>
            </div>
            <button onClick={() => {
              setSelectedRestaurant(null);
              stopDirections();
            }}>✕</button>
          </div>
  
          <div className="chips">
            <span>🍽️ {selectedRestaurant.cuisine_description || 'Restaurant'}</span>
            <span>⭐ Grade {selectedRestaurant.grade || 'N/A'}</span>
          </div>
  
          {!showDirections ? (
            <button 
              className="directions"
              onClick={() => startDirections(selectedRestaurant)}
            >
              Show Route
            </button>
          ) : (
            <button 
              className="directions stop"
              onClick={stopDirections}
            >
              Stop Navigation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MapPage;