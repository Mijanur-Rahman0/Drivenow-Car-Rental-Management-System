from django.urls import path
from . import views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────
    path('auth/register/',    views.register,    name='api_register'),
    path('auth/login/',       views.login_view,  name='api_login'),
    path('auth/admin-login/', views.admin_login, name='api_admin_login'),
    path('auth/logout/',      views.logout_view, name='api_logout'),
    path('auth/me/',          views.me,          name='api_me'),

    # ── Public ────────────────────────────────────────────
    path('cars/',             views.car_list,    name='api_cars'),
    path('cars/<int:car_id>/', views.car_detail, name='api_car_detail'),
    path('routes/',           views.route_list,  name='api_routes'),

    # ── Logged-in user: bookings & payment ────────────────
    path('bookings/',                    views.bookings,        name='api_bookings'),
    path('bookings/<int:booking_id>/',   views.booking_detail,  name='api_booking_detail'),
    path('payments/process/',            views.process_payment, name='api_process_payment'),

    # ── Admin (superuser only) ────────────────────────────
    path('admin/stats/',                              views.admin_stats,          name='api_admin_stats'),
    path('admin/cars/',                               views.admin_cars,           name='api_admin_cars'),
    path('admin/cars/<int:car_id>/',                  views.admin_car_detail,     name='api_admin_car_detail'),
    path('admin/cars/<int:car_id>/toggle/',           views.admin_toggle_car,     name='api_admin_toggle_car'),
    path('admin/bookings/',                           views.admin_bookings,       name='api_admin_bookings'),
    path('admin/bookings/<int:booking_id>/<str:action>/', views.admin_booking_action, name='api_admin_booking_action'),
    path('admin/users/',                              views.admin_users,          name='api_admin_users'),
    path('admin/users/<int:user_id>/toggle/',         views.admin_user_toggle,    name='api_admin_user_toggle'),
    path('admin/payments/',                           views.admin_payments,       name='api_admin_payments'),
]
