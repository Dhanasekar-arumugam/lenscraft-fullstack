import { useCallback, useEffect, useRef, useState } from "react";

import {
  Camera,
  Plus,
  RefreshCw,
  X,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  Save,
  BriefcaseBusiness,
  Instagram,
  ExternalLink,
  Upload,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";

import {
  getAllPhotographers,
  createPhotographer,
  updatePhotographer,
  deletePhotographer,
} from "../../api/adminPhotographerService";

import "../../styles/AdminPhotographers.css";

// ==========================================
// INITIAL FORM DATA
// ==========================================

const EMPTY_FORM = {
  name: "",
  role: "",
  specialization: "",
  experience: "",
  biography: "",
  image_url: "",
  instagram_link: "",
  active: true,
};

// ==========================================
// PHOTOGRAPHER ROLES
// ==========================================

const ROLE_OPTIONS = [
  "Wedding Photographer",
  "Candid Photographer",
  "Portrait Photographer",
  "Fashion Photographer",
  "Event Photographer",
  "Product Photographer",
  "Wildlife Photographer",
  "Videographer",
  "Cinematographer",
  "Photo Editor",
  "Video Editor",
  "Drone Photographer",
  "Other",
];

// ==========================================
// ERROR MESSAGE HELPER
// ==========================================

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, message]) => {
        const text = Array.isArray(message)
          ? message.join(", ")
          : String(message);

        return `${field}: ${text}`;
      })
      .join(" | ");
  }

  return error?.message || "Something went wrong. Please try again.";
}

// ==========================================
// IMAGE URL HELPER
// ==========================================

function getImageSrc(photographer) {
  if (!photographer) return "";

  const source =
    photographer.image || photographer.profile_image || photographer.image_url;

  if (!source) return "";

  if (
    /^(https?:)?\/\//i.test(source) ||
    source.startsWith("data:") ||
    source.startsWith("blob:")
  ) {
    return source;
  }

  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

  try {
    return new URL(source, new URL(base).origin).href;
  } catch {
    return source;
  }
}

// ==========================================
// PHOTOGRAPHER AVATAR COMPONENT
// ==========================================

function PhotographerAvatar({ person }) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageSrc = getImageSrc(person);

  useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

  return (
    <div className="ap-avatar">
      {imageSrc && !imageFailed ? (
        <img
          src={imageSrc}
          alt={person.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Camera size={30} />
      )}
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function AdminPhotographers() {
  // ========================================
  // STATES
  // ========================================

  const [photographers, setPhotographers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  const [formError, setFormError] = useState("");

  const [notification, setNotification] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    ...EMPTY_FORM,
  });

  // Image states

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

  const [existingImage, setExistingImage] = useState("");

  const [previewError, setPreviewError] = useState(false);

  const fileInputRef = useRef(null);

  // ========================================
  // NOTIFICATIONS
  // ========================================

  const notify = (type, message) => {
    setNotification({
      type,
      message,
      id: Date.now(),
    });
  };

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [notification]);

  // ========================================
  // LOAD PHOTOGRAPHERS
  // ========================================

  const loadPhotographers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAllPhotographers();

      const photographerList = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setPhotographers(photographerList);
    } catch (err) {
      console.error("Unable to load photographers:", err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotographers();
  }, [loadPhotographers]);

  // ========================================
  // IMAGE PREVIEW
  // ========================================

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview(existingImage);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);

    setImagePreview(objectUrl);
    setPreviewError(false);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage, existingImage]);

  // ========================================
  // OPEN ADD FORM
  // ========================================

  const openAdd = () => {
    setEditingId(null);

    setFormData({
      ...EMPTY_FORM,
    });

    setSelectedImage(null);
    setExistingImage("");
    setImagePreview("");
    setPreviewError(false);

    setFormError("");
    setNotification(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setShowForm(true);
  };

  // ========================================
  // OPEN EDIT FORM
  // ========================================

  const openEdit = (person) => {
    setEditingId(person.id);

    setFormData({
      name: person.name ?? "",
      role: person.role ?? "",
      specialization: person.specialization ?? "",
      experience: person.experience ?? "",
      biography: person.biography ?? "",
      image_url: person.image_url ?? "",
      instagram_link: person.instagram_link ?? "",
      active: person.active === true,
    });

    const currentImage = getImageSrc(person);

    setSelectedImage(null);
    setExistingImage(currentImage);
    setImagePreview(currentImage);
    setPreviewError(false);

    setFormError("");
    setNotification(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setShowForm(true);
  };

  // ========================================
  // CLOSE FORM
  // ========================================

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);

    setSelectedImage(null);
    setExistingImage("");
    setImagePreview("");
    setPreviewError(false);

    setFormError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========================================
  // HANDLE INPUT CHANGE
  // ========================================

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFormError("");
  };

  // ========================================
  // HANDLE IMAGE UPLOAD
  // ========================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    // Validate image format

    if (!allowedTypes.includes(file.type)) {
      setFormError("Please select a JPG, PNG, or WebP image.");

      event.target.value = "";
      return;
    }

    // Validate image size (5 MB)

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setFormError("Image size must not exceed 5 MB.");

      event.target.value = "";
      return;
    }

    setFormError("");

    setSelectedImage(file);
    setPreviewError(false);
  };

  // ========================================
  // REMOVE SELECTED IMAGE
  // ========================================

  const removeSelectedImage = () => {
    setSelectedImage(null);

    // Restore previously saved image
    setImagePreview(existingImage);

    setPreviewError(false);
    setFormError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ========================================
  // VALIDATE FORM
  // ========================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFormError("Photographer name is required.");
      return false;
    }

    if (formData.name.trim().length < 2) {
      setFormError("Photographer name must contain at least 2 characters.");
      return false;
    }

    if (!formData.role.trim()) {
      setFormError("Please select a photographer role.");
      return false;
    }

    const experience = Number(formData.experience || 0);

    if (!Number.isInteger(experience) || experience < 0) {
      setFormError("Experience must be a valid non-negative whole number.");
      return false;
    }

    return true;
  };

  // ========================================
  // ADD / UPDATE PHOTOGRAPHER
  // ========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!validateForm()) return;

    setSaving(true);
    setFormError("");
    setNotification(null);

    const isEditing = editingId !== null;

    // Create FormData for Django ImageField

    const payload = new FormData();

    payload.append("name", formData.name.trim());

    payload.append("role", formData.role.trim());

    payload.append("specialization", formData.specialization.trim());

    payload.append("experience", String(Number(formData.experience || 0)));

    payload.append("biography", formData.biography.trim());

    payload.append("image_url", formData.image_url.trim());

    payload.append("instagram_link", formData.instagram_link.trim());

    payload.append("active", String(formData.active));

    // Attach uploaded image

    if (selectedImage) {
      payload.append("profile_image", selectedImage, selectedImage.name);
    }

    try {
      if (isEditing) {
        await updatePhotographer(editingId, payload);
      } else {
        await createPhotographer(payload);
      }

      // Reset form

      setShowForm(false);
      setEditingId(null);

      setFormData({
        ...EMPTY_FORM,
      });

      setSelectedImage(null);
      setExistingImage("");
      setImagePreview("");
      setPreviewError(false);

      // Refresh photographer list

      await loadPhotographers();

      // Show success notification

      notify(
        isEditing ? "update" : "create",
        isEditing
          ? "Photographer updated successfully."
          : "Photographer added successfully.",
      );
    } catch (err) {
      console.error("Unable to save photographer:", err);

      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // OPEN DELETE CONFIRMATION
  // ========================================

  const handleDelete = (person) => {
    setDeleteTarget(person);
  };

  // ========================================
  // CONFIRM DELETE
  // ========================================

  const confirmDelete = async () => {
    if (!deleteTarget || deletingId !== null) {
      return;
    }

    const person = deleteTarget;

    setDeletingId(person.id);

    try {
      await deletePhotographer(person.id);

      setPhotographers((prev) => prev.filter((item) => item.id !== person.id));

      setDeleteTarget(null);

      notify("delete", `${person.name} deleted successfully.`);
    } catch (err) {
      console.error("Unable to delete photographer:", err);

      notify("error", getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  // ========================================
  // SEARCH PHOTOGRAPHERS
  // ========================================

  const keyword = search.trim().toLowerCase();

  const filtered = photographers.filter((person) => {
    const values = [person.name, person.role, person.specialization];

    return values.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(keyword),
    );
  });

  // ========================================
  // DASHBOARD STATISTICS
  // ========================================

  const activeCount = photographers.filter(
    (person) => person.active === true,
  ).length;

  const inactiveCount = photographers.length - activeCount;

  // ========================================
  // JSX
  // ========================================

  return (
    <main className="ap-page aph-page">
      {/* ====================================
          NOTIFICATION
      ==================================== */}

      {notification && (
        <div
          className={`ap-toast ap-toast-${notification.type}`}
          role={notification.type === "error" ? "alert" : "status"}
          key={notification.id}
        >
          <span className="ap-toast-icon">
            {notification.type === "delete" || notification.type === "error" ? (
              <AlertTriangle size={22} />
            ) : (
              <CheckCircle2 size={22} />
            )}
          </span>

          <div className="ap-toast-content">
            <strong>
              {
                {
                  create: "Photographer Added",
                  update: "Update Successful",
                  delete: "Photographer Deleted",
                  error: "Action Failed",
                }[notification.type]
              }
            </strong>

            <p>{notification.message}</p>
          </div>

          <button
            className="ap-toast-close"
            type="button"
            onClick={() => setNotification(null)}
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="ap-container">
        {/* ====================================
            PAGE HEADER
        ==================================== */}

        <header className="ap-header">
          <div>
            <p className="ap-eyebrow">LENSCRAFT STUDIO </p>

            <h1>
              Photographer <span>Management</span>
            </h1>

            <p className="ap-subtitle">
              Manage your creative team, upload profile photos, update details,
              and control photographer availability.
            </p>
          </div>

          <button
            type="button"
            className="ap-btn ap-btn-primary"
            onClick={openAdd}
          >
            <Plus size={18} />
            Add Photographer
          </button>
        </header>

        {/* ====================================
            STATISTICS
        ==================================== */}

        <section className="ap-stats" aria-label="Photographer summary">
          {/* Total Photographers */}

          <div className="ap-stat-card">
            <div className="ap-stat-icon">
              <Users size={23} />
            </div>

            <div>
              <p>Total Photographers</p>
              <h2>{photographers.length}</h2>
            </div>
          </div>

          {/* Active Photographers */}

          <div className="ap-stat-card">
            <div className="ap-stat-icon available">
              <CheckCircle2 size={23} />
            </div>

            <div>
              <p>Active</p>
              <h2>{activeCount}</h2>
            </div>
          </div>

          {/* Inactive Photographers */}

          <div className="ap-stat-card">
            <div className="ap-stat-icon unavailable">
              <XCircle size={23} />
            </div>

            <div>
              <p>Inactive</p>
              <h2>{inactiveCount}</h2>
            </div>
          </div>
        </section>

        {/* ====================================
            SEARCH AND REFRESH
        ==================================== */}

        <div className="ap-toolbar">
          <div className="ap-search">
            <Search size={18} />

            <input
              type="search"
              aria-label="Search photographers"
              placeholder="Search name, role, specialization..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <button
            type="button"
            className="ap-btn ap-btn-outline"
            onClick={loadPhotographers}
            disabled={loading}
          >
            <RefreshCw size={17} className={loading ? "ap-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ====================================
            API ERROR
        ==================================== */}

        {error && (
          <div className="ap-alert ap-alert-error" role="alert">
            {error}
          </div>
        )}

        {/* ====================================
            PHOTOGRAPHER LIST
        ==================================== */}

        <section className="ap-list-section">
          <div className="ap-section-heading">
            <h2>Our Creative Team</h2>

            <span>{filtered.length} Members</span>
          </div>

          {/* Loading */}

          {loading ? (
            <div className="ap-empty-state">
              <RefreshCw className="ap-spin" size={36} />

              <h3>Loading photographers...</h3>
            </div>
          ) : filtered.length === 0 ? (
            /* Empty State */

            <div className="ap-empty-state">
              <Camera size={42} />

              <h3>
                {keyword
                  ? "No matching photographers"
                  : "No photographers found"}
              </h3>

              <p>
                {keyword
                  ? "Try a different search term."
                  : "Click Add Photographer to create your first team member."}
              </p>
            </div>
          ) : (
            /* Photographer Cards */

            <div className="ap-photographer-grid">
              {filtered.map((person) => (
                <article className="ap-photographer-card" key={person.id}>
                  {/* Card Top */}

                  <div className="ap-card-top">
                    <PhotographerAvatar person={person} />

                    <span
                      className={`ap-status ${
                        person.active === true
                          ? "ap-status-available"
                          : "ap-status-unavailable"
                      }`}
                    >
                      <span className="ap-status-dot" />

                      {person.active === true ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Card Body */}

                  <div className="ap-card-body">
                    <h3>{person.name}</h3>

                    <p className="ap-role">
                      <BriefcaseBusiness size={15} />

                      {person.role || "Photographer"}
                    </p>

                    <div className="ap-card-divider" />

                    <div className="ap-detail-row">
                      <span>Specialization</span>

                      <strong>
                        {person.specialization || "Not specified"}
                      </strong>
                    </div>

                    <div className="ap-detail-row">
                      <span>Experience</span>

                      <strong>{person.experience ?? 0} years</strong>
                    </div>

                    {person.biography && (
                      <p className="ap-card-bio">{person.biography}</p>
                    )}

                    {person.instagram_link && (
                      <a
                        className="ap-instagram"
                        href={person.instagram_link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Instagram size={15} />
                        Instagram
                        <ExternalLink size={13} />
                      </a>
                    )}

                    {/* Card Actions */}

                    <div className="ap-card-actions">
                      <button
                        type="button"
                        className="ap-btn ap-btn-outline"
                        onClick={() => openEdit(person)}
                        disabled={deletingId !== null}
                      >
                        <Pencil size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        className="ap-btn ap-btn-danger"
                        onClick={() => handleDelete(person)}
                        disabled={deletingId !== null}
                      >
                        <Trash2 size={16} />

                        {deletingId === person.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ====================================
          DELETE CONFIRMATION MODAL
      ==================================== */}

      {deleteTarget && (
        <div
          className="ap-delete-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && deletingId === null) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="ap-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ap-delete-title"
            aria-describedby="ap-delete-description"
          >
            <div className="ap-delete-icon">
              <Trash2 size={30} />
            </div>

            <h2 id="ap-delete-title">Delete Photographer?</h2>

            <p id="ap-delete-description">
              Are you sure you want to permanently delete{" "}
              <strong>{deleteTarget.name}</strong>? This action cannot be
              undone.
            </p>

            <div className="ap-delete-actions">
              <button
                type="button"
                className="ap-btn ap-btn-outline"
                disabled={deletingId !== null}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ap-btn ap-btn-danger"
                disabled={deletingId !== null}
                onClick={confirmDelete}
              >
                <Trash2 size={17} />

                {deletingId !== null ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================
          ADD / EDIT PHOTOGRAPHER MODAL
      ==================================== */}

      {showForm && (
        <div
          className="ap-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            className="ap-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ap-modal-title"
          >
            {/* Modal Header */}

            <div className="ap-modal-header">
              <div>
                <p className="ap-eyebrow">TEAM MANAGEMENT</p>

                <h2 id="ap-modal-title">
                  {editingId !== null
                    ? "Edit Photographer"
                    : "Add New Photographer"}
                </h2>
              </div>

              <button
                type="button"
                className="ap-close-btn"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={21} />
              </button>
            </div>

            {/* Form Error */}

            {formError && (
              <div
                className="ap-alert ap-alert-error ap-form-full"
                role="alert"
              >
                {formError}
              </div>
            )}

            {/* Photographer Form */}

            <form className="ap-form" onSubmit={handleSubmit}>
              {/* Full Name */}

              <div className="ap-form-group">
                <label htmlFor="ap-name">Full Name *</label>

                <input
                  id="ap-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={120}
                  minLength={2}
                  placeholder="Enter photographer name"
                  required
                />
              </div>

              {/* Role */}

              <div className="ap-form-group">
                <label htmlFor="ap-role">Role *</label>

                <select
                  id="ap-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select role</option>

                  {formData.role && !ROLE_OPTIONS.includes(formData.role) && (
                    <option value={formData.role}>{formData.role}</option>
                  )}

                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialization */}

              <div className="ap-form-group">
                <label htmlFor="ap-specialization">Specialization</label>

                <input
                  id="ap-specialization"
                  name="specialization"
                  type="text"
                  value={formData.specialization}
                  onChange={handleChange}
                  maxLength={150}
                  placeholder="Wedding, portraits, events..."
                />
              </div>

              {/* Experience */}

              <div className="ap-form-group">
                <label htmlFor="ap-experience">Experience (Years)</label>

                <input
                  id="ap-experience"
                  name="experience"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="5"
                />
              </div>

              {/* ====================================
                  PROFILE IMAGE UPLOAD
              ==================================== */}

              <div className="ap-form-group ap-form-full">
                <label htmlFor="ap-upload">Photographer Profile Photo</label>

                <div className="ap-upload-area">
                  {/* Image Preview */}

                  <div className="ap-upload-preview">
                    {imagePreview && !previewError ? (
                      <img
                        src={imagePreview}
                        alt="Photographer profile preview"
                        onError={() => setPreviewError(true)}
                      />
                    ) : (
                      <div className="ap-upload-placeholder">
                        <ImageIcon size={35} />
                        <span>No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Details */}

                  <div className="ap-upload-details">
                    <h4>
                      {selectedImage
                        ? selectedImage.name
                        : imagePreview
                          ? "Current Profile Photo"
                          : "Upload Profile Photo"}
                    </h4>

                    <p>Select a professional photograph from your computer.</p>

                    <span className="ap-upload-hint">
                      JPG, PNG or WebP · Maximum 5 MB
                    </span>

                    <div className="ap-upload-actions">
                      {/* Choose Photo Button */}

                      <label htmlFor="ap-upload" className="ap-upload-button">
                        <Upload size={17} />

                        {imagePreview ? "Change Photo" : "Choose Photo"}
                      </label>

                      {/* Cancel Selected Photo */}

                      {selectedImage && (
                        <button
                          type="button"
                          className="ap-upload-cancel"
                          onClick={removeSelectedImage}
                          disabled={saving}
                        >
                          <X size={16} />
                          Cancel Selection
                        </button>
                      )}
                    </div>

                    {/* Actual File Input */}

                    <input
                      ref={fileInputRef}
                      id="ap-upload"
                      name="profile_image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              {/* Instagram URL */}

              <div className="ap-form-group">
                <label htmlFor="ap-instagram">Instagram URL</label>

                <div className="ap-field-with-icon">
                  <Instagram size={17} />

                  <input
                    id="ap-instagram"
                    name="instagram_link"
                    type="url"
                    value={formData.instagram_link}
                    onChange={handleChange}
                    placeholder="https://www.instagram.com/..."
                  />
                </div>
              </div>

              {/* Biography */}

              <div className="ap-form-group ap-form-full">
                <label htmlFor="ap-biography">Biography</label>

                <textarea
                  id="ap-biography"
                  name="biography"
                  rows={4}
                  value={formData.biography}
                  onChange={handleChange}
                  placeholder="Tell us about this photographer..."
                />
              </div>

              {/* ====================================
                  ACTIVE / INACTIVE SWITCH
              ==================================== */}

              <div className="ap-availability-field">
                <div>
                  <h4>Active Photographer</h4>

                  <p>Mark this team member as active or inactive.</p>
                </div>

                <label className="ap-switch">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    aria-label="Active photographer"
                  />

                  <span className="ap-slider" />
                </label>
              </div>

              {/* ====================================
                  FORM BUTTONS
              ==================================== */}

              <div className="ap-form-actions">
                <button
                  type="button"
                  className="ap-btn ap-btn-outline"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="ap-btn ap-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <RefreshCw size={17} className="ap-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId !== null
                      ? "Update Photographer"
                      : "Save Photographer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
