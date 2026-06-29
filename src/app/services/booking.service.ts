import { Injectable } from '@angular/core';
import { Observable, map, of, catchError, throwError, switchMap } from 'rxjs';
import { AirtableService, AirtableRecord } from './airtable.service';
import {
  BookingFields,
  AvailableSlotFields,
  BookingRequest,
  CustomerDetails,
  DateRange,
} from '../models/booking.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  constructor(private airtable: AirtableService) {}

  getAvailableSlots(): Observable<AvailableSlotFields[]> {
    return this.airtable
      .getRecords<AvailableSlotFields>(
        environment.airtable.tableNames.availableSlots
      )
      .pipe(
        map((records) => records.map((record) => record.fields)),
        catchError((error) => {
          console.error('Error fetching available slots:', error);
          return of([]);
        })
      );
  }

  getAvailableSlotsWithIds(): Observable<
    AirtableRecord<AvailableSlotFields>[]
  > {
    return this.airtable
      .getRecords<AvailableSlotFields>(
        environment.airtable.tableNames.availableSlots
      )
      .pipe(
        map((records) => {
          return records.map(record => ({
            ...record,
            fields: {
              ...record.fields,
              // Clean up text fields
              hero_badge_text: typeof record.fields.hero_badge_text === 'string' ? 
                record.fields.hero_badge_text.trim() : record.fields.hero_badge_text,
              tour_description: typeof record.fields.tour_description === 'string' ? 
                record.fields.tour_description.trim() : record.fields.tour_description,
              // Parse JSON fields
              itinerary: this.parseJsonField(record.fields.itinerary),
              included_items: this.parseJsonField(record.fields.included_items)
            }
          }));
        }),
        catchError((error) => {
          console.error('Error fetching available slots:', error);
          return of([]);
        })
      );
  }

  createBooking(bookingRequest: BookingRequest): Observable<any> {
    if (!bookingRequest.selectedSlotId) {
      return throwError(() => new Error('No slot selected for booking'));
    }

    // First create the booking record
    const bookingFields: BookingFields = {
      'Customer Name': bookingRequest.customerDetails.name,
      Email: bookingRequest.customerDetails.email,
      Phone: bookingRequest.customerDetails.phone,
      'Emergency Contact': bookingRequest.customerDetails.emergencyContact,
      Status: 'Pending',
      'Total Amount': bookingRequest.totalAmount,
      'Deposit Amount': bookingRequest.depositAmount,
      'Deposit Paid': false,
      'Medical Conditions':
        bookingRequest.customerDetails.medicalConditions || '',
      available_slot_id: bookingRequest.selectedSlotId,
      Notes:'test note'
    };

    console.log(bookingFields);

    return this.airtable
      .createRecord<BookingFields>(
        environment.airtable.tableNames.bookings,
        bookingFields
      )
      .pipe(
        switchMap((bookingRecord) => {
          // After creating booking, update the available slot's current bookings count
          return this.getAvailableSlotsWithIds().pipe(
            map((slots) => {
              const selectedSlot = slots.find(
                (slot) => slot.id === bookingRequest.selectedSlotId
              );
              if (!selectedSlot) {
                throw new Error('Selected slot not found');
              }
              return selectedSlot;
            }),
            switchMap((selectedSlot) => {
              const updatedSlotFields = {
                'Current Bookings': selectedSlot.fields['Current Bookings'] + 1,
              };

              return this.airtable
                .updateRecord<AvailableSlotFields>(
                  environment.airtable.tableNames.availableSlots,
                  bookingRequest.selectedSlotId!,
                  updatedSlotFields
                )
                .pipe(
                  map(() => bookingRecord) // Return the original booking record
                );
            })
          );
        }),
        catchError((error) => {
          console.error('Error creating booking:', error);
          return throwError(() => error);
        })
      );
  }

  getCustomerBookings(email: string): Observable<BookingFields[]> {
    const filterFormula = `{Email} = '${email}'`;

    const params: any = {
      filterByFormula: filterFormula
    };

    // Add sort parameters in the format Airtable expects
    params['sort[0][field]'] = 'Booking Created Time';
    params['sort[0][direction]'] = 'desc';

    return this.airtable
      .getRecords<BookingFields>(environment.airtable.tableNames.bookings, params)
      .pipe(
        map((records) => records.map((record) => record.fields)),
        catchError((error) => {
          console.error('Error fetching customer bookings:', error);
          return of([]);
        })
      );
  }

  isDateRangeAvailable(startDate: Date, endDate: Date): Observable<boolean> {
    return this.getAvailableSlots().pipe(
      map((slots) => {
        return slots.some((slot) => {
          const slotStart = new Date(slot['Start Date']);
          const slotEnd = new Date(slot['End Date']);
          const maxBookings = slot['Max Bookings'] || 999; // Default to high number if not set
          return (
            startDate >= slotStart &&
            endDate <= slotEnd &&
            slot.Available &&
            slot['Current Bookings'] < maxBookings
          );
        });
      })
    );
  }

  private getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  getUpcomingAvailableDates(daysAhead: number = 30): Observable<DateRange[]> {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + daysAhead);

    return this.getAvailableSlots().pipe(
      map((slots) => {
        return slots
          .filter((slot) => {
            const slotStart = new Date(slot['Start Date']);
            const slotEnd = new Date(slot['End Date']);
            const maxBookings = slot['Max Bookings'] || 999; // Default to high number if not set
            return (
              slot.Available &&
              slot['Current Bookings'] < maxBookings &&
              slotEnd >= today &&
              slotStart <= endDate
            );
          })
          .map((slot) => ({
            startDate: new Date(slot['Start Date']),
            endDate: new Date(slot['End Date']),
          }))
          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      })
    );
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private parseJsonField(field: any): any {
    if (!field) return undefined;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field.trim());
      } catch (error) {
        console.warn('Failed to parse JSON field:', error);
        return undefined;
      }
    }
    return field;
  }
}
