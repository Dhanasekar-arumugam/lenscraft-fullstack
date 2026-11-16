    import { useCallback, useEffect, useMemo, useState } from "react";
    import {
    Plus,
    Search,
    Pencil,
    Trash2,
    X,
    Camera,
    RefreshCw,
    ImagePlus,
    Save,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Info,
    ShieldOff,
    Trash2 as DeletedIcon,
    Sparkles,
    } from "lucide-react";

    import {
    getAdminPackages,
    createPackage,
    updatePackage,
    deletePackage,
    updatePackageStatus,
    } from "../../api/packageService";

    import "../../styles/AdminPackages.css";

    const emptyForm = {
    name: "",
    description: "",
    starting_price: "",
    duration: "",
    is_active: true,
    uploaded_image: null,
    };

    const formatPrice = (price) => `₹${Number(price || 0).toLocaleString("en-IN")}`;

    function getErrorMessage(error) {
    const data = error.response?.data;

    if (!data) {
        return error.message || "Something went wrong.";
    }

    if (typeof data === "string") return data;

    if (data.detail) return String(data.detail);

    return Object.entries(data)
        .map(([field, messages]) => {
        const message = Array.isArray(messages)
            ? messages.join(", ")
            : String(messages);

        return `${field}: ${message}`;
        })
        .join(" | ");
    }

    export default function AdminPackages() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);

    const [form, setForm] = useState(emptyForm);
    const [preview, setPreview] = useState("");

    const [deletingPackage, setDeletingPackage] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const [toast, setToast] = useState(null);
    const [error, setError] = useState("");

    const notify = (type, title, description) => {
        setToast({ type, title, description, id: Date.now() });
    };

    useEffect(() => {
        if (!toast) return;
        const timeout = setTimeout(() => setToast(null), 4500);
        return () => clearTimeout(timeout);
    }, [toast]);

    const fetchPackages = useCallback(async () => {
        try {
        setLoading(true);
        setError("");

        const data = await getAdminPackages();

        const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
            ? data.results
            : [];

        setPackages(list);
        } catch (err) {
        setError(getErrorMessage(err));
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        document.title = "Manage Packages | Lenscraft Studio";
        fetchPackages();
    }, [fetchPackages]);

    useEffect(() => {
        if (!(form.uploaded_image instanceof File)) return;

        const url = URL.createObjectURL(form.uploaded_image);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [form.uploaded_image]);

    const filteredPackages = useMemo(() => {
        return packages.filter((pkg) => {
        const matchesSearch = pkg.name
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesFilter =
            filter === "all" ||
            (filter === "active" && pkg.is_active) ||
            (filter === "inactive" && !pkg.is_active);

        return matchesSearch && matchesFilter;
        });
    }, [packages, search, filter]);

    const activeCount = packages.filter((pkg) => pkg.is_active).length;

    const openCreate = () => {
        setEditingPackage(null);
        setForm({ ...emptyForm });
        setPreview("");
        setError("");
        setModalOpen(true);
    };

    const openEdit = (pkg) => {
        setEditingPackage(pkg);

        setForm({
        name: pkg.name || "",
        description: pkg.description || "",
        starting_price: pkg.starting_price ?? "",
        duration: pkg.duration || "",
        is_active: pkg.is_active,
        uploaded_image: null,
        });

        setPreview(pkg.image_url || "");
        setError("");
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingPackage(null);
        setForm({ ...emptyForm });
        setPreview("");
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
        ...previous,
        [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleImage = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowed = ["image/jpeg", "image/png", "image/webp"];

        if (!allowed.includes(file.type)) {
        setError("Select a JPG, PNG, or WebP image.");
        event.target.value = "";
        return;
        }

        if (file.size > 5 * 1024 * 1024) {
        setError("Image must be smaller than 5 MB.");
        event.target.value = "";
        return;
        }

        setError("");

        setForm((previous) => ({
        ...previous,
        uploaded_image: file,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.name.trim() || !form.description.trim()) {
        setError("Package name and description are required.");
        return;
        }

        if (form.starting_price === "" || Number(form.starting_price) < 0) {
        setError("Enter a valid starting price.");
        return;
        }

        try {
        setSaving(true);
        setError("");

        if (editingPackage) {
            await updatePackage(editingPackage.id, form);
            notify(
            "success",
            "Beautifully updated",
            `“${form.name}” has a fresh new look.`,
            );
        } else {
            await createPackage(form);
            notify(
            "success",
            form.is_active
                ? "Ready for the spotlight"
                : "Saved behind the scenes",
            `“${form.name}” is ${form.is_active ? "now visible on the website" : "saved as inactive"}.`,
            );
        }

        setModalOpen(false);
        setEditingPackage(null);
        setForm({ ...emptyForm });
        setPreview("");

        await fetchPackages();
        } catch (err) {
        setError(getErrorMessage(err));
        } finally {
        setSaving(false);
        }
    };

    const handleStatus = async (pkg) => {
        try {
        setBusyId(pkg.id);
        setError("");

        await updatePackageStatus(pkg.id, !pkg.is_active);

        setPackages((previous) =>
            previous.map((item) =>
            item.id === pkg.id ? { ...item, is_active: !pkg.is_active } : item,
            ),
        );

        notify(
            pkg.is_active ? "warning" : "success",
            pkg.is_active ? "Moved behind the curtain" : "Back in the spotlight",
            `“${pkg.name}” ${pkg.is_active ? "will no longer appear on the public Services page." : "is now available on the public Services page."}`,
        );
        } catch (err) {
        setError(getErrorMessage(err));
        } finally {
        setBusyId(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingPackage) return;

        try {
        setBusyId(deletingPackage.id);
        setError("");

        await deletePackage(deletingPackage.id);

        setPackages((previous) =>
            previous.filter((pkg) => pkg.id !== deletingPackage.id),
        );

        setDeletingPackage(null);
        notify(
            "deleted",
            "Package removed",
            `“${deletingPackage.name}” has been permanently deleted.`,
        );
        } catch (err) {
        setError(getErrorMessage(err));
        setDeletingPackage(null);
        } finally {
        setBusyId(null);
        }
    };

    return (
        <main className="ap-page">
        <div className="ap-container">
            <header className="ap-header">
            <div>
                <p className="ap-eyebrow">LENSCRAFT STUDIO</p>
                <h1>
                Photography <span>Packages</span>
                </h1>
                <p>
                Create and manage photography packages available to your
                customers.
                </p>
            </div>

            <button className="ap-primary" onClick={openCreate}>
                <Plus size={18} />
                Add Package
            </button>
            </header>

            <div className="ap-stats">
            <div className="ap-stat">
                <span>Total Packages</span>
                <strong>{packages.length}</strong>
            </div>

            <div className="ap-stat">
                <span>Active Packages</span>
                <strong>{activeCount}</strong>
            </div>

            <div className="ap-stat">
                <span>Inactive Packages</span>
                <strong>{packages.length - activeCount}</strong>
            </div>
            </div>

            {toast && !error && (
            <div
                key={toast.id}
                className={`ap-toast ap-toast--${toast.type}`}
                role="status"
                aria-live="polite"
            >
                <span className="ap-toast-glow" aria-hidden="true" />
                <div className="ap-toast-icon">
                {toast.type === "success" ? (
                    <Sparkles size={24} strokeWidth={1.8} />
                ) : toast.type === "warning" ? (
                    <ShieldOff size={24} strokeWidth={1.8} />
                ) : toast.type === "deleted" ? (
                    <DeletedIcon size={24} strokeWidth={1.8} />
                ) : (
                    <Info size={24} strokeWidth={1.8} />
                )}
                </div>
                <div className="ap-toast-copy">
                <span className="ap-toast-kicker">LENSCRAFT · STUDIO UPDATE</span>
                <strong>{toast.title}</strong>
                <p>{toast.description}</p>
                </div>
                <button
                className="ap-toast-close"
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss notification"
                >
                <X size={17} />
                </button>
                <span className="ap-toast-progress" aria-hidden="true" />
            </div>
            )}

            {error && (
            <div className="ap-toast ap-toast--error" role="alert">
                <span className="ap-toast-glow" aria-hidden="true" />
                <div className="ap-toast-icon">
                <AlertTriangle size={24} strokeWidth={1.8} />
                </div>
                <div className="ap-toast-copy">
                <span className="ap-toast-kicker">
                    LENSCRAFT · ATTENTION NEEDED
                </span>
                <strong>That didn't go as planned</strong>
                <p>{error}</p>
                </div>
                <button
                className="ap-toast-close"
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
                >
                <X size={17} />
                </button>
            </div>
            )}

            <div className="ap-toolbar">
            <div className="ap-search">
                <Search size={18} />
                <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search photography packages..."
                />
            </div>

            <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
            >
                <option value="all">All Packages</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>

            <button
                className="ap-icon-button"
                onClick={fetchPackages}
                title="Refresh packages"
            >
                <RefreshCw size={19} />
            </button>
            </div>

            {loading ? (
            <div className="ap-empty">
                <Loader2 className="ap-spin" size={32} />
                <p>Loading packages...</p>
            </div>
            ) : filteredPackages.length === 0 ? (
            <div className="ap-empty">
                <Camera size={42} />
                <h3>No packages found</h3>
                <p>Add a package or adjust your search.</p>
            </div>
            ) : (
            <div className="ap-grid">
                {filteredPackages.map((pkg) => (
                <article className="ap-card" key={pkg.id}>
                    <div className="ap-card-image">
                    {pkg.image_url ? (
                        <img src={pkg.image_url} alt={pkg.name} loading="lazy" />
                    ) : (
                        <div className="ap-no-image">
                        <Camera size={42} />
                        </div>
                    )}

                    <span
                        className={`ap-badge ${
                        pkg.is_active ? "active" : "inactive"
                        }`}
                    >
                        {pkg.is_active ? "Active" : "Inactive"}
                    </span>
                    </div>

                    <div className="ap-card-content">
                    <h3>{pkg.name}</h3>

                    <p className="ap-description">{pkg.description}</p>

                    <div className="ap-details">
                        <span>{pkg.duration || "Flexible duration"}</span>

                        <strong>{formatPrice(pkg.starting_price)}</strong>
                    </div>

                    <div className="ap-card-actions">
                        <button
                        onClick={() => openEdit(pkg)}
                        disabled={busyId === pkg.id}
                        >
                        <Pencil size={16} />
                        Edit
                        </button>

                        <button
                        onClick={() => handleStatus(pkg)}
                        disabled={busyId === pkg.id}
                        >
                        {pkg.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                        className="ap-danger-button"
                        onClick={() => setDeletingPackage(pkg)}
                        disabled={busyId === pkg.id}
                        aria-label={`Delete ${pkg.name}`}
                        >
                        <Trash2 size={17} />
                        </button>
                    </div>
                    </div>
                </article>
                ))}
            </div>
            )}
        </div>

        {modalOpen && (
            <div className="ap-overlay">
            <div
                className="ap-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ap-modal-title"
            >
                <div className="ap-modal-header">
                <h2 id="ap-modal-title">
                    {editingPackage
                    ? "Edit Photography Package"
                    : "Add Photography Package"}
                </h2>

                <button onClick={closeModal} disabled={saving} aria-label="Close">
                    <X size={22} />
                </button>
                </div>

                <form onSubmit={handleSubmit}>
                <label>
                    Package Name *
                    <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Premium Wedding Package"
                    required
                    />
                </label>

                <label>
                    Description *
                    <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe what this package includes..."
                    required
                    />
                </label>

                <div className="ap-form-row">
                    <label>
                    Starting Price (₹) *
                    <input
                        name="starting_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.starting_price}
                        onChange={handleChange}
                        required
                    />
                    </label>

                    <label>
                    Duration
                    <input
                        name="duration"
                        value={form.duration}
                        onChange={handleChange}
                        placeholder="8 Hours"
                    />
                    </label>
                </div>

                <label>
                    Package Image
                    <div className="ap-upload">
                    <ImagePlus size={24} />

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImage}
                    />

                    <small>JPG, PNG, WebP · Max 5 MB</small>
                    </div>
                </label>

                {preview && (
                    <img
                    className="ap-preview"
                    src={preview}
                    alt="Package preview"
                    />
                )}

                <label className="ap-checkbox">
                    <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    />
                    Make this package visible to customers
                </label>

                <div className="ap-modal-actions">
                    <button
                    type="button"
                    className="ap-secondary"
                    onClick={closeModal}
                    disabled={saving}
                    >
                    Cancel
                    </button>

                    <button type="submit" className="ap-primary" disabled={saving}>
                    {saving ? (
                        <Loader2 className="ap-spin" size={18} />
                    ) : (
                        <Save size={18} />
                    )}

                    {saving
                        ? "Saving..."
                        : editingPackage
                        ? "Update Package"
                        : "Create Package"}
                    </button>
                </div>
                </form>
            </div>
            </div>
        )}

        {deletingPackage && (
            <div className="ap-overlay">
            <div
                className="ap-confirm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ap-delete-title"
            >
                <Trash2 size={34} />

                <h2 id="ap-delete-title">Delete Package?</h2>

                <p>
                Are you sure you want to delete{" "}
                <strong>{deletingPackage.name}</strong>? This action cannot be
                undone.
                </p>

                <div className="ap-modal-actions">
                <button
                    className="ap-secondary"
                    onClick={() => setDeletingPackage(null)}
                    disabled={busyId !== null}
                >
                    Cancel
                </button>

                <button
                    className="ap-delete-confirm"
                    onClick={handleDelete}
                    disabled={busyId !== null}
                >
                    {busyId !== null ? "Deleting..." : "Delete Package"}
                </button>
                </div>
            </div>
            </div>
        )}
        </main>
    );
    }
