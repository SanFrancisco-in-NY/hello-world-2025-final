import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import './MapPage.css';

mapboxgl.accessToken =
  'pk.eyJ1Ijoic2FuZnJhbmNpc2NvLXNmIiwiYSI6ImNtaTg0aDlyYzA3enkycm9wZTdvNmkyaGkifQ.qmvNp4u9OWgDB6ecL3k_cw';

function MapPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const directionsControl = useRef(null);
  const directionsAddedRef = useRef(false);

  const bathroomMarkersRef = useRef([]);
  const restaurantMarkersRef = useRef([]);
  const fetchTimeoutRef = useRef(null);
  const lastFetchBoundsRef = useRef(null);

  const userLocationRef = useRef([-73.9855, 40.7580]);

  const [bathrooms, setBathrooms] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(userLocationRef.current);

  const [selectedBathroom, setSelectedBathroom] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);

  function customizeMapControls() {
    setTimeout(() => {
      const zoomInBtn = document.querySelector('.mapboxgl-ctrl-zoom-in');
      if (zoomInBtn) {
        const icon = zoomInBtn.querySelector('.mapboxgl-ctrl-icon');
        if (icon) icon.style.display = 'none';
        zoomInBtn.innerHTML =
          '<span style="font-size: 20px; font-weight: 600; color: rgba(0,0,0,0.8);">+</span>';
        zoomInBtn.style.display = 'flex';
        zoomInBtn.style.alignItems = 'center';
        zoomInBtn.style.justifyContent = 'center';
      }

      const zoomOutBtn = document.querySelector('.mapboxgl-ctrl-zoom-out');
      if (zoomOutBtn) {
        const icon = zoomOutBtn.querySelector('.mapboxgl-ctrl-icon');
        if (icon) icon.style.display = 'none';
        zoomOutBtn.innerHTML =
          '<span style="font-size: 24px; font-weight: 600; color: rgba(0,0,0,0.8);">−</span>';
        zoomOutBtn.style.display = 'flex';
        zoomOutBtn.style.alignItems = 'center';
        zoomOutBtn.style.justifyContent = 'center';
      }

      const compassBtn = document.querySelector('.mapboxgl-ctrl-compass');
      if (compassBtn) {
        compassBtn.style.display = 'flex';
        compassBtn.style.alignItems = 'center';
        compassBtn.style.justifyContent = 'center';
      }
    }, 100);
  }

  function ensureDirectionsRouteVisible() {
    if (!map.current) return;

    const ids = ['directions-route-line', 'directions-route-line-alt', 'directions-route-line-casing'];

    ids.forEach((id) => {
      if (map.current.getLayer(id)) {
        try {
          map.current.setLayoutProperty(id, 'visibility', 'visible');
          map.current.moveLayer(id);
        } catch {}
      }
    });
  }

  function initDirectionsControl() {
    if (directionsControl.current) return;

    const dc = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving-traffic',
      alternatives: true,
      congestion: true,
      interactive: false,
      controls: {
        inputs: true,
        instructions: true,
        profileSwitcher: true,
      },
    });

    dc.on('route', () => {
      setShowDirections(true);
      ensureDirectionsRouteVisible();
    });

    dc.on('error', (err) => {
      console.error('❌ directions error:', err);
    });

    directionsControl.current = dc;
  }

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    console.log('✅ Map init start');

    const nycBounds = [
      [-74.3, 40.4],
      [-73.6, 41.0],
    ];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: userLocationRef.current,
      zoom: 14,
      attributionControl: false,
      maxBounds: nycBounds,
    });

    map.current.on('error', (e) => console.error('❌ Map error:', e?.error || e));

    map.current.addControl(
      new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }),
      'top-right'
    );

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: { 
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0
      },
      trackUserLocation: true,
      showUserHeading: true,
      showUserLocation: true,
      fitBoundsOptions: {
        maxZoom: 15
      }
    });

    map.current.addControl(geolocateControl, 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    initDirectionsControl();

    map.current.on('load', () => {
      console.log('✅ Map loaded');

      customizeMapControls();

      if (!directionsAddedRef.current && directionsControl.current) {
        map.current.addControl(directionsControl.current, 'top-left');
        directionsAddedRef.current = true;
      }

      const zoom = map.current.getZoom();
      setCurrentZoom(zoom);

      fetchDataInBounds();

      geolocateControl.trigger();
      setTimeout(() => map.current?.resize(), 0);
    });

    map.current.on('zoom', () => {
      const zoom = map.current.getZoom();
      setCurrentZoom(zoom);
      showMarkers();
    });

    map.current.on('moveend', () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      
      fetchTimeoutRef.current = setTimeout(() => {
        const bounds = map.current.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        if (lastFetchBoundsRef.current) {
          const lastBounds = lastFetchBoundsRef.current;
          
          const latDiff = Math.abs((ne.lat - sw.lat) * 0.1);
          const lngDiff = Math.abs((ne.lng - sw.lng) * 0.1);

          if (
            Math.abs(sw.lat - lastBounds.sw.lat) < latDiff &&
            Math.abs(sw.lng - lastBounds.sw.lng) < lngDiff &&
            Math.abs(ne.lat - lastBounds.ne.lat) < latDiff &&
            Math.abs(ne.lng - lastBounds.ne.lng) < lngDiff
          ) {
            console.log('⏭️ Skipping fetch - bounds too similar');
            return;
          }
        }

        lastFetchBoundsRef.current = { sw, ne };
        fetchDataInBounds();
      }, 1000);
    });

    geolocateControl.on('geolocate', (e) => {
      const coords = [e.coords.longitude, e.coords.latitude];
      console.log('✅ User location found:', coords);
      userLocationRef.current = coords;
      setUserLocation(coords);

      if (directionsControl.current) {
        directionsControl.current.setOrigin(coords);
      }

      fetchDataInBounds();
    });

    geolocateControl.on('error', (error) => {
      console.warn('⚠️ Geolocation failed, using default NYC location');
      console.error('Geolocation error:', error);
      
      map.current.flyTo({
        center: [-73.9855, 40.7580],
        zoom: 14
      });
    });

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      bathroomMarkersRef.current.forEach((m) => m.remove());
      restaurantMarkersRef.current.forEach((m) => m.remove());
      map.current?.remove();
      map.current = null;
      directionsAddedRef.current = false;
      directionsControl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showMarkers() {
    bathroomMarkersRef.current.forEach((m) => (m.getElement().style.display = 'block'));
    restaurantMarkersRef.current.forEach((m) => (m.getElement().style.display = 'block'));
  }

  function hideMarkers() {
    bathroomMarkersRef.current.forEach((m) => (m.getElement().style.display = 'none'));
    restaurantMarkersRef.current.forEach((m) => (m.getElement().style.display = 'none'));
  }

  async function fetchDataInBounds() {
    if (!map.current) return;
  
    const isInitialLoad = bathrooms.length === 0 && restaurants.length === 0;
    
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }
  
    try {
      const bounds = map.current.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
  
      const results = await Promise.allSettled([
        fetchBathroomsInBounds(sw, ne),
        fetchRestaurantsInBounds(sw, ne)
      ]);
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn(`Fetch ${index === 0 ? 'bathrooms' : 'restaurants'} failed:`, result.reason);
        }
      });
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }

  async function fetchBathroomsInBounds(sw, ne) {
    const query = `https://data.cityofnewyork.us/resource/i7jb-7jku.json?$where=latitude>${sw.lat} AND latitude<${ne.lat} AND longitude>${sw.lng} AND longitude<${ne.lng}&$limit=100`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(query, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const valid = data.filter((b) => b.latitude && b.longitude);
      const filtered = filterByDistance(valid, 0.001);

      setBathrooms(filtered);
      addBathroomMarkers(filtered);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('Bathrooms fetch timeout');
      } else {
        console.error('Bathrooms fetch error:', error);
      }
    }
  }

  async function fetchRestaurantsInBounds(sw, ne) {
    const query = `https://data.cityofnewyork.us/resource/43nn-pn8j.json?grade=A&$where=latitude>${sw.lat} AND latitude<${ne.lat} AND longitude>${sw.lng} AND longitude<${ne.lng}&$limit=100`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(query, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const valid = data.filter((r) => r.latitude && r.longitude);
      const filtered = filterByDistance(valid, 0.001);

      setRestaurants(filtered);
      addRestaurantMarkers(filtered);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn('Restaurants fetch timeout');
      } else {
        console.error('Restaurants fetch error:', error);
      }
    }
  }

  function filterByDistance(items, minDistance) {
    const filtered = [];
    const maxMarkers = 100;
    
    items.forEach((item) => {
      if (filtered.length >= maxMarkers) return;
      
      const tooClose = filtered.some((existing) => {
        const latDiff = Math.abs(parseFloat(item.latitude) - parseFloat(existing.latitude));
        const lngDiff = Math.abs(parseFloat(item.longitude) - parseFloat(existing.longitude));
        return latDiff < minDistance && lngDiff < minDistance;
      });
      if (!tooClose) filtered.push(item);
    });
    return filtered;
  }

  function addBathroomMarkers(list) {
    const existingMarkers = new Map();
    bathroomMarkersRef.current.forEach(marker => {
      const lngLat = marker.getLngLat();
      const key = `${lngLat.lat.toFixed(5)},${lngLat.lng.toFixed(5)}`;
      existingMarkers.set(key, marker);
    });

    const newMarkers = [];
    const usedKeys = new Set();

    list.forEach((bathroom) => {
      const lat = parseFloat(bathroom.latitude);
      const lng = parseFloat(bathroom.longitude);
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      
      if (existingMarkers.has(key)) {
        const marker = existingMarkers.get(key);
        marker.getElement().title = bathroom.facility_name || 'Restroom';
        newMarkers.push(marker);
        usedKeys.add(key);
        return;
      }

      const el = document.createElement('div');
      el.className = 'custom-marker bathroom-marker-img';
      el.style.cursor = 'pointer';
      el.title = bathroom.facility_name || 'Restroom';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current);

      newMarkers.push(marker);

      el.addEventListener('click', () => {
        setSelectedBathroom(bathroom);
        setSelectedRestaurant(null);
        setShowDirections(false);

        map.current.flyTo({
          center: [lng, lat],
          zoom: 16,
          speed: 1.5,
        });
      });
    });

    existingMarkers.forEach((marker, key) => {
      if (!usedKeys.has(key)) {
        marker.remove();
      }
    });

    bathroomMarkersRef.current = newMarkers;
  }

  function addRestaurantMarkers(list) {
    const existingMarkers = new Map();
    restaurantMarkersRef.current.forEach(marker => {
      const lngLat = marker.getLngLat();
      const key = `${lngLat.lat.toFixed(5)},${lngLat.lng.toFixed(5)}`;
      existingMarkers.set(key, marker);
    });

    const newMarkers = [];
    const usedKeys = new Set();

    list.forEach((restaurant) => {
      const lat = parseFloat(restaurant.latitude);
      const lng = parseFloat(restaurant.longitude);
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      
      if (existingMarkers.has(key)) {
        const marker = existingMarkers.get(key);
        marker.getElement().title = restaurant.dba || 'Restaurant';
        newMarkers.push(marker);
        usedKeys.add(key);
        return;
      }

      const el = document.createElement('div');
      el.className = 'custom-marker restaurant-marker-img';
      el.style.cursor = 'pointer';
      el.title = restaurant.dba || 'Restaurant';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current);

      newMarkers.push(marker);

      el.addEventListener('click', () => {
        setSelectedRestaurant(restaurant);
        setSelectedBathroom(null);
        setShowDirections(false);

        map.current.flyTo({
          center: [lng, lat],
          zoom: 16,
          speed: 1.5,
        });
      });
    });

    existingMarkers.forEach((marker, key) => {
      if (!usedKeys.has(key)) {
        marker.remove();
      }
    });

    restaurantMarkersRef.current = newMarkers;
  }

  function startDirections(location) {
    if (!map.current) return;
    initDirectionsControl();

    directionsControl.current.setOrigin(userLocationRef.current);
    directionsControl.current.setDestination([parseFloat(location.longitude), parseFloat(location.latitude)]);

    setShowDirections(true);
    ensureDirectionsRouteVisible();
  }

  function stopDirections() {
    if (!directionsControl.current) {
      setShowDirections(false);
      return;
    }

    try {
      directionsControl.current.removeRoutes();
      directionsControl.current.setDestination('');
      directionsControl.current.setOrigin(userLocationRef.current);
    } catch (e) {
      console.warn('stopDirections cleanup warning:', e);
    }

    setShowDirections(false);
  }

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
    const origin = userLocationRef.current;
    const dist = calculateDistance(
      origin[1],
      origin[0],
      parseFloat(item.latitude),
      parseFloat(item.longitude)
    );
    return dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
  }

  function findNearest() {
    const allLocations = [
      ...bathrooms.map((b) => ({ ...b, type: 'bathroom' })),
      ...restaurants.map((r) => ({ ...r, type: 'restaurant' })),
    ];

    if (allLocations.length === 0) {
      alert('Zoom in to see nearby locations');
      return;
    }

    const origin = userLocationRef.current;
    let nearest = null;
    let minDist = Infinity;

    allLocations.forEach((loc) => {
      const dist = calculateDistance(origin[1], origin[0], parseFloat(loc.latitude), parseFloat(loc.longitude));
      if (dist < minDist) {
        minDist = dist;
        nearest = loc;
      }
    });

    if (!nearest) return;

    if (nearest.type === 'bathroom') {
      setSelectedBathroom(nearest);
      setSelectedRestaurant(null);
    } else {
      setSelectedRestaurant(nearest);
      setSelectedBathroom(null);
    }

    startDirections(nearest);

    map.current.flyTo({
      center: [parseFloat(nearest.longitude), parseFloat(nearest.latitude)],
      zoom: 16,
    });
  }

  return (
    <div className="map-page">
      <div ref={mapContainer} className="map-container" />

      {isLoading && (
        <div className="loading-overlay">
          <img src="/loading-toilet.gif" alt="Loading" className="loading-gif" />
          <p>Loading Toilets...</p>
        </div>
      )}

      {isFetching && !isLoading && (
        <div className="fetching-indicator">
          <div className="spinner"></div>
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
              <p>
                {selectedBathroom.borough} • {formatDistance(selectedBathroom)}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedBathroom(null);
                stopDirections();
              }}
            >
              ✕
            </button>
          </div>

          <div className="chips">
            <span>{selectedBathroom.handicap_accessible === 'Yes' ? '♿ Accessible' : '🚶 Standard'}</span>
            <span>{selectedBathroom.open_year_round === 'Yes' ? '🕐 Year-round' : '📅 Seasonal'}</span>
          </div>

          {!showDirections ? (
            <button className="directions" onClick={() => startDirections(selectedBathroom)}>
              Show Route
            </button>
          ) : (
            <button className="directions stop" onClick={stopDirections}>
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
              <p>
                {selectedRestaurant.boro} • {formatDistance(selectedRestaurant)}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedRestaurant(null);
                stopDirections();
              }}
            >
              ✕
            </button>
          </div>

          <div className="chips">
            <span>🍽️ {selectedRestaurant.cuisine_description || 'Restaurant'}</span>
            <span>⭐ Grade {selectedRestaurant.grade || 'N/A'}</span>
          </div>

          {!showDirections ? (
            <button className="directions" onClick={() => startDirections(selectedRestaurant)}>
              Show Route
            </button>
          ) : (
            <button className="directions stop" onClick={stopDirections}>
              Stop Navigation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MapPage;