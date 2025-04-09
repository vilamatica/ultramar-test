from django.shortcuts import render
from .models import Booking, Vehicle
from .serializers import BookingSerializer, VehicleSerializer
from rest_framework import generics, filters, views, status
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from .forms import BookingForm, VehicleForm, UploadFileForm
from django.core.paginator import Paginator
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
import xlwt
from reportlab.pdfgen import canvas
from openpyxl.utils.exceptions import InvalidFileException
import openpyxl
from zipfile import BadZipFile

class BookingListCreate(generics.ListCreateAPIView):
  queryset = Booking.objects.all()
  serializer_class = BookingSerializer
  filter_backends = [filters.SearchFilter]
  search_fields = ['booking_number']
  
class BookingRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    lookup_field = 'pk'
  
# Get the bookling list
@api_view(['GET'])
@permission_classes([AllowAny])
def booking_list(request):
    query = request.GET.get('search', '')
    sort = request.GET.get('sort', 'id')  # default sort
    order = request.GET.get('order', 'asc')
    page = int(request.GET.get('page', 1))
    per_page = 5

    sort_prefix = '' if order == 'asc' else '-'
    bookings = Booking.objects.filter(booking_number__icontains=str(query)).order_by(f'{sort_prefix}{sort}') if query else Booking.objects.all()

    paginator = Paginator(bookings, per_page)
    page_obj = paginator.get_page(page)
    
    serializer = BookingSerializer(page_obj.object_list, many=True)
    
    context = {
        "query": query,
        'results': serializer.data,
        'total': paginator.count,
        'page_range': range(paginator.num_pages),
        'pages': paginator.num_pages,
        'current_page': page,
    }
    return render(request, "bookings/bookings_list.html", context)
  
# Create a booking
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_booking(request):
    form = BookingForm(request.POST)
    if form.is_valid():
        booking = form.save()
        return JsonResponse({'id': booking.id, 'booking_number': booking.booking_number, 'loading_port': booking.loading_port, 'discharge_port': booking.discharge_port, 'ship_arrival_date': booking.ship_departure_date, 'ship_arrival_date': booking.ship_departure_date})
    return JsonResponse({'error': 'Invalid data'}, status=400)

# Update a booking
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    form = BookingForm(request.POST, instance=booking)
    if form.is_valid():
        booking = form.save()
        return JsonResponse({'id': booking.id, 'booking_number': booking.booking_number, 'loading_port': booking.loading_port, 'discharge_port': booking.discharge_port, 'ship_arrival_date': booking.ship_departure_date, 'ship_arrival_date': booking.ship_departure_date})
    return JsonResponse({'error': 'Invalid data'}, status=400)

# Delete a booking
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    booking.delete()
    return JsonResponse({'success': True})
 
class ExportBookingsXLS(views.APIView):
    permission_classes = [IsAuthenticated]
    # Export bookings to XLS
    def get(self, request):
        query = request.GET.get('search', '')
        bookings = Booking.objects.filter(booking_number__icontains=str(query)).values()

        response = HttpResponse(content_type='application/ms-excel')
        response['Content-Disposition'] = 'attachment; filename="bookings.xlsx"'

        wb = xlwt.Workbook(encoding='utf-8')
        ws = wb.add_sheet('Bookings')

        # Header
        row_num = 0
        columns = ['Booking Number', 'Loading Port', 'Discharge Port', 'Ship Arrival Date', 'Ship Departure Date']

        for col_num, col_title in enumerate(columns):
            ws.write(row_num, col_num, col_title)

        # Data rows
        for booking in bookings:
            print(booking)
            row_num += 1
            ws.write(row_num, 0, booking.get('booking_number'))
            ws.write(row_num, 1, booking.get('loading_port'))
            ws.write(row_num, 2, booking.get('discharge_port'))
            ws.write(row_num, 3, booking.get('ship_arrival_date'))
            ws.write(row_num, 4, booking.get('ship_departure_date'))

        wb.save(response)
        return response
      
class ExportBookingsPDF(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
      query = request.GET.get('q', '')
      bookings = Booking.objects.filter(booking_number__icontains=str(query)).values()

      response = HttpResponse(content_type='application/pdf')
      response['Content-Disposition'] = 'attachment; filename="bookings.pdf"'

      p = canvas.Canvas(response)
      y = 800
      p.drawString(50, y, 'Booking List')
      y -= 30

      for booking in bookings:
          line = f"{booking.get('booking_number')}   |   {booking.get('loading_port')}   |   {booking.get('discharge_port')}   |   ({booking.get('ship_arrival_date')})   |   ({booking.get('ship_departure_date')})"
          p.drawString(50, y, line)
          y -= 20
          if y < 50:
              p.showPage()
              y = 800

      p.showPage()
      p.save()
      return response
    
class ImportBookingsXLS(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        file = request.FILES.get('file')

        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.endswith('.xlsx'):
            return Response({'error': 'Only .xlsx files are supported'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wb = openpyxl.load_workbook(file)
            ws = wb.active

            for row in ws.iter_rows(min_row=2):
                vin = row[0].value
                make = row[1].value
                model = row[2].value
                weight = row[3].value

                if vin:  # You can also add other required field checks here
                    Booking.objects.create(
                        vin=vin,
                        make=make,
                        model=model,
                        weight=weight,
                    )

            return Response({'success': True})

        except (BadZipFile, InvalidFileException):
            return Response({'error': 'Uploaded file is not a valid .xlsx file'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# VEHICLE VIEWS ---------------------------------------------------------------------------------
class VehicleListCreate(generics.ListCreateAPIView):
  queryset = Vehicle.objects.all()
  serializer_class = VehicleSerializer
  filter_backends = [filters.SearchFilter]
  search_fields = ['vin']
  
class VehicleRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    lookup_field = 'pk'

@api_view(['GET'])
@permission_classes([AllowAny])
def vehicle_list(request):
    bookings = Booking.objects.all()
    query = request.GET.get('search', '')
    sort = request.GET.get('sort', 'id')  # default sort
    order = request.GET.get('order', 'asc')
    page = int(request.GET.get('page', 1))
    per_page = 5

    sort_prefix = '' if order == 'asc' else '-'
    vehicles = Vehicle.objects.filter(vin__icontains=str(query)).order_by(f'{sort_prefix}{sort}') if query else Vehicle.objects.all()

    paginator = Paginator(vehicles, per_page)
    page_obj = paginator.get_page(page)
    
    serializer = VehicleSerializer(page_obj.object_list, many=True)
    
    context = {
        "query": query,
        'results': serializer.data,
        'total': paginator.count,
        'page_range': range(paginator.num_pages),
        'pages': paginator.num_pages,
        'current_page': page,
        'bookings': bookings
    }
    return render(request, "vehicles/vehicles_list.html", context)
  
# Create a vehicle
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_vehicle(request):
    form = VehicleForm(request.POST)
    if form.is_valid():
        vehicle = form.save()
        return JsonResponse({'id': vehicle.id, 'vin': vehicle.vin, 'make': vehicle.make, 'model': vehicle.model, 'weight': vehicle.weight, 'booking_id': vehicle.booking})
    return JsonResponse({'error': 'Invalid data'}, status=400)

# Update a vehicle
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_vehicle(request, pk):
    vehicle = get_object_or_404(Vehicle, pk=pk)
    form = VehicleForm(request.POST, instance=vehicle)
    if form.is_valid():
        vehicle.save()
        return JsonResponse({'id': vehicle.id, 'vin': vehicle.vin, 'make': vehicle.make, 'model': vehicle.model, 'weight': vehicle.weight, 'booking_id': vehicle.booking})
    return JsonResponse({'error': 'Invalid data'}, status=400)

# Delete a vehicle
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_vehicle(request, pk):
    vehicle = get_object_or_404(Vehicle, pk=pk)
    vehicle.delete()
    return JsonResponse({'success': True})
 
class ExportVehiclesXLS(views.APIView):
    permission_classes = [IsAuthenticated]
    # Export vehicles to XLS
    def get(self, request):
        query = request.GET.get('search', '')
        vehicles = Vehicle.objects.filter(vin__icontains=str(query)).values()

        response = HttpResponse(content_type='application/ms-excel')
        response['Content-Disposition'] = 'attachment; filename="vehicles.xlsx"'

        wb = xlwt.Workbook(encoding='utf-8')
        ws = wb.add_sheet('Vehicles')

        # Header
        row_num = 0
        columns = ['VIN', 'Make', 'Model', 'Weight', 'Booking']

        for col_num, col_title in enumerate(columns):
            ws.write(row_num, col_num, col_title)

        # Data rows
        for vehicle in vehicles:
            print(vehicle)
            row_num += 1
            ws.write(row_num, 0, vehicle.get('vin'))
            ws.write(row_num, 1, vehicle.get('make'))
            ws.write(row_num, 2, vehicle.get('model'))
            ws.write(row_num, 3, vehicle.get('weight'))
            # ws.write(row_num, 4, vehicle.booking.booking_number)

        wb.save(response)
        return response
      
class ExportVehiclesPDF(views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
      query = request.GET.get('q', '')
      vehicles = Vehicle.objects.filter(vin__icontains=str(query)).values()

      response = HttpResponse(content_type='application/pdf')
      response['Content-Disposition'] = 'attachment; filename="vehicles.pdf"'

      p = canvas.Canvas(response)
      y = 800
      p.drawString(50, y, 'Vehicle List')
      y -= 30

      for vehicle in vehicles:
          line = f"{vehicle.get('vin')}   |   {vehicle.get('make')}   |   {vehicle.get('model')}   |   ({vehicle.get('weight')})"
          p.drawString(50, y, line)
          y -= 20
          if y < 50:
              p.showPage()
              y = 800

      p.showPage()
      p.save()
      return response
 
class ImportVehiclesXLS(views.APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        file = request.FILES.get('file')

        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.endswith('.xlsx'):
            return Response({'error': 'Only .xlsx files are supported'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wb = openpyxl.load_workbook(file)
            ws = wb.active

            for row in ws.iter_rows(min_row=2):
                vin = row[0].value
                make = row[1].value
                model = row[2].value
                weight = row[3].value

                if vin:  # You can also add other required field checks here
                    Vehicle.objects.create(
                        vin=vin,
                        make=make,
                        model=model,
                        weight=weight,
                    )

            return Response({'success': True})

        except (BadZipFile, InvalidFileException):
            return Response({'error': 'Uploaded file is not a valid .xlsx file'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)