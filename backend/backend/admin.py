from django.contrib import admin
from .models import UserProfile, Car, Booking, Payment


# ─────────────────────────────────────────────────────────────
# USER ADMIN
# ─────────────────────────────────────────────────────────────
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display  = ['name', 'email', 'account_status', 'is_staff', 'date_joined']
    list_filter   = ['account_status', 'is_staff']
    search_fields = ['name', 'email']
    ordering      = ['name']


# ─────────────────────────────────────────────────────────────
# CAR ADMIN
# ─────────────────────────────────────────────────────────────
@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display  = ['car_name', 'model', 'price', 'availability', 'route', 'allow_custom_route']
    list_filter   = ['availability', 'route', 'allow_custom_route']
    search_fields = ['car_name', 'model']
    ordering      = ['car_name']


# ─────────────────────────────────────────────────────────────
# BOOKING ADMIN
# ─────────────────────────────────────────────────────────────
@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ['user', 'car', 'booking_status', 'final_route', 'duration', 'booking_date']
    list_filter   = ['booking_status', 'car__route']  # Filter by car route
    search_fields = ['user__name', 'car__car_name']
    ordering      = ['-booking_date']


# ─────────────────────────────────────────────────────────────
# PAYMENT ADMIN
# ─────────────────────────────────────────────────────────────
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ['booking', 'amount', 'payment_status', 'transaction_time']
    list_filter   = ['payment_status']
    search_fields = ['booking__user__name', 'booking__car__car_name']
    ordering      = ['-transaction_time']