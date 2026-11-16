import api from "./axios";

// ============================================================
// 1. GET ALL BOOKINGS (ADMIN)
// ============================================================

export const getAllBookings = async () => {
  const response = await api.get("bookings/");

  return response.data;
};

// ============================================================
// 2. GET BOOKING DETAILS
// ============================================================

export const getBookingById = async (bookingId) => {
  const response = await api.get(`bookings/${bookingId}/`);

  return response.data;
};

// ============================================================
// 3. UPDATE BOOKING STATUS (ADMIN)
// ============================================================

export const updateBookingStatus = async (bookingId, status) => {
  const response = await api.patch(`bookings/${bookingId}/`, {
    status,
  });

  return response.data;
};

// ============================================================
// 4. DELETE BOOKING (ADMIN)
// ============================================================

export const deleteBooking = async (bookingId) => {
  const response = await api.delete(`bookings/${bookingId}/`);

  return response.data;
};
