import api from "./axios";

// ============================================================
// 1. GET ALL PHOTOGRAPHERS
// ============================================================

export const getPhotographers = async () => {
  const response = await api.get("photographers/");
  return response.data;
};

// ============================================================
// 2. GET PHOTOGRAPHER BY ID
// ============================================================

export const getPhotographerById = async (id) => {
  if (id === undefined || id === null || id === "") {
    throw new Error("Photographer ID is required.");
  }

  const response = await api.get(`photographers/${id}/`);
  return response.data;
};
