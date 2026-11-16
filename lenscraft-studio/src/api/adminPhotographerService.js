import api from "./axios";

// ============================================================
// 1. PREPARE PHOTOGRAPHER FORM DATA
// ============================================================

const preparePhotographerData = (data) => {
  if (data instanceof FormData) {
    return data;
  }

  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    // Skip empty optional values
    if (value === undefined || value === null) {
      return;
    }

    // Handle photographer image upload
    if (key === "profile_image") {
      if (value instanceof File) {
        formData.append("profile_image", value);
      }

      return;
    }

    // Convert boolean values
    if (typeof value === "boolean") {
      formData.append(key, String(value));
      return;
    }

    // Append remaining fields
    formData.append(key, value);
  });

  return formData;
};

// ============================================================
// 2. GET ALL PHOTOGRAPHERS
// ============================================================

export const getAllPhotographers = async () => {
  const response = await api.get("photographers/");

  return response.data;
};

// ============================================================
// 3. GET PHOTOGRAPHER BY ID
// ============================================================

export const getPhotographerById = async (id) => {
  const response = await api.get(`photographers/${id}/`);

  return response.data;
};

// ============================================================
// 4. CREATE PHOTOGRAPHER
// ============================================================

export const createPhotographer = async (data) => {
  const formData = preparePhotographerData(data);

  const response = await api.post("photographers/", formData);

  return response.data;
};

// ============================================================
// 5. UPDATE PHOTOGRAPHER
// ============================================================

export const updatePhotographer = async (id, data) => {
  const formData = preparePhotographerData(data);

  const response = await api.patch(`photographers/${id}/`, formData);

  return response.data;
};

// ============================================================
// 6. DELETE PHOTOGRAPHER
// ============================================================

export const deletePhotographer = async (id) => {
  const response = await api.delete(`photographers/${id}/`);

  return response.data;
};

// ============================================================
// 7. UPDATE PHOTOGRAPHER AVAILABILITY
// ============================================================

export const updatePhotographerAvailability = async (id, isAvailable) => {
  const response = await api.patch(`photographers/${id}/`, {
    active: isAvailable,
  });

  return response.data;
};
