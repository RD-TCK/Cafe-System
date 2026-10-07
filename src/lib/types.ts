export type ReservationStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "NO_SHOW";

export type VisitStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type OrderStatus = "PENDING" | "ACCEPTED" | "PREPARING" | "SERVED" | "CANCELLED";

export type OrderItemStatus = "ACTIVE" | "CANCELLED";

export type BillStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";

export type PaymentMethod = "CASH" | "UPI_QR" | "CREDIT_CARD" | "DEBIT_CARD" | "OTHER";

export type TableSection = "INDOOR" | "OUTDOOR" | "TERRACE" | "BALCONY";

export interface BookingSlotRequest {
  date: string; // "YYYY-MM-DD"
  guestCount: number;
  durationMinutes?: number;
  tableId?: string; // Optional: specific table or undefined for any
}

export interface CreateReservationInput {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestCount: number;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  durationMinutes?: number;
  requestedTableId?: string | null;
  occasion?: string;
  specialRequest?: string;
  idempotencyKey?: string;
}

export interface RescheduleReservationInput {
  bookingReference: string;
  securityToken: string;
  newDate: string;
  newTime: string;
  newDurationMinutes?: number;
  newGuestCount?: number;
  requestedTableId?: string | null;
}

export interface PlaceOrderInput {
  visitCode: string;
  tableId: string;
  notes?: string;
  idempotencyKey?: string;
  items: {
    menuItemId: string;
    quantity: number;
    customInstructions?: string;
  }[];
}

export interface RecordPaymentInput {
  billId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNote?: string;
  idempotencyKey?: string;
}

export interface TableSummaryDTO {
  id: string;
  tableNumber: string;
  name: string;
  capacityMin: number;
  capacityMax: number;
  section: string;
  isActive: boolean;
  photoUrl?: string | null;
  description?: string | null;
  currentVisit?: {
    id: string;
    visitCode: string;
    guestName: string | null;
    guestCount: number;
    checkedInAt: string;
    ordersCount: number;
    billTotal: number;
    billStatus: string;
  } | null;
  activeReservation?: {
    id: string;
    bookingReference: string;
    guestName: string;
    startDateTime: string;
    endDateTime: string;
    status: string;
  } | null;
}
