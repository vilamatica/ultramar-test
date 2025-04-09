from django.contrib import admin
from django.conf.urls.static import static
from django.conf import settings
from django.urls import path, include
from .views import HomeView
from logistics.views import BookingListCreate, BookingRetrieveUpdateDestroy, ExportBookingsXLS, ExportBookingsPDF, ImportBookingsXLS
from logistics.views import VehicleListCreate, VehicleRetrieveUpdateDestroy, ExportVehiclesXLS, ExportVehiclesPDF, ImportVehiclesXLS

urlpatterns = [
    path('admin/', admin.site.urls),
    path("", HomeView.as_view(), name="HomeView"),
    path('logistics/', include('logistics.urls'), name='logistics'),
    
    path('api/bookings/', BookingListCreate.as_view(), name='booking-list-create'),
    path('api/bookings/<int:pk>/', BookingRetrieveUpdateDestroy.as_view(), name='booking-update'),
    path('api/bookings/export-xls/', ExportBookingsXLS.as_view(), name='export_bookings_xls'),
    path('api/bookings/export-pdf/', ExportBookingsPDF.as_view(), name='export_bookings_pdf'),
    path('api/bookings/import-xls/', ImportBookingsXLS.as_view(), name='import_bookings_xls'),
    
    path('api/vehicles/', VehicleListCreate.as_view(), name='vehicle-list-create'),
    path('api/vehicles/<int:pk>/', VehicleRetrieveUpdateDestroy.as_view(), name='vehicle-update'),
    path('api/vehicles/export-xls/', ExportVehiclesXLS.as_view(), name='export_vehicles_xls'),
    path('api/vehicles/export-pdf/', ExportVehiclesPDF.as_view(), name='export_vehicles_pdf'),
    path('api/vehicles/import-xls/', ImportVehiclesXLS.as_view(), name='import_vehicles_xls'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
 

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)    
    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar

        urlpatterns = [path("__debug__/", include(debug_toolbar.urls))] + urlpatterns
