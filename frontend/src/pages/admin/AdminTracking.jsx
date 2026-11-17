import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import {
  Navigation,
  Car as CarIcon,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Gauge,
  MapPin,
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  History
} from 'lucide-react';

// Custom Map Marker Icons using Leaflet divIcon with Lucide SVG styling
const createCarIcon = (isOverdue, isSelected) => {
  const bgClass = isOverdue ? 'bg-red-600 animate-pulse ring-4 ring-red-300' : 'bg-emerald-600 ring-4 ring-emerald-200';
  const border = isSelected ? 'border-2 border-yellow-400 scale-125' : '';
  return L.divIcon({
    className: 'custom-car-marker',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg text-white ${bgClass} ${border} transition-all duration-300">
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
};

const createParkingIcon = () => {
  return L.divIcon({
    className: 'custom-parking-marker',
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-lg shadow-md bg-blue-600 text-white font-bold border-2 border-white text-xs">
        P
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Map auto-focus helper component
function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 13, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map Click Listener to pick parking spot
function MapClickPicker({ onLocationPicked }) {
  useMapEvents({
    click(e) {
      if (onLocationPicked) {
        onLocationPicked(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

export default function AdminTracking() {
  const toast = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [selectedRentalId, setSelectedRentalId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | active | overdue | returned | parking
  const [speed, setSpeed] = useState(1);
  const [historyPoints, setHistoryPoints] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const [parkingCars, setParkingCars] = useState([]);
  const [pickingForCar, setPickingForCar] = useState(null);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef(null);

  // Load vehicles from backend
  const refreshVehicles = async () => {
    try {
      const data = await api.tracking.getAllVehicles();
      setVehicles(data);
      if (!selectedRentalId && data.length > 0) {
        setSelectedRentalId(data[0].rentalId);
      }
    } catch (err) {
      toast('Failed to load tracking data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadParkingCars = async () => {
    try {
      const parkings = await api.tracking.getStaticParkings();
      setParkingCars(parkings);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshVehicles();
    loadParkingCars();

    // Connect to Socket.IO tracking server
    const socket = io('http://localhost:5001');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Tracking Socket.IO server');
    });

    // Real-time broadcast for admin
    socket.on('admin:location:update', (payload) => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.rentalId === payload.rentalId) {
            return {
              ...v,
              isOverdue: payload.isOverdue,
              tracking: {
                ...(v.tracking || {}),
                currentLocation: {
                  type: 'Point',
                  coordinates: [payload.longitude, payload.latitude]
                },
                locationName: payload.locationName,
                speedKmH: payload.speedKmH,
                distanceCoveredKm: payload.distanceCoveredKm,
                lastUpdated: payload.updatedAt,
                trackingStatus: 'active'
              }
            };
          }
          return v;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch history for selected vehicle
  useEffect(() => {
    if (!selectedRentalId) return;
    api.tracking.getRentalHistory(selectedRentalId)
      .then((history) => {
        setHistoryPoints(history.map((h) => [h.coordinates[1], h.coordinates[0]])); // Leaflet expects [lat, lng]
      })
      .catch(console.error);
  }, [selectedRentalId]);

  const selectedVehicle = vehicles.find((v) => v.rentalId === selectedRentalId);

  // Controls
  const handleStart = async (rentalId) => {
    try {
      await api.tracking.startTracking(rentalId, { speed });
      toast(`Tracking resumed for Rental #${rentalId}`, 'success');
      refreshVehicles();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handlePause = async (rentalId) => {
    try {
      await api.tracking.pauseTracking(rentalId);
      toast(`Tracking paused for Rental #${rentalId}`, 'info');
      refreshVehicles();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleStop = async (rentalId) => {
    if (!window.confirm('Stop simulation and complete vehicle tracking?')) return;
    try {
      await api.tracking.stopTracking(rentalId);
      toast(`Tracking stopped for Rental #${rentalId}`, 'info');
      refreshVehicles();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleSpeedChange = async (newSpeed) => {
    setSpeed(newSpeed);
    if (selectedRentalId) {
      await api.tracking.setSpeed(selectedRentalId, newSpeed);
      toast(`Simulation speed set to ${newSpeed}x`, 'info');
    }
  };

  const handleMapClickForParking = async (lat, lng) => {
    if (!pickingForCar) return;
    try {
      await api.tracking.updateStaticParking({
        carId: pickingForCar.id,
        latitude: lat,
        longitude: lng,
        address: `Custom Hub (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      });
      toast(`Parking location saved for ${pickingForCar.car_name}`, 'success');
      setPickingForCar(null);
      loadParkingCars();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Filter list
  const filteredVehicles = vehicles.filter((v) => {
    if (filter === 'active') return v.bookingStatus === 'confirmed';
    if (filter === 'overdue') return v.isOverdue;
    if (filter === 'returned') return v.bookingStatus === 'completed';
    return true;
  });

  const mapCenter = selectedVehicle?.tracking?.currentLocation?.coordinates
    ? [selectedVehicle.tracking.currentLocation.coordinates[1], selectedVehicle.tracking.currentLocation.coordinates[0]]
    : [23.8103, 90.4125];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between border border-dark/10">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="h-6 w-6 text-dark" />
            <h1 className="font-head text-2xl font-bold text-dark">Live GPS Vehicle Tracking (Simulation)</h1>
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 uppercase tracking-wide">
              Demo / Simulated
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Monitor real-time simulated movements, route history, overdue rentals, and parking locations.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            ['all', 'All Rentals'],
            ['active', 'Active (On Route)'],
            ['overdue', 'Overdue ⚠️'],
            ['returned', 'Returned'],
            ['parking', 'Parking Spots 🅿️']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                filter === id
                  ? 'bg-dark text-cream shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {pickingForCar && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900 flex items-center justify-between animate-pulse">
          <div>
            <strong>Click anywhere on the map</strong> to set parking location for <strong>{pickingForCar.car_name}</strong>.
          </div>
          <button
            onClick={() => setPickingForCar(null)}
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
          >
            Cancel Picker
          </button>
        </div>
      )}

      {/* Main Grid: Left Map + Right Vehicle Detail Panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Map Section */}
        <div className="relative h-[620px] rounded-2xl overflow-hidden border border-dark/15 shadow-sm lg:col-span-2 bg-slate-100">
          <MapContainer
            center={mapCenter}
            zoom={12}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapCenterController center={mapCenter} zoom={13} />
            <MapClickPicker onLocationPicked={handleMapClickForParking} />

            {/* Historical route polyline */}
            {showHistory && historyPoints.length > 1 && (
              <Polyline
                positions={historyPoints}
                pathOptions={{ color: '#2563eb', weight: 5, dashArray: '8, 8', opacity: 0.8 }}
              />
            )}

            {/* Active Moving Vehicle Markers */}
            {filter !== 'parking' &&
              vehicles.map((v) => {
                const coords = v.tracking?.currentLocation?.coordinates;
                if (!coords) return null;
                const lat = coords[1];
                const lng = coords[0];
                const isSelected = v.rentalId === selectedRentalId;

                return (
                  <Marker
                    key={v.rentalId}
                    position={[lat, lng]}
                    icon={createCarIcon(v.isOverdue, isSelected)}
                    eventHandlers={{
                      click: () => setSelectedRentalId(v.rentalId)
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs font-sans">
                        <div className="font-bold text-sm text-dark">{v.carName}</div>
                        <div><strong>Customer:</strong> {v.userName}</div>
                        <div><strong>Route:</strong> {v.route}</div>
                        <div><strong>Speed:</strong> {v.tracking?.speedKmH || 0} km/h</div>
                        <div><strong>Distance:</strong> {v.tracking?.distanceCoveredKm || 0} km</div>
                        {v.isOverdue && (
                          <div className="text-red-600 font-bold">⚠️ OVERDUE RENTAL</div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Static Parking Markers */}
            {(filter === 'parking' || filter === 'all') &&
              parkingCars.map((c) => {
                const coords = c.parking?.location?.coordinates || [90.4125, 23.8103];
                return (
                  <Marker
                    key={'parking-' + c.id}
                    position={[coords[1], coords[0]]}
                    icon={createParkingIcon()}
                  >
                    <Popup>
                      <div className="p-1 text-xs">
                        <div className="font-bold text-dark">{c.car_name} (Parking)</div>
                        <div>{c.parking?.address}</div>
                        <div className="mt-1">
                          <button
                            onClick={() => setPickingForCar(c)}
                            className="rounded bg-blue-600 text-white px-2 py-0.5 text-[10px]"
                          >
                            Reposition On Map
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>

          {/* Map floating controls */}
          <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 bg-white/95 backdrop-blur p-2 rounded-xl shadow-lg border border-dark/10">
            <div className="text-[11px] font-bold text-gray-500 uppercase px-1">Simulation Speed</div>
            <div className="flex gap-1">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    speed === s ? 'bg-dark text-white' : 'bg-gray-100 hover:bg-gray-200 text-dark'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="mt-1 pt-1 border-t border-gray-200">
              <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHistory}
                  onChange={(e) => setShowHistory(e.target.checked)}
                  className="rounded text-dark focus:ring-sage"
                />
                Show Breadcrumbs
              </label>
            </div>
          </div>
        </div>

        {/* Right Panel: Selected Vehicle Details & Live Telemetry */}
        <div className="space-y-4">
          {selectedVehicle ? (
            <div className="rounded-2xl border border-dark/15 bg-white p-5 shadow-sm space-y-5">
              {/* Car title & Overdue alert */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-head text-xl font-bold text-dark">{selectedVehicle.carName}</h2>
                    <p className="text-xs text-muted">Rental #{selectedVehicle.rentalId} • {selectedVehicle.model}</p>
                  </div>
                  {selectedVehicle.isOverdue ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 animate-pulse">
                      <AlertTriangle className="h-3.5 w-3.5" /> OVERDUE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /> On Time
                    </span>
                  )}
                </div>
              </div>

              {/* Telemetry Cards */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-warm/30 p-3 border border-dark/10">
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                    <Gauge className="h-3.5 w-3.5 text-dark" /> Speed
                  </div>
                  <div className="font-head text-lg font-bold text-dark">
                    {selectedVehicle.tracking?.speedKmH || 0} <span className="text-xs font-normal">km/h</span>
                  </div>
                </div>

                <div className="rounded-xl bg-warm/30 p-3 border border-dark/10">
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1">
                    <Compass className="h-3.5 w-3.5 text-dark" /> Distance
                  </div>
                  <div className="font-head text-lg font-bold text-dark">
                    {selectedVehicle.tracking?.distanceCoveredKm || 0} <span className="text-xs font-normal">km</span>
                  </div>
                </div>
              </div>

              {/* Location details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-dark">Current Location:</div>
                    <div className="text-gray-600 font-medium">
                      {selectedVehicle.tracking?.locationName || 'Calculating GPS fix...'}
                    </div>
                    {selectedVehicle.tracking?.currentLocation?.coordinates && (
                      <div className="text-gray-400 text-[11px] font-mono">
                        {selectedVehicle.tracking.currentLocation.coordinates[1].toFixed(5)}°N,{' '}
                        {selectedVehicle.tracking.currentLocation.coordinates[0].toFixed(5)}°E
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-700 shrink-0" />
                  <div>
                    <span className="text-gray-500">Last Ping: </span>
                    <span className="font-medium text-dark">
                      {selectedVehicle.tracking?.lastUpdated
                        ? new Date(selectedVehicle.tracking.lastUpdated).toLocaleTimeString()
                        : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-700 shrink-0" />
                  <div>
                    <span className="text-gray-500">Expected Return: </span>
                    <span className="font-medium text-dark">
                      {new Date(selectedVehicle.expectedReturnTime).toLocaleDateString()}{' '}
                      {new Date(selectedVehicle.expectedReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Customer: </span>
                  <span className="font-semibold text-dark">{selectedVehicle.userName}</span>{' '}
                  <span className="text-gray-400">({selectedVehicle.userEmail})</span>
                </div>
              </div>

              {/* Simulation Action Controls */}
              <div className="pt-2 border-t border-dark/10 space-y-2">
                <div className="text-xs font-bold text-gray-500 uppercase">Simulation Controls</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleStart(selectedVehicle.rentalId)}
                    className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 inline-flex items-center justify-center gap-1"
                  >
                    <Play className="h-3 w-3" /> Start
                  </button>
                  <button
                    onClick={() => handlePause(selectedVehicle.rentalId)}
                    className="btn btn-sm bg-amber-500 text-white hover:bg-amber-600 inline-flex items-center justify-center gap-1"
                  >
                    <Pause className="h-3 w-3" /> Pause
                  </button>
                  <button
                    onClick={() => handleStop(selectedVehicle.rentalId)}
                    className="btn btn-sm bg-red-600 text-white hover:bg-red-700 inline-flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Stop
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-dark/20 bg-white p-8 text-center text-muted">
              <CarIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>Select a vehicle to view live telemetry and control simulation.</p>
            </div>
          )}

          {/* Quick Vehicle Fleet List */}
          <div className="rounded-2xl border border-dark/15 bg-white p-4 shadow-sm">
            <h3 className="font-head text-base font-bold text-dark mb-3">Tracked Fleet ({filteredVehicles.length})</h3>
            <div className="max-h-[220px] overflow-y-auto divide-y divide-gray-100 space-y-1">
              {filteredVehicles.map((v) => (
                <div
                  key={v.rentalId}
                  onClick={() => setSelectedRentalId(v.rentalId)}
                  className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs transition ${
                    v.rentalId === selectedRentalId
                      ? 'bg-warm/50 font-bold border border-dark/20'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="text-dark font-semibold">{v.carName}</div>
                    <div className="text-gray-400">{v.route}</div>
                  </div>
                  <div className="text-right">
                    {v.isOverdue ? (
                      <span className="text-red-600 font-bold">Overdue</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">{v.bookingStatus}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
