import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// OpenStreetMap tiles: free, no API key (attribution required by their licence)
const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
const PH_CENTER = [12.8797, 121.774]; // whole Philippines when no pin yet

// a CSS pin instead of Leaflet's image icon (image paths break in bundlers)
const pinIcon = L.divIcon({
  className: 'ah-pin',
  html: '<div class="ah-pin-body"><span class="ah-pin-dot"></span></div><div class="ah-pin-shadow"></div>',
  iconSize: [36, 46],
  iconAnchor: [18, 44],
});

export const hasPin = (lat, lng) => lat !== null && lat !== undefined && lat !== '' && lng !== null && lng !== undefined && lng !== '';

/** Google Maps turn-by-turn route from the courier's current position to the pin. */
export const directionsUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

/** Buyer picks the delivery spot: GPS button, tap the map, or drag the pin. value = { lat, lng } */
export function LocationPicker({ value, onChange, height = 300 }) {
  const box = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const circle = useRef(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const place = (lat, lng, zoom) => {
    const m = map.current;
    if (!m) return;
    if (!marker.current) {
      marker.current = L.marker([lat, lng], { icon: pinIcon, draggable: true, autoPan: true, keyboard: true, title: 'Delivery location — drag to adjust' }).addTo(m);
      marker.current.on('dragend', () => {
        const p = marker.current.getLatLng();
        circle.current?.remove(); circle.current = null;
        onChange({ lat: +p.lat.toFixed(7), lng: +p.lng.toFixed(7) });
        setStatus('📍 Pin moved. This is where the courier will go.');
      });
    } else {
      marker.current.setLatLng([lat, lng]);
    }
    if (zoom) m.setView([lat, lng], zoom);
  };

  useEffect(() => {
    const start = hasPin(value?.lat, value?.lng);
    const m = L.map(box.current, { scrollWheelZoom: false }).setView(start ? [value.lat, value.lng] : PH_CENTER, start ? 17 : 6);
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m);
    map.current = m;
    if (start) place(value.lat, value.lng);
    m.on('click', (e) => {
      circle.current?.remove(); circle.current = null;
      place(e.latlng.lat, e.latlng.lng);
      onChange({ lat: +e.latlng.lat.toFixed(7), lng: +e.latlng.lng.toFixed(7) });
      setStatus('📍 Pin placed. Drag it to fine-tune.');
    });
    return () => { m.remove(); map.current = null; marker.current = null; circle.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useGps = () => {
    if (!('geolocation' in navigator)) { setStatus('⚠️ This browser cannot share its location. Tap the map to place the pin instead.'); return; }
    setBusy(true);
    setStatus('🛰️ Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        place(lat, lng, 17);
        circle.current?.remove();
        circle.current = L.circle([lat, lng], { radius: accuracy, color: '#36844a', weight: 1, fillOpacity: 0.12 }).addTo(map.current);
        onChange({ lat: +lat.toFixed(7), lng: +lng.toFixed(7) });
        setStatus(`✅ Location found (accurate to about ${Math.round(accuracy)} m). Drag the pin if it is not exactly your door.`);
        setBusy(false);
      },
      (err) => {
        setBusy(false);
        setStatus(err.code === 1
          ? '⚠️ Location permission was blocked. Allow it in your browser, or tap the map to place the pin.'
          : '⚠️ Could not get your location. Tap the map to place the pin instead.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="loc-picker">
      <div className="loc-bar">
        <button type="button" className="btn btn-primary btn-sm" onClick={useGps} disabled={busy}>
          {busy ? '🛰️ Locating…' : '📍 Use my current location'}
        </button>
        <span className="muted small">or tap the map, then drag the pin to your exact door</span>
      </div>
      <div ref={box} className="loc-map" style={{ height }} role="application" aria-label="Map: tap to place your delivery pin" />
      {status && <p className="loc-status">{status}</p>}
      {hasPin(value?.lat, value?.lng) && (
        <p className="loc-coords muted small">Pinned at {Number(value.lat).toFixed(5)}, {Number(value.lng).toFixed(5)}</p>
      )}
    </div>
  );
}

/** Small read-only map of a delivery pin (mounts only when scrolled into view). */
export function PinMap({ lat, lng, height = 180 }) {
  const box = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(box.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const m = L.map(box.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView([lat, lng], 16);
    L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m);
    L.marker([lat, lng], { icon: pinIcon, title: 'Buyer’s delivery pin' }).addTo(m);
    return () => m.remove();
  }, [visible, lat, lng]);

  return <div ref={box} className="pin-map" style={{ height }} aria-label="Map showing the buyer’s delivery pin" />;
}
