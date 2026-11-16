import api from "./axios";

const REVIEW_URL = "reviews/";

function unwrap(response) {
  return response.data;
}

export const getReviews = async (params = {}) => {
  const response = await api.get(REVIEW_URL, { params });
  return unwrap(response);
};

export const getReviewSummary = async (params = {}) => {
  const response = await api.get(`${REVIEW_URL}summary/`, {
    params,
  });
  return unwrap(response);
};

export const getMyReviews = async () => {
  const response = await api.get(`${REVIEW_URL}mine/`);
  return unwrap(response);
};

export const createReview = async (data) => {
  const response = await api.post(REVIEW_URL, data);
  return unwrap(response);
};

export const updateReview = async (id, data) => {
  const response = await api.patch(`${REVIEW_URL}${id}/`, data);
  return unwrap(response);
};

export const deleteReview = async (id) => {
  const response = await api.delete(`${REVIEW_URL}${id}/`);
  return unwrap(response);
};

export const getModerationReviews = async (params = {}) => {
  const response = await api.get(`${REVIEW_URL}moderation/`, {
    params,
  });
  return unwrap(response);
};

export const approveReview = async (id) => {
  const response = await api.post(`${REVIEW_URL}${id}/approve/`);
  return unwrap(response);
};

export const rejectReview = async (id) => {
  const response = await api.post(`${REVIEW_URL}${id}/reject/`);
  return unwrap(response);
};

export function getReviewError(error) {
  const data = error.response?.data;

  if (!data) {
    return error.message || "Something went wrong.";
  }

  if (typeof data.detail === "string") return data.detail;

  if (typeof data === "string") return data;

  const first = Object.values(data)[0];

  if (Array.isArray(first)) return first.join(" ");
  if (typeof first === "string") return first;

  return "Unable to process your request.";
}
