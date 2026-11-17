require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');
const { SimulationEngine } = require('./simulation_engine');
const { ROUTES, DHAKA_CITY_ROUTE } = require('./routes_data');

const PORT = process.env.TRACKING_PORT || 5001;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'car_rental_db';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let db = null;
let simulationEngine = null;

// Connect to MongoDB
async function initMongo() {
  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`[Tracking Service] Connected to MongoDB database: ${DB_NAME}`);
  simulationEngine = new SimulationEngine(io, db);

  // Resume tracking for any currently 'confirmed' bookings
  resumeActiveRentals();
}

async function resumeActiveRentals() {
  try {
    const bookingCol = db.collection('backend_booking');
    const carCol = db.collection('backend_car');
    const activeBookings = await bookingCol.find({ booking_status: 'confirmed' }).toArray();

    for (const b of activeBookings) {
      const car = await carCol.findOne({ id: b.car_id });
      const routeName = b.custom_route || (car ? car.route : 'Dhaka City Circuit');
      await simulationEngine.startTracking(b.id, b.car_id, routeName, 1);
    }
  } catch (err) {
    console.error('[Tracking Service] Error resuming active rentals:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// SOCKET.IO REAL-TIME CONNECTION
// ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Customer or Admin joins rental specific room
  socket.on('join:rental', async ({ rentalId, token }) => {
    if (!rentalId) return;
    const room = `rental_${rentalId}`;
    socket.join(room);
    console.log(`[Socket.IO] Client ${socket.id} joined room: ${room}`);

    // Send latest saved location immediately upon joining/reconnecting
    try {
      const latest = await db.collection('car_trackings').findOne({ rentalId: Number(rentalId) });
      if (latest) {
        socket.emit('location:update', {
          rentalId: latest.rentalId,
          carId: latest.carId,
          latitude: latest.currentLocation.coordinates[1],
          longitude: latest.currentLocation.coordinates[0],
          locationName: latest.locationName,
          speedKmH: latest.speedKmH || 0,
          distanceCoveredKm: latest.distanceCoveredKm || 0,
          isOverdue: latest.isOverdue || false,
          updatedAt: latest.lastUpdated
        });
      }
    } catch (err) {
      console.error('[Socket.IO] Error fetching latest location:', err);
    }
  });

  socket.on('leave:rental', ({ rentalId }) => {
    socket.leave(`rental_${rentalId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────────────────────
// REST API ENDPOINTS
// ─────────────────────────────────────────────────────────────

// Start or resume tracking for a rental
app.post('/api/tracking/start/:rentalId', async (req, res) => {
  try {
    const { rentalId } = req.params;
    const { carId, routeName, speed } = req.body;

    // Fetch booking details if not provided
    let finalCarId = carId;
    let finalRoute = routeName;
    if (!finalCarId || !finalRoute) {
      const booking = await db.collection('backend_booking').findOne({ id: Number(rentalId) });
      if (booking) {
        finalCarId = booking.car_id;
        const car = await db.collection('backend_car').findOne({ id: booking.car_id });
        finalRoute = booking.custom_route || (car ? car.route : 'Dhaka City Circuit');
      }
    }

    const sim = await simulationEngine.startTracking(rentalId, finalCarId || 1, finalRoute, speed || 1);
    res.json({ success: true, message: `Tracking started for rental #${rentalId}`, simulation: sim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pause tracking
app.post('/api/tracking/pause/:rentalId', (req, res) => {
  const { rentalId } = req.params;
  const ok = simulationEngine.pauseTracking(rentalId);
  res.json({ success: ok, message: ok ? 'Tracking paused' : 'Rental not actively running' });
});

// Adjust simulation speed (1x, 2x, 5x)
app.post('/api/tracking/speed/:rentalId', (req, res) => {
  const { rentalId } = req.params;
  const { speed } = req.body;
  const ok = simulationEngine.setSpeed(rentalId, speed);
  res.json({ success: ok, speed: speed || 1 });
});

// Stop tracking (upon rental completion)
app.post('/api/tracking/stop/:rentalId', async (req, res) => {
  try {
    const { rentalId } = req.params;
    await simulationEngine.stopTracking(rentalId);
    res.json({ success: true, message: `Tracking stopped for rental #${rentalId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tracked vehicles (for Admin Fleet Dashboard) - MUST be declared before :rentalId
app.get('/api/tracking/vehicles', async (req, res) => {
  try {
    const trackings = await db.collection('car_trackings').find({}).toArray();
    const cars = await db.collection('backend_car').find({}).toArray();
    const bookings = await db.collection('backend_booking').find({}).toArray();
    const users = await db.collection('backend_userprofile').find({}).toArray();

    const carMap = new Map(cars.map(c => [c.id, c]));
    const userMap = new Map(users.map(u => [u.id, u]));

    const enriched = bookings.map(b => {
      const car = carMap.get(b.car_id);
      const user = userMap.get(b.user_id);
      const track = trackings.find(t => t.rentalId === b.id);

      // Overdue calculation
      const bookingDate = new Date(b.booking_date);
      const durationDays = Number(b.duration) || 1;
      const expectedReturn = new Date(bookingDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const isOverdue = new Date() > expectedReturn && b.booking_status !== 'completed';

      return {
        rentalId: b.id,
        carId: b.car_id,
        carName: car ? car.car_name : 'Unknown Car',
        model: car ? car.model : '',
        carImage: car && car.image_path ? `http://127.0.0.1:8000/media/${car.image_path}` : null,
        route: b.custom_route || (car ? car.route : 'Custom'),
        userName: user ? user.name : 'Unknown Customer',
        userEmail: user ? user.email : '',
        bookingStatus: b.booking_status,
        durationDays,
        bookingDate: b.booking_date,
        pickupTime: b.pickup_time,
        returnTime: b.return_time,
        expectedReturnTime: expectedReturn,
        isOverdue,
        tracking: track || null
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get location history (breadcrumbs & polyline points)
app.get('/api/tracking/:rentalId/history', async (req, res) => {
  try {
    const { rentalId } = req.params;
    const history = await db.collection('car_tracking_histories')
      .find({ rentalId: Number(rentalId) })
      .sort({ timestamp: 1 })
      .limit(300)
      .toArray();
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current live tracking details for a single rental
app.get('/api/tracking/:rentalId', async (req, res) => {
  try {
    const { rentalId } = req.params;
    const tracking = await db.collection('car_trackings').findOne({ rentalId: Number(rentalId) });
    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }
    res.json(tracking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Static parking locations: get all cars with their parking spots
app.get('/api/static-locations/cars', async (req, res) => {
  try {
    const cars = await db.collection('backend_car').find({}).toArray();
    const parkings = await db.collection('car_static_parking').find({}).toArray();
    const parkingMap = new Map(parkings.map(p => [p.carId, p]));

    const result = cars.map(c => {
      const p = parkingMap.get(c.id);
      return {
        id: c.id,
        car_name: c.car_name,
        model: c.model,
        carImage: c.image_path ? `http://127.0.0.1:8000/media/${c.image_path}` : null,
        availability: c.availability,
        price: c.price,
        route: c.route,
        parking: p || {
          carId: c.id,
          location: {
            type: 'Point',
            coordinates: [90.4125, 23.8103] // Dhaka default
          },
          address: 'Main Hub, Dhaka'
        }
      };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update static parking location for a car
app.post('/api/static-locations/update', async (req, res) => {
  try {
    const { carId, longitude, latitude, address } = req.body;
    if (!carId || longitude === undefined || latitude === undefined) {
      return res.status(400).json({ error: 'carId, longitude, and latitude are required' });
    }

    const doc = {
      carId: Number(carId),
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      address: address || 'Designated Parking Hub',
      updatedAt: new Date()
    };

    await db.collection('car_static_parking').updateOne(
      { carId: Number(carId) },
      { $set: doc },
      { upsert: true }
    );

    res.json({ success: true, message: 'Parking location updated', parking: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  if (simulationEngine) simulationEngine.cleanupAll();
  process.exit(0);
});

initMongo().then(() => {
  server.listen(PORT, () => {
    console.log(`[Tracking Service] Server listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('[Tracking Service] Failed to initialize:', err);
});
