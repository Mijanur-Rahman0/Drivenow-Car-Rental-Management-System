"""
views.py — DriveNow Car Rental  (REST API only, JSON in / JSON out)

All HTML pages now live in the separate frontend project.
Authentication: DRF Token  ->  header  "Authorization: Token <key>"

Error format (every endpoint):  { "detail": "human readable message" }
"""

from django.contrib.auth import authenticate
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response

from .models import Booking, Car, Payment, UserProfile
from .serializers import (
    AdminPaymentSerializer, BookingCreateSerializer, BookingSerializer,
    CarSerializer, RegisterSerializer, UserSerializer,
)


# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────

def _error(message, code=status.HTTP_400_BAD_REQUEST):
    return Response({'detail': message}, status=code)


def _first_error(errors):
    """Turn DRF's {'field': ['msg']} into one readable sentence."""
    for field, msgs in errors.items():
        msg = str(msgs[0] if isinstance(msgs, (list, tuple)) else msgs)
        if field == 'non_field_errors':
            return msg
        label = field.replace('_', ' ').capitalize()
        if 'this field' in msg.lower():
            msg = msg.replace('This field', label).replace('this field', label.lower())
        return msg
    return 'Invalid data.'


class IsSuperUser(BasePermission):
    """Admin panel access (same rule as the old `admin_required` decorator)."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_superuser)


def _login_response(user):
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'user': UserSerializer(user).data})


# ─────────────────────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """POST {name, email, password, password2}"""
    ser = RegisterSerializer(data=request.data)
    if not ser.is_valid():
        return _error(_first_error(ser.errors))
    user = ser.save()
    return Response(
        {'detail': 'Account created! Please log in.', 'user': UserSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """POST {email, password}  ->  {token, user}   (superusers may use this too)"""
    email = str(request.data.get('email', '')).strip()
    password = request.data.get('password', '')
    user = authenticate(request, email=email, password=password)
    if not user:
        return _error('Invalid user credentials.', status.HTTP_401_UNAUTHORIZED)
    if user.account_status == 'inactive':
        return _error('Your account is deactivated.', status.HTTP_403_FORBIDDEN)
    return _login_response(user)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    """POST {email, password}  ->  {token, user}   (superuser only)"""
    email = str(request.data.get('email', '')).strip()
    password = request.data.get('password', '')
    user = authenticate(request, email=email, password=password)
    if not user or not user.is_superuser:
        return _error('Invalid superuser credentials.', status.HTTP_401_UNAUTHORIZED)
    return _login_response(user)


@api_view(['POST'])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response({'detail': 'Logged out.'})


@api_view(['GET'])
def me(request):
    return Response(UserSerializer(request.user).data)


# ─────────────────────────────────────────────────────────────
# PUBLIC: CARS & ROUTES
# ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def car_list(request):
    cars = Car.objects.all().order_by('id')
    return Response(CarSerializer(cars, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def car_detail(request, car_id):
    car = get_object_or_404(Car, id=car_id)
    return Response(CarSerializer(car, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def route_list(request):
    """Route choices + how many cars run each route (used by the landing page)."""
    # Count cars per route from database
    raw_counts = dict(
        Car.objects.exclude(route__isnull=True).exclude(route__exact='')
        .values_list('route')
        .annotate(n=Count('id'))
        .values_list('route', 'n')
    )

    def normalize(val):
        return val.replace('->', '→').strip() if val else ''

    # Normalize counts mapping so both "->" and "→" map properly
    counts = {}
    for r_val, count in raw_counts.items():
        norm = normalize(r_val)
        counts[norm] = counts.get(norm, 0) + count

    # Collect known predefined routes
    seen_routes = set()
    result = []
    for value, label in Car.ROUTE_CHOICES:
        norm = normalize(value)
        seen_routes.add(norm)
        result.append({
            'value': value,
            'label': label,
            'car_count': counts.get(norm, 0)
        })

    # Also include any actual routes from DB not in predefined choices (e.g. Cox's Bazar, Rajshahi, Barisal)
    for r_val, count in raw_counts.items():
        norm = normalize(r_val)
        if norm and norm not in seen_routes:
            seen_routes.add(norm)
            result.append({
                'value': norm,
                'label': norm,
                'car_count': count
            })

    return Response(result)


# ─────────────────────────────────────────────────────────────
# LOGGED-IN USER: BOOKINGS & PAYMENT
# ─────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
def bookings(request):
    """
    GET  -> my bookings (newest first)
    POST -> {car_id, duration, custom_route?}  creates booking + pending payment
    """
    ctx = {'request': request}

    if request.method == 'GET':
        qs = Booking.objects.filter(user=request.user).select_related('car', 'payment')
        return Response(BookingSerializer(qs, many=True, context=ctx).data)

    ser = BookingCreateSerializer(data=request.data)
    if not ser.is_valid():
        return _error(_first_error(ser.errors))
    data = ser.validated_data

    car = get_object_or_404(Car, id=data['car_id'])
    if not car.availability:
        return _error('Car not available.')

    custom_route = (data.get('custom_route') or '').strip()
    if car.allow_custom_route and not custom_route:
        return _error('Please enter your route.')

    booking = Booking.objects.create(
        user=request.user,
        car=car,
        custom_route=custom_route if car.allow_custom_route else None,
        duration=data['duration'],
    )
    Payment.objects.create(booking=booking, amount=booking.total_cost)

    booking = Booking.objects.select_related('car', 'payment').get(pk=booking.pk)
    return Response(BookingSerializer(booking, context=ctx).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def booking_detail(request, booking_id):
    booking = get_object_or_404(
        Booking.objects.select_related('car', 'payment'), id=booking_id, user=request.user
    )
    return Response(BookingSerializer(booking, context={'request': request}).data)


@api_view(['POST'])
def process_payment(request):
    """POST {booking_id, action: 'success' | 'fail'}   (simulated payment)"""
    booking = get_object_or_404(Booking, id=request.data.get('booking_id'), user=request.user)
    payment = get_object_or_404(Payment, booking=booking)

    if payment.payment_status != 'pending':
        return _error('This payment has already been processed.')

    if request.data.get('action', 'success') == 'success':
        payment.mark_success()
        message = 'Payment successful!'
    else:
        payment.mark_failed()
        message = 'Payment failed.'

    booking = Booking.objects.select_related('car', 'payment').get(pk=booking.pk)
    return Response({
        'detail': message,
        'booking': BookingSerializer(booking, context={'request': request}).data,
    })


# ─────────────────────────────────────────────────────────────
# ADMIN  (superuser only)
# ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsSuperUser])
def admin_stats(request):
    return Response({
        'cars': Car.objects.count(),
        'bookings': Booking.objects.count(),
        'users': UserProfile.objects.count(),
        'payments': Payment.objects.count(),
    })


# ── cars ──────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsSuperUser])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def admin_cars(request):
    """GET list | POST create (multipart/form-data, image field = image_path)"""
    ctx = {'request': request}
    if request.method == 'GET':
        return Response(CarSerializer(Car.objects.all().order_by('id'), many=True, context=ctx).data)

    ser = CarSerializer(data=request.data, context=ctx)
    if not ser.is_valid():
        return _error(_first_error(ser.errors))
    car = ser.save()
    return Response(CarSerializer(car, context=ctx).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsSuperUser])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def admin_car_detail(request, car_id):
    """PATCH update any car field (e.g. {route}) | DELETE remove the car"""
    car = get_object_or_404(Car, id=car_id)
    ctx = {'request': request}

    if request.method == 'DELETE':
        name = car.car_name
        car.delete()
        return Response({'detail': f'Car "{name}" deleted.'})

    ser = CarSerializer(car, data=request.data, partial=True, context=ctx)
    if not ser.is_valid():
        return _error(_first_error(ser.errors))
    car = ser.save()
    return Response(CarSerializer(car, context=ctx).data)


@api_view(['POST'])
@permission_classes([IsSuperUser])
def admin_toggle_car(request, car_id):
    car = get_object_or_404(Car, id=car_id)
    car.availability = not car.availability
    car.save()
    return Response(CarSerializer(car, context={'request': request}).data)


# ── bookings ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsSuperUser])
def admin_bookings(request):
    qs = Booking.objects.select_related('user', 'car', 'payment')
    return Response(BookingSerializer(qs, many=True, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([IsSuperUser])
def admin_booking_action(request, booking_id, action):
    """action = approve | cancel | complete"""
    booking = get_object_or_404(Booking, id=booking_id)
    if action == 'approve':
        booking.confirm()
        message = f'Booking #{booking.id} confirmed.'
    elif action == 'cancel':
        booking.cancel()
        message = f'Booking #{booking.id} cancelled.'
    elif action == 'complete':
        booking.complete()
        message = f'Booking #{booking.id} completed.'
    else:
        return _error('Invalid action.')
    booking = Booking.objects.select_related('user', 'car', 'payment').get(pk=booking.pk)
    return Response({'detail': message,
                     'booking': BookingSerializer(booking, context={'request': request}).data})


# ── users ─────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsSuperUser])
def admin_users(request):
    return Response(UserSerializer(UserProfile.objects.all().order_by('id'), many=True).data)


@api_view(['POST'])
@permission_classes([IsSuperUser])
def admin_user_toggle(request, user_id):
    user = get_object_or_404(UserProfile, id=user_id)
    if user.account_status == 'active':
        user.account_status = 'inactive'
        message = f'User "{user.name}" deactivated.'
    else:
        user.account_status = 'active'
        message = f'User "{user.name}" activated.'
    user.save()
    return Response({'detail': message, 'user': UserSerializer(user).data})


# ── payments ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsSuperUser])
def admin_payments(request):
    qs = Payment.objects.select_related('booking', 'booking__user', 'booking__car') \
                        .order_by('-transaction_time')
    return Response(AdminPaymentSerializer(qs, many=True).data)
