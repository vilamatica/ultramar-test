from django.contrib import admin
from .models import Booking, Vehicle

class VehicleInline(admin.TabularInline):
    model = Vehicle
    extra = 3


class BookingAdmin(admin.ModelAdmin):
    inlines = [VehicleInline]


admin.site.register(Booking, BookingAdmin)