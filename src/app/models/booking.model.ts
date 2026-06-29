export interface BookingFields {
  'Customer Name': string;
  Email: string;
  Phone: string;
  'Emergency Contact': string;
  Status: 'Pending' | 'Confirmed' | 'Cancelled';
  'Total Amount': number;
  'Deposit Amount': number;
  'Deposit Paid': boolean;
  'Medical Conditions'?: string;
  Notes?: string;
  available_slot_id: string; // Link to the available slot record
}

export interface AvailableSlotFields {
  Date: string; // ISO date string
  'Start Date': string; // ISO date string
  'End Date': string; // ISO date string
  'Max Bookings'?: number;
  'Current Bookings': number;
  'Price Per Person'?: number;
  Available: boolean;
  summary?: string;
  tour_title?: string;
  tour_image?: Array<{
    id: string;
    url: string;
    width: number;
    height: number;
    filename?: string;
    size?: number;
    type?: string;
  }>;
  deposit_amount?: number;
  hero_badge_text?: string;
  tour_description?: string;
  itinerary?: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  included_items?: Array<{
    icon: string;
    title: string;
    subtitle: string;
  }>;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  emergencyContact: string;
  medicalConditions?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface BookingRequest {
  dateRange: DateRange;
  customerDetails: CustomerDetails;
  totalAmount: number;
  depositAmount: number;
  selectedSlotId?: string;
}

export interface AvailableSlotRecord {
  id: string;
  fields: AvailableSlotFields;
}
