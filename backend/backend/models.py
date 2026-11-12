"""
models.py — Car Rental Application (Enhanced)
Now supports:
✅ Car-based routes
✅ Optional custom route in booking
✅ Full OOP structure محفوظ
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


# ─────────────────────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────────────────────

class UserProfileManager(BaseUserManager):
    def create_user(self, email, name, password=None):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password):
        user = self.create_user(email, name, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class UserProfile(AbstractBaseUser, PermissionsMixin):

    ACCOUNT_STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]

    name           = models.CharField(max_length=120)
    email          = models.EmailField(unique=True)
    account_status = models.CharField(
        max_length=10,
        choices=ACCOUNT_STATUS_CHOICES,
        default='active',
    )
    is_staff       = models.BooleanField(default=False)
    date_joined    = models.DateTimeField(default=timezone.now)

    objects = UserProfileManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return f"{self.name} <{self.email}>"

    @property
    def is_active_account(self):
        return self.account_status == 'active'


# ─────────────────────────────────────────────────────────────
# CAR (UPDATED WITH ROUTE)
# ─────────────────────────────────────────────────────────────

class Car(models.Model):

    ROUTE_CHOICES = [
        ('Dhaka → Chittagong', 'Dhaka → Chittagong'),
        ('Dhaka → Noakhali',   'Dhaka → Noakhali'),
        ('Dhaka → Sylhet',     'Dhaka → Sylhet'),
        ('Dhaka → Khulna',     'Dhaka → Khulna'),
    ]

    car_name     = models.CharField(max_length=100)
    model        = models.CharField(max_length=100)
    price        = models.DecimalField(max_digits=10, decimal_places=2)
    availability = models.BooleanField(default=True)
    description  = models.TextField(blank=True)
    image_path = models.ImageField(upload_to='cars/', blank=True, null=True)

    # ✅ NEW ROUTE SYSTEM
    route = models.CharField(
        max_length=50,
        choices=ROUTE_CHOICES,
        blank=True,
        null=True
    )

    allow_custom_route = models.BooleanField(
        default=False,
        help_text="Allow user to enter custom route"
    )

    def __str__(self):
        status = "Available" if self.availability else "Booked"
        route  = self.route if self.route else "Custom Route"
        return f"{self.car_name} ({self.model}) — {route} — {status}"

    def save(self, *args, **kwargs):
        if self.price is not None:
            from decimal import Decimal
            self.price = Decimal(str(self.price))
        super().save(*args, **kwargs)

    def mark_booked(self):
        self.availability = False
        self.save()

    def mark_available(self):
        self.availability = True
        self.save()


# ─────────────────────────────────────────────────────────────
# BOOKING (UPDATED ROUTE LOGIC)
# ─────────────────────────────────────────────────────────────

class Booking(models.Model):

    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='bookings',
    )

    # ✅ KEEP CUSTOM ROUTE (optional override)
    custom_route = models.CharField(
        max_length=150,
        blank=True,
        null=True
    )

    duration       = models.PositiveIntegerField(default=1)
    booking_status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='pending',
    )
    booking_date = models.DateTimeField(default=timezone.now)
    pickup_time  = models.DateTimeField(null=True, blank=True)   # car নেওয়ার সময়
    return_time  = models.DateTimeField(null=True, blank=True)   # car ফেরত দেওয়ার সময়

    class Meta:
        ordering = ['-booking_date']

    def __str__(self):
        return f"Booking #{self.pk} — {self.user.name} | {self.car.car_name} | {self.final_route}"

    # ✅ FINAL ROUTE DECISION
    @property
    def final_route(self):
        if self.custom_route:
            return self.custom_route
        return self.car.route if self.car.route else "Not specified"

    @property
    def total_cost(self):
        from decimal import Decimal
        price = self.car.price
        # MongoDB stores Decimal as bson.Decimal128 — cast it safely
        if not isinstance(price, Decimal):
            price = Decimal(str(price))
        return float(price) * self.duration

    def confirm(self):
        """Booking confirm হলে pickup_time record করা হয়।"""
        self.booking_status = 'confirmed'
        self.pickup_time = timezone.now()
        self.save()

    def cancel(self):
        self.booking_status = 'cancelled'
        self.car.mark_available()
        self.save()

    def complete(self):
        """Car ফেরত দিলে return_time record করা হয়।"""
        self.booking_status = 'completed'
        self.return_time = timezone.now()
        self.car.mark_available()
        self.save()


# ─────────────────────────────────────────────────────────────
# PAYMENT
# ─────────────────────────────────────────────────────────────

class Payment(models.Model):

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed',  'Failed'),
    ]

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='payment',
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending',
    )

    transaction_time = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Payment #{self.pk} — {self.payment_status} — BDT {self.amount}"

    # ✅ AUTO SET AMOUNT
    def save(self, *args, **kwargs):
        if not self.amount and self.booking_id:
            self.amount = self.booking.total_cost
        if self.amount is not None:
            from decimal import Decimal
            self.amount = Decimal(str(self.amount))
        super().save(*args, **kwargs)

    def mark_success(self):
        self.payment_status = 'success'
        self.save()
        self.booking.confirm()
        self.booking.car.mark_booked()

    def mark_failed(self):
        self.payment_status = 'failed'
        self.save()
        self.booking.cancel()