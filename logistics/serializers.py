from rest_framework import serializers
from .models import Booking, Vehicle

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = "__all__"


class VehicleSerializer(serializers.ModelSerializer):
    # This will return the full Booking object
    booking = BookingSerializer(read_only=True, source="booking_id")
    
    class Meta:
        model = Vehicle
        fields = "__all__"
