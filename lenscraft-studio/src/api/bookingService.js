import api from "./axios";

// ============================================================
// LENSCRAFT STUDIO - UNIFIED BOOKING API
// ============================================================

const BOOKING_URL = "bookings/";

// ============================================================
// ERROR HANDLING
// ============================================================

const handleBookingError = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;

  if (status === 401) {
    throw new Error("Your session has expired. Please log in to continue.");
  }

  if (status === 403) {
    throw new Error("You do not have permission to perform this action.");
  }

  if (status === 404) {
    throw new Error("The requested booking was not found.");
  }

  if (status === 429) {
    throw new Error("Too many requests. Please wait a moment and try again.");
  }

  if (data && typeof data === "object") {
    const messages = Object.entries(data).flatMap(([field, value]) => {
      const errors = Array.isArray(value) ? value : [value];

      return errors.map((message) =>
        field === "detail" || field === "non_field_errors"
          ? String(message)
          : `${field}: ${String(message)}`,
      );
    });

    if (messages.length > 0) {
      throw new Error(messages.join("\n"));
    }
  }

  throw new Error(error.message || "Something went wrong. Please try again.");
};

// ============================================================
// VALIDATE BOOKING INFORMATION
// ============================================================

const validateBooking = (data) => {
  if (!data.customer_name?.trim()) {
    throw new Error("Customer name is required.");
  }

  if (!data.email?.trim()) {
    throw new Error("Email address is required.");
  }

  if (!data.phone?.trim()) {
    throw new Error("Phone number is required.");
  }

  if (!data.event_date) {
    throw new Error("Please select an event date.");
  }

  if (!data.event_location?.trim()) {
    throw new Error("Please enter an event location.");
  }

  const hasService =
    Boolean(data.service?.trim()) || Boolean(data.service_reference);

  const hasPhotographer = Boolean(data.photographer);

  if (!hasService && !hasPhotographer) {
    throw new Error("Please select a service or photographer.");
  }

  return true;
};

// ============================================================
// FORMAT BOOKING DATA
// ============================================================

const formatBookingData = (data) => {
  return {
    customer_name: data.customer_name?.trim() || "",

    email: data.email?.trim().toLowerCase() || "",

    phone: data.phone?.trim() || "",

    service: data.service?.trim() || "",

    service_reference: data.service_reference
      ? Number(data.service_reference)
      : null,

    photographer: data.photographer ? Number(data.photographer) : null,

    event_date: data.event_date,

    event_time: data.event_time || null,

    event_location: data.event_location?.trim() || "",

    special_requirements:
      data.special_requirements?.trim() || data.message?.trim() || "",
  };
};

// ============================================================
// 1. CREATE UNIFIED BOOKING
// Service + Photographer + Combined
// ============================================================

export const createBooking = async (bookingData) => {
  try {
    validateBooking(bookingData);

    const formattedData = formatBookingData(bookingData);

    const response = await api.post(BOOKING_URL, formattedData);

    return response.data;
  } catch (error) {
    handleBookingError(error);
  }
};

// ============================================================
// 2. CREATE SERVICE BOOKING
// ============================================================

export const createServiceBooking = async (bookingData) => {
  return createBooking({
    ...bookingData,
    photographer: null,
  });
};

// ============================================================
// 3. CREATE PHOTOGRAPHER BOOKING
// ============================================================

export const createPhotographerBooking = async (
  photographerId,
  bookingData,
) => {
  return createBooking({
    ...bookingData,
    service: "",
    service_reference: null,
    photographer: photographerId,
  });
};

// ============================================================
// 4. CREATE COMBINED BOOKING
// ============================================================

export const createCombinedBooking = async (
  serviceId,
  photographerId,
  bookingData,
) => {
  return createBooking({
    ...bookingData,
    service_reference: serviceId,
    photographer: photographerId,
  });
};

// ============================================================
// 5. GET CUSTOMER BOOKING HISTORY
// ============================================================

export const getMyBookings = async () => {
  try {
    const response = await api.get(`${BOOKING_URL}my-bookings/`);

    return response.data;
  } catch (error) {
    handleBookingError(error);
  }
};

// ============================================================
// 6. GET ALL BOOKINGS - ADMIN
// ============================================================

export const getAdminBookings = async () => {
  try {
    const response = await api.get(BOOKING_URL);

    return response.data;
  } catch (error) {
    handleBookingError(error);
  }
};

// ============================================================
// 7. GET SINGLE BOOKING DETAILS - ADMIN
// ============================================================

export const getBookingById = async (id) => {
  try {
    const response = await api.get(`${BOOKING_URL}${id}/`);

    return response.data;
  } catch (error) {
    handleBookingError(error);
  }
};

// ============================================================
// 8. UPDATE BOOKING - ADMIN
// ============================================================

export const updateBooking = async (id, data) => {
  try {
    const response = await api.patch(`${BOOKING_URL}${id}/`, data);

    return response.data;
  } catch (error) {
    handleBookingError(error);
  }
};

// ============================================================
// 9. CONFIRM BOOKING - ADMIN
// ============================================================

export const confirmBooking = async (id) => {
  return updateBooking(id, {
    status: "confirmed",
  });
};

// ============================================================
// 10. COMPLETE BOOKING - ADMIN
// ============================================================

export const completeBooking = async (id) => {
  return updateBooking(id, {
    status: "completed",
  });
};

// ============================================================
// 11. CANCEL BOOKING - ADMIN
// ============================================================

export const adminCancelBooking = async (id) => {
  return updateBooking(id, {
    status: "cancelled",
  });
};

// ============================================================
// 12. DELETE BOOKING - ADMIN
// ============================================================

export const deleteBooking = async (id) => {
  try {
    await api.delete(`${BOOKING_URL}${id}/`);

    return {
      success: true,
      message: "Booking deleted successfully.",
    };
  } catch (error) {
    handleBookingError(error);
  }
};

// ============================================================
// 13. CANCEL BOOKING - CUSTOMER
// ============================================================

export const cancelBooking = async (id) => {
  try {
    const response = await api.post(`${BOOKING_URL}${id}/cancel/`);

    return response.data;
  } catch (error) {
    handleBookingError(error);
  }
};

// ============================================================
// 14. FILTER BOOKINGS
// Client-side filtering for the admin dashboard
// ============================================================

export const filterBookings = (
  bookings,
  { status = "all", bookingType = "all", search = "" } = {},
) => {
  return bookings.filter((booking) => {
    const matchesStatus = status === "all" || booking.status === status;

    const matchesType =
      bookingType === "all" || booking.booking_type === bookingType;

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      [
        booking.customer_name,
        booking.email,
        booking.phone,
        booking.service_name,
        booking.photographer_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText));

    return matchesStatus && matchesType && matchesSearch;
  });
};
