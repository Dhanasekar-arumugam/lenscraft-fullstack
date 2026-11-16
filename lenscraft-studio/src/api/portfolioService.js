import api from "./axios";

const unwrap = (response) => response.data;

export const getPortfolioPhotos = async (params = {}) => {
  const response = await api.get("portfolio/", { params });
  return unwrap(response);
};

export const getPortfolioPhoto = async (id) => {
  const response = await api.get(`portfolio/${id}/`);
  return unwrap(response);
};

export const uploadPortfolioPhotos = async (
  files,
  details = {},
  onProgress,
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  Object.entries(details).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  const response = await api.post("portfolio/bulk-upload/", formData, {
    timeout: 180000,
    onUploadProgress: (event) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return unwrap(response);
};

export const updatePortfolioPhoto = async (id, details) => {
  const formData = new FormData();

  Object.entries(details).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await api.patch(`portfolio/${id}/`, formData);

  return unwrap(response);
};

export const deletePortfolioPhoto = async (id) => {
  const response = await api.delete(`portfolio/${id}/`);
  return unwrap(response);
};
