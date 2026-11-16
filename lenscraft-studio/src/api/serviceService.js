import api from "./axios";

// ============================================
// PUBLIC API
// ============================================

const publicConfig = {
  publicRequest: true,
  timeout: 10000,
};

// Photography Services
export const getServices = async () => {
  const response = await api.get("services/", publicConfig);

  return response.data;
};

// Photography Packages
export const getServicePackages = async () => {
  const response = await api.get("service-packages/", publicConfig);

  return response.data;
};

// Photographers
export const getPhotographers = async () => {
  const response = await api.get("photographers/", publicConfig);

  return response.data;
};

// Studio Information
export const getStudioInfo = async () => {
  const response = await api.get("studio/", publicConfig);

  return response.data;
};

// ============================================
// ADMIN SERVICES API
// ============================================

export const getAdminServices = async () => {
  const response = await api.get("services/");
  return response.data;
};

export const getServiceById = async (id) => {
  const response = await api.get(`services/${id}/`);
  return response.data;
};

// ============================================
// PREPARE SERVICE FORM DATA
// ============================================

const prepareServiceData = (data) => {
  const formData = new FormData();

  formData.append("title", data.title.trim());
  formData.append("description", data.description.trim());
  formData.append("price", String(data.price));
  formData.append("active", String(data.active));

  formData.append("image_url", data.image_url?.trim() || "");

  if (data.uploaded_image && data.uploaded_image instanceof File) {
    formData.append(
      "uploaded_image",
      data.uploaded_image,
      data.uploaded_image.name,
    );
  }

  return formData;
};

// ============================================
// CREATE SERVICE
// ============================================

export const createService = async (data) => {
  const formData = prepareServiceData(data);

  const response = await api.post("services/", formData);

  return response.data;
};

// ============================================
// UPDATE SERVICE
// ============================================

export const updateService = async (id, data) => {
  const formData = prepareServiceData(data);

  const response = await api.patch(`services/${id}/`, formData);

  return response.data;
};

// ============================================
// DELETE SERVICE
// ============================================

export const deleteService = async (id) => {
  const response = await api.delete(`services/${id}/`);

  return response.data;
};

// ============================================
// ACTIVATE / DEACTIVATE SERVICE
// ============================================

export const updateServiceStatus = async (id, active) => {
  const response = await api.patch(`services/${id}/`, { active });

  return response.data;
};
