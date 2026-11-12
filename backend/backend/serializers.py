"""
serializers.py — Django REST Framework serializers
Converts model instances <-> JSON for every API endpoint.
"""

import os
from decimal import Decimal

from django.core.files.storage import default_storage
from rest_framework import serializers

from .models import UserProfile, Car, Booking, Payment


def _safe_decimal(value):
    """Convert bson.Decimal128 or any value to Python float safely."""
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(str(value))
    except (TypeError, ValueError):
        return 0.0


# ─────────────────────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────────────────────
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'name', 'email', 'account_status', 'is_superuser', 'date_joined']
        read_only_fields = fields


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'name', 'email']
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()      # plain field: uniqueness is checked in validate_email
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = UserProfile
        fields = ['name', 'email', 'password', 'password2']

    def validate_email(self, value):
        value = value.strip()
        if UserProfile.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already exists.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError('Passwords do not match.')
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        return UserProfile.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'].strip(),
            password=validated_data['password'],
        )


# ─────────────────────────────────────────────────────────────
# CAR
# ─────────────────────────────────────────────────────────────
class CarSerializer(serializers.ModelSerializer):
    # write: upload a file with the multipart field "image_path"
    image_path = serializers.ImageField(required=False, allow_null=True, write_only=True)
    # read: absolute URL of the uploaded image (null if there is no file on disk)
    image_url = serializers.SerializerMethodField()
    # read: original file name stored in the DB (e.g. "car1.png")
    image_name = serializers.SerializerMethodField()
    # Safe price — handles bson.Decimal128 from MongoDB
    price = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = [
            'id', 'car_name', 'model', 'price', 'availability', 'description',
            'route', 'allow_custom_route', 'image_path', 'image_url', 'image_name',
        ]

    def get_price(self, obj):
        return _safe_decimal(obj.price)

    def get_image_url(self, obj):
        f = obj.image_path
        if not f or not default_storage.exists(f.name):
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(f.url) if request else f.url

    def get_image_name(self, obj):
        return os.path.basename(obj.image_path.name) if obj.image_path else None

    def validate_route(self, value):
        return value or None          # '' -> None (same as the original admin form)


# ─────────────────────────────────────────────────────────────
# PAYMENT
# ─────────────────────────────────────────────────────────────
class PaymentSerializer(serializers.ModelSerializer):
    amount = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'booking', 'amount', 'payment_status', 'transaction_time']
        read_only_fields = fields

    def get_amount(self, obj):
        return _safe_decimal(obj.amount)


class AdminPaymentSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    user_name = serializers.CharField(source='booking.user.name', read_only=True)
    car_name = serializers.CharField(source='booking.car.car_name', read_only=True)
    amount = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ['id', 'booking_id', 'user_name', 'car_name',
                  'amount', 'payment_status', 'transaction_time']
        read_only_fields = fields

    def get_amount(self, obj):
        return _safe_decimal(obj.amount)


# ─────────────────────────────────────────────────────────────
# BOOKING
# ─────────────────────────────────────────────────────────────
class BookingSerializer(serializers.ModelSerializer):
    user = UserBriefSerializer(read_only=True)
    car = CarSerializer(read_only=True)
    payment = serializers.SerializerMethodField()
    final_route = serializers.CharField(read_only=True)
    total_cost = serializers.FloatField(read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'car', 'custom_route', 'final_route', 'duration',
            'booking_status', 'booking_date', 'pickup_time', 'return_time',
            'total_cost', 'payment',
        ]
        read_only_fields = fields

    def get_payment(self, obj):
        payment = getattr(obj, 'payment', None)
        return PaymentSerializer(payment).data if payment else None


class BookingCreateSerializer(serializers.Serializer):
    car_id = serializers.IntegerField()
    duration = serializers.IntegerField(min_value=1, max_value=365, default=1)
    custom_route = serializers.CharField(max_length=150, required=False,
                                         allow_blank=True, allow_null=True)
