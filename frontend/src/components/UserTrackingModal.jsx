import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { X, Navigation, Gauge, Compass, MapPin, Clock } from 'lucide-react';

const userCarIcon = L.divIcon({
  className: 'custom-user-car-marker',
  html: `
    <div class="flex items-center justify-center w-10 h-10 rounded-full shadow-xl bg-emerald-600 border-2 border-white text-white animate-bounce">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <path d="M9 17h6"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.panTo(center, { animate: true, duration: 1 });
    }
  }, [center, map]);
  return null;
}

export default function UserTrackingModal({ booking, onClose }) {
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!booking) return;

    // Load initial position & history
    api.tracking.getRentalTracking(booking.id)
      .then((data) => {
        setTelemetry({
          latitude: data.currentLocation.coordinates[1],
          longitude: data.currentLocation.coordinates[0],
          locationName: data.locationName,
          speedKmH: data.speedKmH,
          distanceCoveredKm: data.distanceCoveredKm,
          updatedAt: data.lastUpdated
        });
      })
      .catch(console.error);

    api.tracking.getRentalHistory(booking.id)
      .then((pts) => {
        setHistory(pts.map((p) => [p.coordinates[1], p.coordinates[0]]));
      })
      .catch(console.error);

    // Connect to rental-specific room via Socket.IO
    const socket = io('http://localhost:5001');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join:rental', { rentalId: booking.id });
    });

    socket.on('location:update', (payload) => {
      setTelemetry(payload);
      setHistory((prev) => [...prev, [payload.latitude, payload.longitude]]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave:rental', { rentalId: booking.id });
        socketRef.current.disconnect();
      }
    };
  }, [booking]);

  if (!booking) return null;

  const currentCoords = telemetry
    ? [telemetry.latitude, telemetry.longitude]
    : [23.8103, 90.4125];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-dark/20 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-dark px-6 py-4 text-cream">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage text-dark">
              <Navigation className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-head text-lg font-bold">{booking.car.car_name} — Live GPS Tracking</h3>
              <p className="text-xs text-cream/70">
                Route: {booking.final_route} • <span className="text-amber-300 font-semibold">Simulated Demo</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-cream hover:bg-white/20 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Map View */}
        <div className="relative h-[420px] w-full bg-slate-100">
          <MapContainer
            center={currentCoords}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter center={currentCoords} />

            {history.length > 1 && (
              <Polyline
                positions={history}
                pathOptions={{ color: '#059669', weight: 5, dashArray: '6, 6' }}
              />
            )}

            <Marker position={currentCoords} icon={userCarIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <strong>{booking.car.car_name}</strong>
                  <div>{telemetry?.locationName || 'In Transit'}</div>
                  <div>Speed: {telemetry?.speedKmH || 0} km/h</div>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Modal Footer: Live Telemetry Bar */}
        <div className="bg-cream/40 p-4 border-t border-dark/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-white p-3 border border-dark/10">
            <div className="flex items-center gap-1.5 text-muted mb-1">
              <Gauge className="h-3.5 w-3.5 text-dark" /> Speed
            </div>
            <div className="font-head text-base font-bold text-dark">
              {telemetry?.speedKmH || 0} km/h
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 border border-dark/10">
            <div className="flex items-center gap-1.5 text-muted mb-1">
              <Compass className="h-3.5 w-3.5 text-dark" /> Distance Traveled
            </div>
            <div className="font-head text-base font-bold text-dark">
              {telemetry?.distanceCoveredKm || 0} km
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 border border-dark/10">
            <div className="flex items-center gap-1.5 text-muted mb-1">
              <MapPin className="h-3.5 w-3.5 text-dark" /> Location
            </div>
            <div className="font-medium text-dark truncate">
              {telemetry?.locationName || 'Detecting GPS...'}
            </div>
          </div>

          <div className="rounded-xl bg-white p-3 border border-dark/10">
            <div className="flex items-center gap-1.5 text-muted mb-1">
              <Clock className="h-3.5 w-3.5 text-dark" /> Last Update
            </div>
            <div className="font-medium text-dark">
              {telemetry?.updatedAt ? new Date(telemetry.updatedAt).toLocaleTimeString() : 'Connecting...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
