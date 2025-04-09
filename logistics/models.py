from django.db import models
from django.utils.timezone import now

class Booking(models.Model):
    booking_number = models.CharField(max_length=50, unique=True)
    loading_port = models.CharField(max_length=100)
    discharge_port = models.CharField(max_length=100)
    ship_arrival_date = models.DateField(default=now)
    ship_departure_date = models.DateField(default=now)

    def __str__(self):
        return f"Booking {self.booking_number}"

class Vehicle(models.Model):
    vin = models.CharField(max_length=17, unique=True)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    weight = models.FloatField()
    booking_id = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.make} {self.model} ({self.vin})"
