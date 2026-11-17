/**
 * Every backend endpoint as a small function — pages never write URLs by hand.
 */
import { request } from './client';

export const api = {
  // auth
  register: (payload) => request('/auth/register/', { method: 'POST', json: payload, auth: false }),
  login: (email, password) => request('/auth/login/', { method: 'POST', json: { email, password }, auth: false }),
  adminLogin: (email, password) => request('/auth/admin-login/', { method: 'POST', json: { email, password }, auth: false }),
  logout: () => request('/auth/logout/', { method: 'POST' }),
  me: () => request('/auth/me/'),

  // public
  cars: () => request('/cars/', { auth: false }),
  car: (id) => request(`/cars/${id}/`, { auth: false }),
  routes: () => request('/routes/', { auth: false }),

  // logged-in user
  bookings: () => request('/bookings/'),
  booking: (id) => request(`/bookings/${id}/`),
  createBooking: (payload) => request('/bookings/', { method: 'POST', json: payload }),
  returnCar: (bookingId) => request(`/bookings/${bookingId}/return/`, { method: 'POST' }),
  processPayment: (bookingId, action) =>
    request('/payments/process/', { method: 'POST', json: { booking_id: bookingId, action } }),

  // real-time vehicle tracking simulation
  tracking: {
    baseUrl: 'http://localhost:5001',
    getRentalTracking: (rentalId) => fetch(`http://localhost:5001/api/tracking/${rentalId}`).then(r => r.json()),
    getRentalHistory: (rentalId) => fetch(`http://localhost:5001/api/tracking/${rentalId}/history`).then(r => r.json()),
    getAllVehicles: () => fetch(`http://localhost:5001/api/tracking/vehicles`).then(r => r.json()),
    startTracking: (rentalId, payload = {}) => fetch(`http://localhost:5001/api/tracking/start/${rentalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json()),
    pauseTracking: (rentalId) => fetch(`http://localhost:5001/api/tracking/pause/${rentalId}`, { method: 'POST' }).then(r => r.json()),
    setSpeed: (rentalId, speed) => fetch(`http://localhost:5001/api/tracking/speed/${rentalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ speed })
    }).then(r => r.json()),
    stopTracking: (rentalId) => fetch(`http://localhost:5001/api/tracking/stop/${rentalId}`, { method: 'POST' }).then(r => r.json()),
    getStaticParkings: () => fetch(`http://localhost:5001/api/static-locations/cars`).then(r => r.json()),
    updateStaticParking: (payload) => fetch(`http://localhost:5001/api/static-locations/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json()),
  },

  // admin
  admin: {
    stats: () => request('/admin/stats/'),
    cars: () => request('/admin/cars/'),
    createCar: (formData) => request('/admin/cars/', { method: 'POST', form: formData }),
    updateCar: (id, payload) => {
      if (payload instanceof FormData) {
        return request(`/admin/cars/${id}/`, { method: 'PATCH', form: payload });
      }
      return request(`/admin/cars/${id}/`, { method: 'PATCH', json: payload });
    },
    deleteCar: (id) => request(`/admin/cars/${id}/`, { method: 'DELETE' }),
    toggleCar: (id) => request(`/admin/cars/${id}/toggle/`, { method: 'POST' }),
    bookings: () => request('/admin/bookings/'),
    bookingAction: (id, action) => request(`/admin/bookings/${id}/${action}/`, { method: 'POST' }),
    users: () => request('/admin/users/'),
    toggleUser: (id) => request(`/admin/users/${id}/toggle/`, { method: 'POST' }),
    payments: () => request('/admin/payments/'),
  },
};
