import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ImagePlus,
  IndianRupee,
  Layers,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ShieldAlert,
} from "lucide-react";

import {
  getAdminServices,
  createService,
  updateService,
  deleteService,
  updateServiceStatus,
} from "../../api/serviceService";

import "../../styles/AdminServices.css";

// ==========================================
// INITIAL FORM DATA
// ==========================================

const initialForm = {
  title: "",
  description: "",
  price: "",
  image_url: "",
  uploaded_image: null,
  active: true,
};

// ==========================================
// HELPERS
// ==========================================

const formatPrice = (price) => {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (error?.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error?.response?.status === 403) {
    return "You do not have permission to perform this action.";
  }

  if (error?.response?.status === 429) {
    return "Too many requests. Please try again later.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data?.detail) {
    return String(data.detail);
  }

  if (data && typeof data === "object") {
    const messages = Object.entries(data).flatMap(([field, errors]) => {
      const values = Array.isArray(errors) ? errors : [errors];

      return values.map((message) => {
        const readableField = field
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());

        return `${readableField}: ${String(message)}`;
      });
    });

    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  return error?.message || "Something went wrong.";
};

const normalizeServices = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  return [];
};

// ==========================================
// ADMIN SERVICES COMPONENT
// ==========================================

export default function AdminServices() {
  // ----------------------------------------
  // SERVICES STATE
  // ----------------------------------------

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ----------------------------------------
  // SEARCH AND FILTER
  // ----------------------------------------

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ----------------------------------------
  // MODAL STATE
  // ----------------------------------------

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingService, setDeletingService] = useState(null);

  // ----------------------------------------
  // FORM STATE
  // ----------------------------------------

  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");

  // ----------------------------------------
  // ACTION STATES
  // ----------------------------------------

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // ----------------------------------------
  // NOTIFICATIONS
  // ----------------------------------------

  const [notification, setNotification] = useState(null);

  // ==========================================
  // NOTIFICATION HANDLER
  // ==========================================

  const showNotification = useCallback((type, message) => {
    setNotification({
      type,
      message,
      id: Date.now(),
    });
  }, []);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timer = setTimeout(() => {
      setNotification(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [notification]);

  // ==========================================
  // LOAD SERVICES
  // ==========================================

  const fetchServices = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getAdminServices();

        setServices(normalizeServices(response));
      } catch (error) {
        showNotification("error", getErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showNotification],
  );

  useEffect(() => {
    document.title = "Manage Services | Lenscraft Admin";

    fetchServices();
  }, [fetchServices]);

  // ==========================================
  // IMAGE PREVIEW CLEANUP
  // ==========================================

  useEffect(() => {
    if (!(formData.uploaded_image instanceof File)) {
      return;
    }

    const objectUrl = URL.createObjectURL(formData.uploaded_image);

    setImagePreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [formData.uploaded_image]);

  // ==========================================
  // SERVICE STATISTICS
  // ==========================================

  const statistics = useMemo(() => {
    const total = services.length;

    const active = services.filter((service) => service.active).length;

    const inactive = total - active;

    const withImages = services.filter((service) =>
      Boolean(service.image),
    ).length;

    return {
      total,
      active,
      inactive,
      withImages,
    };
  }, [services]);

  // ==========================================
  // FILTER SERVICES
  // ==========================================

  const filteredServices = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return services.filter((service) => {
      const title = (service.title || "").toLowerCase();

      const description = (service.description || "").toLowerCase();

      const matchesSearch =
        title.includes(searchTerm) || description.includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && service.active) ||
        (statusFilter === "inactive" && !service.active);

      return matchesSearch && matchesStatus;
    });
  }, [services, search, statusFilter]);

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  const openAddModal = () => {
    setEditingService(null);
    setFormData({ ...initialForm });
    setFormErrors({});
    setImagePreview("");
    setShowFormModal(true);
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (service) => {
    setEditingService(service);

    setFormData({
      title: service.title || "",
      description: service.description || "",
      price: String(service.price ?? ""),
      image_url: service.image_url || "",
      uploaded_image: null,
      active: Boolean(service.active),
    });

    setFormErrors({});
    setImagePreview(service.image || "");
    setShowFormModal(true);
  };

  // ==========================================
  // CLOSE FORM MODAL
  // ==========================================

  const closeFormModal = () => {
    if (submitting) {
      return;
    }

    setShowFormModal(false);
    setEditingService(null);
    setFormData({ ...initialForm });
    setFormErrors({});
    setImagePreview("");
  };

  // ==========================================
  // HANDLE FORM INPUT
  // ==========================================

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // ==========================================
  // HANDLE IMAGE UPLOAD
  // ==========================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setFormErrors((previous) => ({
        ...previous,
        uploaded_image: "Only JPG, PNG, and WebP images are allowed.",
      }));

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormErrors((previous) => ({
        ...previous,
        uploaded_image: "Image size must be less than 5 MB.",
      }));

      event.target.value = "";
      return;
    }

    setFormData((previous) => ({
      ...previous,
      uploaded_image: file,
    }));

    setFormErrors((previous) => ({
      ...previous,
      uploaded_image: "",
    }));
  };

  // ==========================================
  // VALIDATE SERVICE FORM
  // ==========================================

  const validateForm = () => {
    const errors = {};

    if (formData.title.trim().length < 3) {
      errors.title = "Service title must contain at least 3 characters.";
    }

    if (!formData.description.trim()) {
      errors.description = "Service description is required.";
    }

    if (
      formData.price === "" ||
      !Number.isFinite(Number(formData.price)) ||
      Number(formData.price) < 0
    ) {
      errors.price = "Enter a valid service price.";
    }

    if (formData.image_url.trim()) {
      try {
        const url = new URL(formData.image_url);

        if (!["http:", "https:"].includes(url.protocol)) {
          errors.image_url = "Enter a valid HTTP or HTTPS image URL.";
        }
      } catch {
        errors.image_url = "Enter a valid image URL.";
      }
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // ==========================================
  // SUBMIT ADD / EDIT FORM
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || !validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (editingService) {
        await updateService(editingService.id, formData);

        showNotification(
          "success",
          `"${formData.title}" updated successfully.`,
        );
      } else {
        await createService(formData);

        showNotification(
          "success",
          `"${formData.title}" created successfully.`,
        );
      }

      setShowFormModal(false);
      setEditingService(null);
      setFormData({ ...initialForm });
      setImagePreview("");

      await fetchServices(true);
    } catch (error) {
      showNotification("error", getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE SERVICE
  // ==========================================

  const handleStatusToggle = async (service) => {
    if (updatingStatusId !== null) {
      return;
    }

    try {
      setUpdatingStatusId(service.id);

      const newStatus = !service.active;

      await updateServiceStatus(service.id, newStatus);

      setServices((previous) =>
        previous.map((item) =>
          item.id === service.id ? { ...item, active: newStatus } : item,
        ),
      );

      showNotification(
        "success",
        `"${service.title}" ${
          newStatus ? "activated" : "deactivated"
        } successfully.`,
      );
    } catch (error) {
      showNotification("error", getErrorMessage(error));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // ==========================================
  // OPEN DELETE CONFIRMATION
  // ==========================================

  const openDeleteModal = (service) => {
    setDeletingService(service);
    setShowDeleteModal(true);
  };

  // ==========================================
  // DELETE SERVICE
  // ==========================================

  const handleDelete = async () => {
    if (!deletingService || deleting) {
      return;
    }

    try {
      setDeleting(true);

      await deleteService(deletingService.id);

      setServices((previous) =>
        previous.filter((service) => service.id !== deletingService.id),
      );

      showNotification(
        "success",
        `"${deletingService.title}" deleted successfully.`,
      );

      setShowDeleteModal(false);
      setDeletingService(null);
    } catch (error) {
      const isProtected =
        error?.response?.status === 500 || error?.response?.status === 409;

      showNotification(
        "error",
        isProtected
          ? "This service may be linked to existing bookings. Try deactivating it instead."
          : getErrorMessage(error),
      );
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="as-page">
      <div className="as-container">
        {/* =====================================
            HEADER
        ===================================== */}

        <header className="as-header">
          <div>
            <span className="as-eyebrow">LENSCRAFT STUDIO</span>

            <h1>
              Services <span>Management</span>
            </h1>

            <p>
              Create, organize, and manage your photography services in one
              place.
            </p>
          </div>

          <div className="as-header-actions">
            <button
              type="button"
              className="as-refresh-btn"
              onClick={() => fetchServices(true)}
              disabled={refreshing}
              title="Refresh services"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "as-spinning" : ""}
              />
            </button>

            <button
              type="button"
              className="as-primary-btn"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add New Service
            </button>
          </div>
        </header>

        {/* =====================================
            STATISTICS
        ===================================== */}

        <section className="as-stats">
          <div className="as-stat-card">
            <div className="as-stat-icon">
              <Layers size={22} />
            </div>

            <div>
              <span>Total Services</span>
              <h2>{statistics.total}</h2>
            </div>
          </div>

          <div className="as-stat-card">
            <div className="as-stat-icon as-green">
              <CheckCircle2 size={22} />
            </div>

            <div>
              <span>Active Services</span>
              <h2>{statistics.active}</h2>
            </div>
          </div>

          <div className="as-stat-card">
            <div className="as-stat-icon as-red">
              <EyeOff size={22} />
            </div>

            <div>
              <span>Inactive Services</span>
              <h2>{statistics.inactive}</h2>
            </div>
          </div>

          <div className="as-stat-card">
            <div className="as-stat-icon">
              <Camera size={22} />
            </div>

            <div>
              <span>Services With Images</span>
              <h2>{statistics.withImages}</h2>
            </div>
          </div>
        </section>

        {/* =====================================
            SEARCH AND FILTER
        ===================================== */}

        <section className="as-toolbar">
          <div className="as-search-box">
            <Search size={19} />

            <input
              type="search"
              placeholder="Search photography services..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="as-filter-group">
            <button
              type="button"
              className={
                statusFilter === "all" ? "as-filter active" : "as-filter"
              }
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>

            <button
              type="button"
              className={
                statusFilter === "active" ? "as-filter active" : "as-filter"
              }
              onClick={() => setStatusFilter("active")}
            >
              Active
            </button>

            <button
              type="button"
              className={
                statusFilter === "inactive" ? "as-filter active" : "as-filter"
              }
              onClick={() => setStatusFilter("inactive")}
            >
              Inactive
            </button>
          </div>
        </section>

        {/* =====================================
            SERVICES CONTENT
        ===================================== */}

        {loading ? (
          <div className="as-state-box">
            <Loader2 size={38} className="as-spinning" />

            <h3>Loading Services...</h3>

            <p>Please wait while we fetch your photography services.</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="as-state-box">
            <Camera size={45} />

            <h3>No Services Found</h3>

            <p>
              {services.length === 0
                ? "You haven't added any photography services yet."
                : "No services match your current search or filter."}
            </p>

            {services.length === 0 && (
              <button
                type="button"
                className="as-primary-btn"
                onClick={openAddModal}
              >
                <Plus size={17} />
                Create First Service
              </button>
            )}
          </div>
        ) : (
          <section className="as-services-grid">
            {filteredServices.map((service) => (
              <article className="as-service-card" key={service.id}>
                {/* IMAGE */}

                <div className="as-service-image">
                  {service.image ? (
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="as-no-image">
                      <Camera size={44} />
                      <span>No Image Available</span>
                    </div>
                  )}

                  <span
                    className={
                      service.active
                        ? "as-status-badge active"
                        : "as-status-badge inactive"
                    }
                  >
                    {service.active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* SERVICE INFORMATION */}

                <div className="as-service-body">
                  <span className="as-service-id">SERVICE #{service.id}</span>

                  <h3>{service.title}</h3>

                  <p className="as-description">{service.description}</p>

                  <div className="as-service-price">
                    <IndianRupee size={18} />
                    <strong>{formatPrice(service.price)}</strong>
                  </div>

                  {/* ACTIONS */}

                  <div className="as-service-actions">
                    <button
                      type="button"
                      className="as-edit-btn"
                      onClick={() => openEditModal(service)}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="as-status-btn"
                      onClick={() => handleStatusToggle(service)}
                      disabled={updatingStatusId === service.id}
                    >
                      {updatingStatusId === service.id ? (
                        <Loader2 size={16} className="as-spinning" />
                      ) : service.active ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}

                      {service.active ? "Disable" : "Enable"}
                    </button>

                    <button
                      type="button"
                      className="as-delete-btn"
                      onClick={() => openDeleteModal(service)}
                      title="Delete service"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* =====================================
            ADD / EDIT MODAL
        ===================================== */}

        {showFormModal && (
          <div
            className="as-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeFormModal();
              }
            }}
          >
            <div
              className="as-modal as-form-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="as-form-title"
            >
              <div className="as-modal-header">
                <div>
                  <span className="as-eyebrow">SERVICE MANAGEMENT</span>

                  <h2 id="as-form-title">
                    {editingService
                      ? "Edit Photography Service"
                      : "Add Photography Service"}
                  </h2>
                </div>

                <button
                  type="button"
                  className="as-close-btn"
                  onClick={closeFormModal}
                  disabled={submitting}
                  aria-label="Close form"
                >
                  <X size={21} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="as-modal-body">
                  {/* SERVICE TITLE */}

                  <div className="as-form-field">
                    <label htmlFor="as-title">Service Title *</label>

                    <input
                      id="as-title"
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Wedding Photography"
                      maxLength={120}
                    />

                    {formErrors.title && (
                      <small className="as-field-error">
                        {formErrors.title}
                      </small>
                    )}
                  </div>

                  {/* DESCRIPTION */}

                  <div className="as-form-field">
                    <label htmlFor="as-description">Description *</label>

                    <textarea
                      id="as-description"
                      name="description"
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe your photography service..."
                    />

                    {formErrors.description && (
                      <small className="as-field-error">
                        {formErrors.description}
                      </small>
                    )}
                  </div>

                  {/* PRICE */}

                  <div className="as-form-field">
                    <label htmlFor="as-price">Service Price (₹) *</label>

                    <input
                      id="as-price"
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="25000.00"
                    />

                    {formErrors.price && (
                      <small className="as-field-error">
                        {formErrors.price}
                      </small>
                    )}
                  </div>

                  {/* IMAGE UPLOAD */}

                  <div className="as-form-field">
                    <label htmlFor="as-image">Service Image</label>

                    <div className="as-upload-box">
                      <ImagePlus size={30} />

                      <p>Upload a photography service image</p>

                      <span>JPG, PNG or WebP • Maximum 5 MB</span>

                      <input
                        id="as-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                      />
                    </div>

                    {formErrors.uploaded_image && (
                      <small className="as-field-error">
                        {formErrors.uploaded_image}
                      </small>
                    )}
                  </div>

                  {/* IMAGE URL */}

                  <div className="as-form-field">
                    <label htmlFor="as-image-url">Or External Image URL</label>

                    <input
                      id="as-image-url"
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={(event) => {
                        handleChange(event);

                        if (!formData.uploaded_image) {
                          setImagePreview(event.target.value);
                        }
                      }}
                      placeholder="https://example.com/photo.jpg"
                    />

                    {formErrors.image_url && (
                      <small className="as-field-error">
                        {formErrors.image_url}
                      </small>
                    )}
                  </div>

                  {/* IMAGE PREVIEW */}

                  {imagePreview && (
                    <div className="as-image-preview">
                      <img src={imagePreview} alt="Service preview" />
                    </div>
                  )}

                  {/* ACTIVE STATUS */}

                  <div className="as-active-control">
                    <div>
                      <strong>Service Availability</strong>

                      <p>Active services are visible to customers.</p>
                    </div>

                    <label className="as-switch">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleChange}
                      />

                      <span className="as-slider" />
                    </label>
                  </div>
                </div>

                {/* MODAL FOOTER */}

                <div className="as-modal-footer">
                  <button
                    type="button"
                    className="as-cancel-btn"
                    onClick={closeFormModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="as-primary-btn"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={17} className="as-spinning" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        {editingService ? "Save Changes" : "Create Service"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================
            DELETE CONFIRMATION MODAL
        ===================================== */}

        {showDeleteModal && deletingService && (
          <div className="as-modal-overlay">
            <div
              className="as-modal as-delete-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="as-delete-title"
            >
              <div className="as-delete-icon">
                <ShieldAlert size={32} />
              </div>

              <h2 id="as-delete-title">Delete Photography Service?</h2>

              <p>
                Are you sure you want to delete{" "}
                <strong>"{deletingService.title}"</strong>?
              </p>

              <p className="as-delete-warning">
                This action cannot be undone. Services linked to existing
                bookings should be deactivated instead.
              </p>

              <div className="as-delete-actions">
                <button
                  type="button"
                  className="as-cancel-btn"
                  onClick={() => {
                    if (!deleting) {
                      setShowDeleteModal(false);
                      setDeletingService(null);
                    }
                  }}
                  disabled={deleting}
                >
                  Keep Service
                </button>

                <button
                  type="button"
                  className="as-confirm-delete-btn"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={17} className="as-spinning" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={17} />
                      Delete Service
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================
            NOTIFICATION
        ===================================== */}

        {notification && (
          <div className={`as-notification ${notification.type}`} role="alert">
            {notification.type === "success" ? (
              <CheckCircle2 size={21} />
            ) : (
              <AlertCircle size={21} />
            )}

            <span>{notification.message}</span>

            <button
              type="button"
              onClick={() => setNotification(null)}
              aria-label="Dismiss notification"
            >
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
