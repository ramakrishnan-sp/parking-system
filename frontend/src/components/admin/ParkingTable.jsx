import { useState } from 'react'
import { CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { approveParking, removeParking } from '../../api/admin'
import Modal from '../common/Modal'

export default function ParkingTable({ spaces, onRefresh, mode = 'pending' }) {
  const [selected, setSelected] = useState(null)
  const [actionId, setActionId] = useState(null)

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await approveParking(id)
      toast.success('Parking space approved')
      onRefresh?.()
    } catch {} finally { setActionId(null) }
  }

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this parking space?')) return
    setActionId(id)
    try {
      await removeParking(id)
      toast.success('Parking space removed')
      onRefresh?.()
    } catch {} finally { setActionId(null) }
  }

  return (
    <>
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3">Title</th>
                <th className="text-left px-5 py-3 hidden md:table-cell">Owner</th>
                <th className="text-left px-5 py-3">Price/hr</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Vehicles</th>
                <th className="text-left px-5 py-3 hidden lg:table-cell">Submitted</th>
                <th className="text-left px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(spaces || []).map((ps) => (
                <tr key={ps.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-36">{ps.title}</p>
                      <p className="text-xs text-gray-500">{ps.total_slots} slots</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <p className="text-gray-700">{ps.owner?.full_name || '—'}</p>
                    <p className="text-xs text-gray-500">{ps.owner?.email}</p>
                  </td>
                  <td className="px-5 py-3 font-medium text-primary-700">₹{ps.price_per_hour}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="badge-gray">{ps.vehicle_type_allowed}</span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell text-gray-500 text-xs">
                    {format(new Date(ps.created_at), 'dd MMM yyyy')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(ps)}
                        className="btn-ghost text-xs py-1 px-2"
                      >
                        <Eye size={13} />
                      </button>
                      {mode === 'pending' && (
                        <button
                          onClick={() => handleApprove(ps.id)}
                          disabled={actionId === ps.id}
                          className="btn-ghost text-xs py-1 px-2 text-green-600 hover:bg-green-50"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(ps.id)}
                        disabled={actionId === ps.id}
                        className="btn-ghost text-xs py-1 px-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(spaces || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No parking spaces
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Parking Space Details"
        maxWidth="max-w-2xl"
      >
        {selected && (
          <div className="space-y-4">
            {/* Photo grid */}
            {selected.photos?.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {selected.photos.map((p) => (
                  <img key={p.id} src={p.photo_url} alt="" className="rounded-xl h-28 w-full object-cover" />
                ))}
              </div>
            )}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Title',       selected.title],
                ['Price/hr',    `₹${selected.price_per_hour}`],
                ['Slots',       selected.total_slots],
                ['Vehicle',     selected.vehicle_type_allowed],
                ['Property',    selected.property_type || '—'],
                ['Description', selected.description || '—'],
                ['Amenities',   selected.amenities?.join(', ') || '—'],
                ['Masked Lat',  selected.public_latitude],
                ['Masked Lng',  selected.public_longitude],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-gray-500 mb-0.5">{k}</dt>
                  <dd className="font-medium text-gray-900 break-all">{v}</dd>
                </div>
              ))}
            </dl>
            {mode === 'pending' && (
              <button
                onClick={() => { handleApprove(selected.id); setSelected(null) }}
                className="btn-primary w-full"
              >
                Approve this space
              </button>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
