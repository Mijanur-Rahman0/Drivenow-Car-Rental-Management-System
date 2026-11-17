const { getRouteForBooking } = require('./routes_data');

/**
 * Calculates distance in km between two [lng, lat] coordinates via Haversine formula
 */
function calculateDistanceKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

class SimulationEngine {
  constructor(io, db) {
    this.io = io;
    this.db = db;
    // Map of rentalId -> simulation state { timer, carId, route, currentIndex, speedMultiplier, distanceCovered }
    this.activeSimulations = new Map();
  }

  /**
   * Start or resume simulation for a rental
   */
  async startTracking(rentalId, carId, routeName, initialSpeed = 1) {
    const rentalIdStr = String(rentalId);

    // If already active, avoid duplicate timers
    if (this.activeSimulations.has(rentalIdStr)) {
      const existing = this.activeSimulations.get(rentalIdStr);
      existing.speedMultiplier = initialSpeed;
      return existing;
    }

    const route = getRouteForBooking(routeName);
    const trackingCol = this.db.collection('car_trackings');
    const historyCol = this.db.collection('car_tracking_histories');

    // Retrieve or create initial tracking record in MongoDB
    let trackingDoc = await trackingCol.findOne({ rentalId: Number(rentalId) });
    let currentIndex = 0;
    let distanceCovered = 0;

    if (!trackingDoc) {
      const startPoint = route[0];
      trackingDoc = {
        rentalId: Number(rentalId),
        carId: Number(carId),
        routeName: routeName || 'Dhaka City Circuit',
        currentLocation: {
          type: 'Point',
          coordinates: startPoint.coords // [lng, lat]
        },
        locationName: startPoint.name,
        trackingStatus: 'active',
        speedKmH: startPoint.speed,
        speedMultiplier: initialSpeed,
        distanceCoveredKm: 0,
        isOverdue: false,
        lastUpdated: new Date()
      };
      await trackingCol.insertOne(trackingDoc);

      // Record first history entry
      await historyCol.insertOne({
        rentalId: Number(rentalId),
        carId: Number(carId),
        coordinates: startPoint.coords,
        locationName: startPoint.name,
        speedKmH: startPoint.speed,
        timestamp: new Date()
      });
    } else {
      distanceCovered = trackingDoc.distanceCoveredKm || 0;
      // Find closest index along route
      const currentCoords = trackingDoc.currentLocation?.coordinates || route[0].coords;
      let minDistance = Infinity;
      route.forEach((pt, i) => {
        const d = calculateDistanceKm(currentCoords, pt.coords);
        if (d < minDistance) {
          minDistance = d;
          currentIndex = i;
        }
      });
    }

    const simulationState = {
      rentalId: Number(rentalId),
      carId: Number(carId),
      route,
      currentIndex,
      speedMultiplier: initialSpeed,
      distanceCovered,
      timer: null
    };

    this.activeSimulations.set(rentalIdStr, simulationState);
    this.scheduleNextTick(rentalIdStr);

    console.log(`[Simulation] Started for Rental #${rentalId} (Car #${carId}) on ${routeName}`);
    return simulationState;
  }

  /**
   * Adjust simulation speed (1x, 2x, 5x)
   */
  setSpeed(rentalId, speedMultiplier) {
    const rentalIdStr = String(rentalId);
    if (this.activeSimulations.has(rentalIdStr)) {
      const sim = this.activeSimulations.get(rentalIdStr);
      sim.speedMultiplier = Number(speedMultiplier) || 1;
      clearTimeout(sim.timer);
      this.scheduleNextTick(rentalIdStr);
      return true;
    }
    return false;
  }

  /**
   * Pause simulation without deleting state
   */
  pauseTracking(rentalId) {
    const rentalIdStr = String(rentalId);
    if (this.activeSimulations.has(rentalIdStr)) {
      const sim = this.activeSimulations.get(rentalIdStr);
      clearTimeout(sim.timer);
      sim.timer = null;
      this.db.collection('car_trackings').updateOne(
        { rentalId: Number(rentalId) },
        { $set: { trackingStatus: 'paused', lastUpdated: new Date() } }
      );
      this.io.to(`rental_${rentalId}`).emit('tracking:status', { rentalId, status: 'paused' });
      return true;
    }
    return false;
  }

  /**
   * Stop tracking completely (when vehicle is returned)
   */
  async stopTracking(rentalId) {
    const rentalIdStr = String(rentalId);
    if (this.activeSimulations.has(rentalIdStr)) {
      const sim = this.activeSimulations.get(rentalIdStr);
      clearTimeout(sim.timer);
      this.activeSimulations.delete(rentalIdStr);
    }

    await this.db.collection('car_trackings').updateOne(
      { rentalId: Number(rentalId) },
      { $set: { trackingStatus: 'stopped', lastUpdated: new Date() } }
    );

    this.io.to(`rental_${rentalId}`).emit('tracking:status', { rentalId, status: 'stopped' });
    this.io.emit('admin:tracking:status', { rentalId, status: 'stopped' });
    console.log(`[Simulation] Stopped for Rental #${rentalId}`);
  }

  scheduleNextTick(rentalIdStr) {
    const sim = this.activeSimulations.get(rentalIdStr);
    if (!sim) return;

    // Base interval: 4000ms / speedMultiplier
    const intervalMs = Math.max(1000, Math.floor(4000 / sim.speedMultiplier));

    sim.timer = setTimeout(async () => {
      await this.stepSimulation(rentalIdStr);
      if (this.activeSimulations.has(rentalIdStr)) {
        this.scheduleNextTick(rentalIdStr);
      }
    }, intervalMs);
  }

  async stepSimulation(rentalIdStr) {
    const sim = this.activeSimulations.get(rentalIdStr);
    if (!sim) return;

    const prevPoint = sim.route[sim.currentIndex];
    sim.currentIndex = (sim.currentIndex + 1) % sim.route.length;
    const currentPoint = sim.route[sim.currentIndex];

    const stepDistance = calculateDistanceKm(prevPoint.coords, currentPoint.coords);
    sim.distanceCovered = Number((sim.distanceCovered + stepDistance).toFixed(2));

    const timestamp = new Date();

    // Check overdue status
    const bookingCol = this.db.collection('backend_booking');
    const booking = await bookingCol.findOne({ id: sim.rentalId });
    let isOverdue = false;
    let expectedReturnTime = null;

    if (booking) {
      const bookingDate = new Date(booking.booking_date);
      const durationDays = Number(booking.duration) || 1;
      expectedReturnTime = new Date(bookingDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      if (new Date() > expectedReturnTime && booking.booking_status !== 'completed') {
        isOverdue = true;
      }
    }

    const payload = {
      rentalId: sim.rentalId,
      carId: sim.carId,
      latitude: currentPoint.coords[1],
      longitude: currentPoint.coords[0],
      locationName: currentPoint.name,
      speedKmH: Math.round(currentPoint.speed * sim.speedMultiplier),
      distanceCoveredKm: sim.distanceCovered,
      isOverdue,
      expectedReturnTime,
      updatedAt: timestamp.toISOString()
    };

    // Update MongoDB
    try {
      await this.db.collection('car_trackings').updateOne(
        { rentalId: sim.rentalId },
        {
          $set: {
            currentLocation: {
              type: 'Point',
              coordinates: currentPoint.coords
            },
            locationName: currentPoint.name,
            speedKmH: payload.speedKmH,
            distanceCoveredKm: sim.distanceCovered,
            isOverdue,
            trackingStatus: 'active',
            lastUpdated: timestamp
          }
        },
        { upsert: true }
      );

      // Append to history (for route replay / polyline)
      await this.db.collection('car_tracking_histories').insertOne({
        rentalId: sim.rentalId,
        carId: sim.carId,
        coordinates: currentPoint.coords,
        locationName: currentPoint.name,
        speedKmH: payload.speedKmH,
        timestamp
      });
    } catch (err) {
      console.error('[Simulation Engine] DB update error:', err.message);
    }

    // Broadcast update via Socket.IO
    this.io.to(`rental_${sim.rentalId}`).emit('location:update', payload);
    this.io.emit('admin:location:update', payload);
  }

  cleanupAll() {
    for (const [rentalId, sim] of this.activeSimulations.entries()) {
      clearTimeout(sim.timer);
    }
    this.activeSimulations.clear();
    console.log('[Simulation] Cleaned up all timers.');
  }
}

module.exports = {
  SimulationEngine,
  calculateDistanceKm
};
