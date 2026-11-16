import api from "./axios";

// ==========================================
// GET ALL PACKAGES
// ==========================================

export const getAdminPackages = async () => {
  const response = await api.get("service-packages/");
  return response.data;
};

// ==========================================
// GET SINGLE PACKAGE
// ==========================================

export const getPackageById = async (id) => {
  const response = await api.get(`service-packages/${id}/`);
  return response.data;
};

// ==========================================
// PREPARE PACKAGE FORM DATA
// ==========================================

const preparePackageData = (data) => {
  const formData = new FormData();

  // Package Name
  formData.append("name", data.name.trim());

  // Package Description
  formData.append("description", data.description.trim());

  // Starting Price
  formData.append("starting_price", String(data.starting_price));

  // Duration
  formData.append("duration", data.duration.trim());

  // Active / Inactive
  formData.append("is_active", String(data.is_active));

  // Upload image only if an actual file is selected
  if (data.uploaded_image instanceof File) {
    formData.append(
      "uploaded_image",
      data.uploaded_image,
      data.uploaded_image.name,
    );
  }

  return formData;
};

// ==========================================
// CREATE PACKAGE
// ==========================================

export const createPackage = async (data) => {
  const formData = preparePackageData(data);

  const response = await api.post("service-packages/", formData);

  return response.data;
};

// ==========================================
// UPDATE PACKAGE
// ==========================================

export const updatePackage = async (id, data) => {
  const formData = preparePackageData(data);

  const response = await api.patch(`service-packages/${id}/`, formData);

  return response.data;
};

// ==========================================
// DELETE PACKAGE
// ==========================================

export const deletePackage = async (id) => {
  const response = await api.delete(`service-packages/${id}/`);

  return response.data;
};

// ==========================================
// ACTIVATE / DEACTIVATE PACKAGE
// ==========================================

export const updatePackageStatus = async (id, is_active) => {
  const response = await api.patch(`service-packages/${id}/`, { is_active });

  return response.data;
};
