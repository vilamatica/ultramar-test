from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import booking_list, create_booking, update_booking, delete_booking
from .views import vehicle_list, create_vehicle, update_vehicle, delete_vehicle

# router = DefaultRouter()
# router.register(r'bookings', BookingViewSet)

urlpatterns = [
    path('bookings/', booking_list, name="booking_list"),
    path('bookings/create/', create_booking, name='create_booking'),
    path('bookings/update/<int:pk>/', update_booking, name='update_booking'),
    path('bookings/delete/<int:pk>/', delete_booking, name='delete_booking'),
    
    path('vehicles/', vehicle_list, name="vehicle_list"),
    path('vehicles/create/', create_vehicle, name='create_vehicle'),
    path('vehicles/update/<int:pk>/', update_vehicle, name='update_vehicle'),
    path('vehicles/delete/<int:pk>/', delete_vehicle, name='delete_vehicle'),
]