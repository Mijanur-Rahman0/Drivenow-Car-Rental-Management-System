import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import useAsync from '../../utils/useAsync';
import Spinner from '../../components/Spinner';
import { carImage, FALLBACK_IMAGE } from '../../utils/format';
import { ArrowLeft, Save, Upload } from 'lucide-react';

const EMPTY = {
  car_name: '',
  model: '',
  price: '',
  route: '',
  description: '',
  allow_custom_route: false,
  availability: true,
};

export default function AdminCarEdit() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [currentImage, setCurrentImage] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, loading, error } = useAsync(
    () => Promise.all([api.car(carId), api.routes()]),
    [carId]
  );

  useEffect(() => {
    if (data && data[0]) {
      const car = data[0];
      setForm({
        car_name: car.car_name || '',
        model: car.model || '',
        price: car.price || '',
        route: car.route || '',
        description: car.description || '',
        allow_custom_route: Boolean(car.allow_custom_route),
        availability: Boolean(car.availability),
      });
      setCurrentImage(carImage(car));
    }
  }, [data]);

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append('car_name', form.car_name.trim());
    fd.append('model', form.model.trim());
    fd.append('price', form.price);
    fd.append('route', form.route || '');
    fd.append('description', form.description.trim());
    fd.append('allow_custom_route', form.allow_custom_route);
    fd.append('availability', form.availability);

    if (fileRef.current?.files[0]) {
      fd.append('image_path', fileRef.current.files[0]);
    }

    try {
      await api.admin.updateCar(carId, fd);
      toast('Car details updated successfully!', 'success');
      navigate('/admin/cars');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="text-red-600">Error loading car: {error.message}</p>;
  if (loading || !data) return <Spinner />;

  const [, routes] = data;
  const field = 'w-full rounded border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/cars"
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cars
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Car Details</h1>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Car Image Preview */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-gray-700">Car Image</label>
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <img
                src={previewImage || currentImage || FALLBACK_IMAGE}
                alt="Car preview"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="h-32 w-48 rounded-lg border object-cover shadow-sm"
              />
              <div className="flex-1">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="car-image-input"
                />
                <label
                  htmlFor="car-image-input"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
                >
                  <Upload className="h-4 w-4" />
                  Choose New Image
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG, WEBP accepted. Leave unchanged to keep the current image.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Car Name *</label>
            <input
              className={field}
              placeholder="e.g. Toyota Corolla"
              value={form.car_name}
              onChange={set('car_name')}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Model *</label>
            <input
              className={field}
              placeholder="e.g. 2022"
              value={form.model}
              onChange={set('model')}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Price (BDT / day) *</label>
            <input
              className={field}
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 3500"
              value={form.price}
              onChange={set('price')}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">Assigned Route</label>
            <select className={field} value={form.route} onChange={set('route')}>
              <option value="">Select a Route (optional)</option>
              {routes.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-700">Description</label>
            <textarea
              rows={3}
              className={field}
              placeholder="Short description of the vehicle..."
              value={form.description}
              onChange={set('description')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={form.allow_custom_route}
                onChange={set('allow_custom_route')}
              />
              Allow Custom Route
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={form.availability}
                onChange={set('availability')}
              />
              Available for Booking
            </label>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
          <Link
            to="/admin/cars"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 shadow-sm"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving changes…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
