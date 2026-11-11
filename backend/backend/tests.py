from rest_framework.test import APITestCase

from .models import Car, UserProfile


class ApiFlowTests(APITestCase):

    def setUp(self):
        self.admin = UserProfile.objects.create_superuser('admin@x.com', 'Admin', 'adminpass1')
        self.user = UserProfile.objects.create_user('u@x.com', 'User One', 'userpass1')
        self.car = Car.objects.create(car_name='NOAH', model='2019', price=5600,
                                      route='Dhaka → Chittagong')
        self.custom_car = Car.objects.create(car_name='Hiace', model='2020', price=8000,
                                             allow_custom_route=True)

    def _login(self, email, password, url='/api/auth/login/'):
        res = self.client.post(url, {'email': email, 'password': password}, format='json')
        self.assertEqual(res.status_code, 200, res.content)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + res.data['token'])
        return res.data

    # ── auth ──────────────────────────────────────────────
    def test_register_validation_and_success(self):
        url = '/api/auth/register/'
        bad = self.client.post(url, {'name': 'A', 'email': 'a@x.com',
                                     'password': 'short', 'password2': 'short'}, format='json')
        self.assertEqual(bad.status_code, 400)
        mismatch = self.client.post(url, {'name': 'A', 'email': 'a@x.com',
                                          'password': 'longenough1', 'password2': 'nope'}, format='json')
        self.assertEqual(mismatch.data['detail'], 'Passwords do not match.')
        dup = self.client.post(url, {'name': 'A', 'email': 'u@x.com',
                                     'password': 'longenough1', 'password2': 'longenough1'}, format='json')
        self.assertEqual(dup.data['detail'], 'Email already exists.')
        ok = self.client.post(url, {'name': 'A', 'email': 'a@x.com',
                                    'password': 'longenough1', 'password2': 'longenough1'}, format='json')
        self.assertEqual(ok.status_code, 201)

    def test_login_logout_me(self):
        bad = self.client.post('/api/auth/login/', {'email': 'u@x.com', 'password': 'wrong'}, format='json')
        self.assertEqual(bad.status_code, 401)
        data = self._login('u@x.com', 'userpass1')
        self.assertFalse(data['user']['is_superuser'])
        self.assertEqual(self.client.get('/api/auth/me/').data['email'], 'u@x.com')
        self.client.post('/api/auth/logout/')
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)

    def test_inactive_user_cannot_login(self):
        self.user.account_status = 'inactive'
        self.user.save()
        res = self.client.post('/api/auth/login/', {'email': 'u@x.com', 'password': 'userpass1'}, format='json')
        self.assertEqual(res.status_code, 403)

    def test_admin_login_rejects_normal_user(self):
        res = self.client.post('/api/auth/admin-login/', {'email': 'u@x.com', 'password': 'userpass1'}, format='json')
        self.assertEqual(res.status_code, 401)
        self._login('admin@x.com', 'adminpass1', '/api/auth/admin-login/')

    # ── public ────────────────────────────────────────────
    def test_public_cars_and_routes(self):
        cars = self.client.get('/api/cars/')
        self.assertEqual(cars.status_code, 200)
        self.assertEqual(len(cars.data), 2)
        routes = {r['value']: r['car_count'] for r in self.client.get('/api/routes/').data}
        self.assertEqual(routes['Dhaka → Chittagong'], 1)
        self.assertEqual(routes['Dhaka → Sylhet'], 0)

    # ── booking + payment ─────────────────────────────────
    def test_booking_requires_login(self):
        res = self.client.post('/api/bookings/', {'car_id': self.car.id, 'duration': 2}, format='json')
        self.assertEqual(res.status_code, 401)

    def test_booking_and_payment_success(self):
        self._login('u@x.com', 'userpass1')
        res = self.client.post('/api/bookings/', {'car_id': self.car.id, 'duration': 3}, format='json')
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.data['total_cost'], 5600 * 3)
        self.assertEqual(res.data['final_route'], 'Dhaka → Chittagong')
        self.assertEqual(res.data['payment']['payment_status'], 'pending')
        bid = res.data['id']

        pay = self.client.post('/api/payments/process/', {'booking_id': bid, 'action': 'success'}, format='json')
        self.assertEqual(pay.status_code, 200)
        self.assertEqual(pay.data['booking']['booking_status'], 'confirmed')
        self.car.refresh_from_db()
        self.assertFalse(self.car.availability)

        again = self.client.post('/api/payments/process/', {'booking_id': bid, 'action': 'fail'}, format='json')
        self.assertEqual(again.status_code, 400)       # replay is blocked

        self.assertEqual(len(self.client.get('/api/bookings/').data), 1)
        # unavailable car can no longer be booked
        res2 = self.client.post('/api/bookings/', {'car_id': self.car.id, 'duration': 1}, format='json')
        self.assertEqual(res2.status_code, 400)

    def test_payment_failure_cancels(self):
        self._login('u@x.com', 'userpass1')
        bid = self.client.post('/api/bookings/', {'car_id': self.car.id, 'duration': 1}, format='json').data['id']
        pay = self.client.post('/api/payments/process/', {'booking_id': bid, 'action': 'fail'}, format='json')
        self.assertEqual(pay.data['booking']['booking_status'], 'cancelled')
        self.assertEqual(pay.data['booking']['payment']['payment_status'], 'failed')

    def test_custom_route_rules(self):
        self._login('u@x.com', 'userpass1')
        missing = self.client.post('/api/bookings/', {'car_id': self.custom_car.id, 'duration': 1}, format='json')
        self.assertEqual(missing.data['detail'], 'Please enter your route.')
        ok = self.client.post('/api/bookings/', {'car_id': self.custom_car.id, 'duration': 2,
                                                 'custom_route': 'Dhaka → Cox'}, format='json')
        self.assertEqual(ok.data['final_route'], 'Dhaka → Cox')

    def test_cannot_see_other_users_booking(self):
        self._login('u@x.com', 'userpass1')
        bid = self.client.post('/api/bookings/', {'car_id': self.car.id, 'duration': 1}, format='json').data['id']
        self.client.credentials()
        UserProfile.objects.create_user('o@x.com', 'Other', 'otherpass1')
        self._login('o@x.com', 'otherpass1')
        self.assertEqual(self.client.get(f'/api/bookings/{bid}/').status_code, 404)

    # ── admin ─────────────────────────────────────────────
    def test_admin_endpoints_forbidden_for_normal_user(self):
        self._login('u@x.com', 'userpass1')
        for url in ['/api/admin/stats/', '/api/admin/cars/', '/api/admin/bookings/',
                    '/api/admin/users/', '/api/admin/payments/']:
            self.assertEqual(self.client.get(url).status_code, 403, url)

    def test_admin_full_flow(self):
        # user makes a booking
        self._login('u@x.com', 'userpass1')
        bid = self.client.post('/api/bookings/', {'car_id': self.car.id, 'duration': 1}, format='json').data['id']
        self.client.credentials()

        self._login('admin@x.com', 'adminpass1', '/api/auth/admin-login/')
        stats = self.client.get('/api/admin/stats/').data
        self.assertEqual((stats['cars'], stats['bookings'], stats['users']), (2, 1, 2))

        # add car (multipart, like the real form)
        add = self.client.post('/api/admin/cars/', {
            'car_name': 'Axio', 'model': '2018', 'price': '4500', 'route': 'Dhaka → Sylhet',
            'availability': 'true', 'allow_custom_route': 'false'}, format='multipart')
        self.assertEqual(add.status_code, 201, add.content)
        cid = add.data['id']
        self.assertTrue(add.data['availability'])

        # toggle, change route, bad route, delete
        self.assertFalse(self.client.post(f'/api/admin/cars/{cid}/toggle/').data['availability'])
        ok = self.client.patch(f'/api/admin/cars/{cid}/', {'route': 'Dhaka → Khulna'}, format='json')
        self.assertEqual(ok.data['route'], 'Dhaka → Khulna')
        bad = self.client.patch(f'/api/admin/cars/{cid}/', {'route': 'Nowhere'}, format='json')
        self.assertEqual(bad.status_code, 400)
        self.assertEqual(self.client.delete(f'/api/admin/cars/{cid}/').status_code, 200)

        # booking actions
        self.assertEqual(self.client.post(f'/api/admin/bookings/{bid}/approve/').data['booking']['booking_status'], 'confirmed')
        self.assertEqual(self.client.post(f'/api/admin/bookings/{bid}/complete/').data['booking']['booking_status'], 'completed')
        self.assertEqual(self.client.post(f'/api/admin/bookings/{bid}/explode/').status_code, 400)
        self.assertEqual(len(self.client.get('/api/admin/bookings/').data), 1)

        # users + payments
        uid = self.user.id
        self.assertEqual(self.client.post(f'/api/admin/users/{uid}/toggle/').data['user']['account_status'], 'inactive')
        pays = self.client.get('/api/admin/payments/').data
        self.assertEqual(pays[0]['car_name'], 'NOAH')
