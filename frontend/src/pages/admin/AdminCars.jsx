import { useRef, useState } from 'react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import useAsync from '../../utils/useAsync';
import Spinner from '../../components/Spinner';
import { CarsTable, useAdminActions } from './adminShared';

const EMPTY = { car_name: '', model: '', price: '', route: '', description: '', allow_custom_route: false, availability: true };

export default function AdminCars() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsync(() => Promise.all([api.admin.cars(), api.routes()]), []);
  const actions = useAdminActions(reload);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries({ ...form, car_name: form.car_name.trim(), model: form.model.trim(), description: form.description.trim() })
      .forEach(([k, v]) => fd.append(k, v));
    if (fileRef.current?.files[0]) fd.append('image_path', fileRef.current.files[0]);
    try {
      const car = await api.admin.createCar(fd);
      toast(`Car "${car.car_name}" added successfully!`, 'success');
      setForm(EMPTY);
      if (fileRef.current) fileRef.current.value = '';
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="text-red-600">{error.message}</p>;
  if (!data) return loading ? <Spinner /> : null;
  const [cars, routes] = data;
  const field = 'w-full rounded border p-2';

  return (
    <>
      <form onSubmit={onSubmit} className="mb-6 rounded bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add a car</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input className={field} placeholder="Car Name" value={form.car_name} onChange={set('car_name')} required />
          <input className={field} placeholder="Car Model" value={form.model} onChange={set('model')} required />
          <input className={field} type="number" step="0.01" min="0" placeholder="Price BDT / day" value={form.price} onChange={set('price')} required />
          <select className={field} value={form.route} onChange={set('route')}>
            <option value="">Select a Route (optional)</option>
            {routes.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <input className={`${field} md:col-span-2`} placeholder="Short description (optional)" value={form.description} onChange={set('description')} />
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.allow_custom_route} onChange={set('allow_custom_route')} /> Allow Custom Route</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.availability} onChange={set('availability')} /> Available</label>
          <input ref={fileRef} type="file" accept="image/*" className={`${field} md:col-span-2`} />
        </div>
        <button type="submit" disabled={saving} className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? 'Adding…' : 'Add Car'}
        </button>
      </form>
      <CarsTable cars={cars} actions={actions} withImage />
    </>
  );
}
