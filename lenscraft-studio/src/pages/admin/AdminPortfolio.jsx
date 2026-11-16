import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Save,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getPortfolioPhotos,
  uploadPortfolioPhotos,
  updatePortfolioPhoto,
  deletePortfolioPhoto,
} from "../../api/portfolioService";

import "../../styles/AdminPortfolio.css";

const CATEGORIES = [
  { value: "wedding", label: "Wedding" },
  { value: "portrait", label: "Portrait" },
  { value: "fashion", label: "Fashion" },
  { value: "event", label: "Event" },
  { value: "product", label: "Product" },
  { value: "other", label: "Other" },
];

const normalizeResults = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;

  if (data && typeof data === "object") {
    const first = Object.values(data)[0];

    if (typeof first === "string") return first;
    if (Array.isArray(first)) return first.join(" ");
  }

  return error?.message || "Something went wrong.";
};

const createInitialForm = () => ({
  title: "",
  description: "",
  category: "wedding",
  featured: false,
});

export default function AdminPortfolio() {
  const fileInputRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [form, setForm] = useState(createInitialForm);
  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPhotos = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getPortfolioPhotos();
      setPhotos(normalizeResults(data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Manage Portfolio | Lenscraft";
    loadPhotos();
  }, [loadPhotos]);

  // ==========================================
  // FILE PREVIEWS
  // ==========================================

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));

    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFileSelect = (event) => {
    const selected = Array.from(event.target.files || []);

    if (!selected.length) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (selected.length > 20) {
      setError("You can upload a maximum of 20 photos.");
      event.target.value = "";
      return;
    }

    const invalid = selected.find(
      (file) =>
        !allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024,
    );

    if (invalid) {
      setError("Only JPG, PNG and WebP images up to 10 MB are allowed.");
      event.target.value = "";
      return;
    }

    setFiles(selected);
    setError("");
    setSuccess("");
    event.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setFiles((previous) => previous.filter((_, current) => current !== index));
  };

  // ==========================================
  // UPLOAD PHOTOS
  // ==========================================

  const handleUpload = async (event) => {
    event.preventDefault();

    if (uploading) return;

    if (!files.length) {
      setError("Please select at least one photograph.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");
    setSuccess("");

    try {
      const response = await uploadPortfolioPhotos(
        files,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          featured: form.featured,
        },
        setProgress,
      );

      setSuccess(response?.message || "Photos uploaded successfully.");

      setFiles([]);
      setForm(createInitialForm());

      await loadPhotos();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // EDIT PHOTO
  // ==========================================

  const openEdit = (photo) => {
    setEditing({
      id: photo.id,
      title: photo.title,
      description: photo.description || "",
      category: photo.category,
      featured: photo.featured,
      is_active: photo.is_active,
      display_order: photo.display_order,
    });

    setError("");
    setSuccess("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!editing || saving) return;

    if (!editing.title.trim()) {
      setError("Photo title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updatePortfolioPhoto(editing.id, {
        title: editing.title.trim(),
        description: editing.description,
        category: editing.category,
        featured: editing.featured,
        is_active: editing.is_active,
        display_order: editing.display_order,
      });

      setEditing(null);
      setSuccess("Photo updated successfully.");
      await loadPhotos();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // QUICK FEATURE TOGGLE
  // ==========================================

  const toggleFeatured = async (photo) => {
    if (updatingId !== null) return;

    setUpdatingId(photo.id);
    setError("");

    try {
      await updatePortfolioPhoto(photo.id, {
        featured: !photo.featured,
      });

      setPhotos((previous) =>
        previous.map((item) =>
          item.id === photo.id ? { ...item, featured: !photo.featured } : item,
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================
  // DELETE PHOTO
  // ==========================================

  const handleDelete = async (photo) => {
    if (deletingId !== null) return;

    const confirmed = window.confirm(`Permanently delete "${photo.title}"?`);

    if (!confirmed) return;

    setDeletingId(photo.id);
    setError("");
    setSuccess("");

    try {
      await deletePortfolioPhoto(photo.id);

      setPhotos((previous) => previous.filter((item) => item.id !== photo.id));

      setSuccess("Photo deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="admin-portfolio-page">
      <div className="admin-portfolio-container">
        {/* HEADER */}

        <header className="admin-portfolio-header">
          <div>
            <Link to="/admin/dashboard" className="admin-portfolio-back">
              <ArrowLeft size={17} />
              Back to Dashboard
            </Link>

            <span className="admin-portfolio-kicker">
              LENSCRAFT / CONTENT MANAGEMENT
            </span>

            <h1>
              Portfolio <em>Manager.</em>
            </h1>

            <p>Upload, organize and manage your photography collection.</p>
          </div>

          <Link to="/portfolio" className="admin-portfolio-view">
            View Public Gallery
          </Link>
        </header>

        {/* STATS */}

        <div className="admin-portfolio-stats">
          <div>
            <span>Total Photos</span>
            <strong>{photos.length}</strong>
          </div>

          <div>
            <span>Published</span>
            <strong>{photos.filter((photo) => photo.is_active).length}</strong>
          </div>

          <div>
            <span>Featured</span>
            <strong>{photos.filter((photo) => photo.featured).length}</strong>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="admin-portfolio-alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-portfolio-alert success" role="status">
            <CheckCircle2 size={17} />
            {success}
          </div>
        )}

        {/* UPLOAD SECTION */}

        <section className="admin-portfolio-panel">
          <div className="admin-portfolio-panel-heading">
            <div>
              <span>01 / ADD NEW PHOTOS</span>
              <h2>Upload Photographs</h2>
            </div>

            <ImagePlus size={25} />
          </div>

          <form onSubmit={handleUpload}>
            <div
              className="admin-portfolio-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={35} />

              <h3>Choose your photographs</h3>

              <p>
                Select up to 20 JPG, PNG or WebP images. Maximum 10 MB each.
              </p>

              <span className="admin-portfolio-choose">Browse Files</span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                disabled={uploading}
                onChange={handleFileSelect}
                onClick={(event) => event.stopPropagation()}
                aria-label="Select portfolio photographs"
              />
            </div>

            {/* PREVIEW */}

            {files.length > 0 && (
              <div className="admin-portfolio-preview">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="admin-portfolio-preview-item"
                  >
                    <img src={previews[index]} alt={file.name} />

                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      disabled={uploading}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* FORM */}

            <div className="admin-portfolio-fields">
              <label>
                Photo Title (optional for bulk upload)
                <input
                  type="text"
                  placeholder="e.g. Timeless Wedding Moments"
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Photography Category
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value,
                    })
                  }
                >
                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-portfolio-wide">
                Description (optional)
                <textarea
                  rows={3}
                  placeholder="Tell the story behind these photographs..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label className="admin-portfolio-checkbox">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) =>
                  setForm({
                    ...form,
                    featured: event.target.checked,
                  })
                }
              />
              Mark uploaded photographs as featured
            </label>

            {uploading && (
              <div className="admin-portfolio-progress">
                <div>
                  <span>Uploading photographs...</span>
                  <strong>{progress}%</strong>
                </div>

                <div className="admin-portfolio-progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="admin-portfolio-primary"
              disabled={uploading || files.length === 0}
            >
              {uploading ? (
                <>
                  <LoaderCircle className="admin-portfolio-spin" size={18} />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  Upload {files.length || ""} Photos
                </>
              )}
            </button>
          </form>
        </section>

        {/* EXISTING PHOTOS */}

        <section className="admin-portfolio-panel">
          <div className="admin-portfolio-panel-heading">
            <div>
              <span>02 / YOUR COLLECTION</span>
              <h2>Manage Photographs</h2>
            </div>

            <button
              type="button"
              className="admin-portfolio-refresh"
              onClick={loadPhotos}
              disabled={loading}
              aria-label="Refresh photographs"
            >
              <RefreshCw size={19} />
            </button>
          </div>

          {loading ? (
            <div className="admin-portfolio-empty">
              <LoaderCircle className="admin-portfolio-spin" size={30} />
              <p>Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="admin-portfolio-empty">
              <Camera size={38} />
              <h3>No photographs uploaded</h3>
              <p>Your uploaded photos will appear here.</p>
            </div>
          ) : (
            <div className="admin-portfolio-grid">
              {photos.map((photo) => (
                <article key={photo.id} className="admin-portfolio-photo-card">
                  <div className="admin-portfolio-photo-image">
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      loading="lazy"
                    />

                    {!photo.is_active && (
                      <span className="admin-portfolio-hidden">HIDDEN</span>
                    )}
                  </div>

                  <div className="admin-portfolio-photo-info">
                    <h3>{photo.title}</h3>

                    <span>
                      {CATEGORIES.find((item) => item.value === photo.category)
                        ?.label || photo.category}
                    </span>

                    <div className="admin-portfolio-actions">
                      <button
                        type="button"
                        className={photo.featured ? "featured" : ""}
                        onClick={() => toggleFeatured(photo)}
                        disabled={updatingId !== null}
                        title="Toggle featured"
                        aria-label={
                          photo.featured
                            ? "Remove featured status"
                            : "Mark as featured"
                        }
                      >
                        <Star
                          size={17}
                          fill={photo.featured ? "currentColor" : "none"}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(photo)}
                        title="Edit photo"
                        aria-label={`Edit ${photo.title}`}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        onClick={() => handleDelete(photo)}
                        disabled={deletingId !== null}
                        title="Delete photo"
                        aria-label={`Delete ${photo.title}`}
                      >
                        {deletingId === photo.id ? (
                          <LoaderCircle
                            className="admin-portfolio-spin"
                            size={17}
                          />
                        ) : (
                          <Trash2 size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* EDIT MODAL */}

      {editing && (
        <div
          className="admin-portfolio-modal-overlay"
          onClick={() => setEditing(null)}
        >
          <div
            className="admin-portfolio-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit portfolio photograph"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-portfolio-modal-header">
              <h2>Edit Photograph</h2>

              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close editor"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <label>
                Photo Title
                <input
                  required
                  value={editing.title}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      title: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Description
                <textarea
                  rows={3}
                  value={editing.description}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      description: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Category
                <select
                  value={editing.category}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      category: event.target.value,
                    })
                  }
                >
                  {CATEGORIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Display Order
                <input
                  type="number"
                  min="0"
                  value={editing.display_order}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      display_order: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label className="admin-portfolio-checkbox">
                <input
                  type="checkbox"
                  checked={editing.featured}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      featured: event.target.checked,
                    })
                  }
                />
                Featured Photograph
              </label>

              <label className="admin-portfolio-checkbox">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      is_active: event.target.checked,
                    })
                  }
                />
                Visible to Visitors
              </label>

              <button
                type="submit"
                className="admin-portfolio-primary"
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle className="admin-portfolio-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
