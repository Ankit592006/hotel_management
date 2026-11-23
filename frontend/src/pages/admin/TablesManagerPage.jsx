import React, { useState, useEffect } from 'react';
import {
  Plus,
  Download,
  Printer,
  QrCode,
  Users,
  ExternalLink,
  Trash2,
  X
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastProvider';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useModalBehavior } from '../../hooks/useModalBehavior';

export const TablesManagerPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [modalError, setModalError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useModalBehavior(isAddModalOpen, () => setIsAddModalOpen(false));

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.getTables();
      if (res.success) {
        setTables(res.data);
      }
    } catch (err) {
      toast.error('Failed to load dining tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      if (!newTableNumber) throw new Error('Table number is required');
      const res = await api.createTable({
        tableNumber: Number(newTableNumber),
        capacity: Number(newCapacity)
      });
      if (res.success) {
        setTables((prev) => [...prev, res.data].sort((a, b) => a.tableNumber - b.tableNumber));
        setIsAddModalOpen(false);
        setNewTableNumber('');
        toast.success(`Table #${res.data.tableNumber} created with QR code`);
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create table');
    }
  };

  const handleUpdateStatus = async (tableNumber, newStatus) => {
    try {
      const res = await api.updateTableStatus(tableNumber, newStatus);
      if (res.success) {
        setTables((prev) =>
          prev.map((t) => (t.tableNumber === tableNumber ? { ...t, status: newStatus } : t))
        );
        toast.info(`Table #${tableNumber} set to ${newStatus}`);
      }
    } catch (err) {
      toast.error(`Failed to update table status: ${err.message}`);
    }
  };

  const handleDeleteTable = async (tableNumber) => {
    try {
      const res = await api.deleteTable(tableNumber);
      if (res.success) {
        setTables((prev) => prev.filter((t) => t.tableNumber !== tableNumber));
        toast.success(`Table #${tableNumber} deleted`);
      }
    } catch (err) {
      toast.error(`Failed to delete table: ${err.message}`);
    }
  };

  const handleDownloadQR = (table) => {
    const link = document.createElement('a');
    link.href = table.qrCodeDataUrl;
    link.download = `SmartServe_Table_${table.tableNumber}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintTableStand = (table) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print table stands.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SmartServe - Table ${table.tableNumber} Stand</title>
          <style>
            body {
              font-family: 'Outfit', sans-serif, -apple-system;
              text-align: center;
              padding: 40px;
              background: #fff;
              color: #0f172a;
            }
            .card {
              max-width: 380px;
              margin: 0 auto;
              border: 3px solid #0f172a;
              border-radius: 20px;
              padding: 30px 20px;
            }
            h1 { margin: 0; font-size: 26px; }
            .badge {
              display: inline-block;
              background: #f59e0b;
              color: #0f172a;
              font-weight: 800;
              font-size: 22px;
              padding: 6px 18px;
              border-radius: 999px;
              margin: 15px 0;
            }
            img { width: 220px; height: 220px; margin: 15px 0; }
            p { font-size: 14px; color: #475569; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🍽️ SmartServe</h1>
            <p>Scan to Browse Menu & Pay Online</p>
            <div class="badge">TABLE #${table.tableNumber}</div>
            <br/>
            <img src="${table.qrCodeDataUrl}" alt="Table QR" />
            <p><strong>Point your camera or UPI scanner</strong></p>
            <p style="font-size: 11px; word-break: break-all;">${table.tableUrl}</p>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusSelectStyle = (status) => {
    if (status === 'occupied') {
      return {
        background: 'rgba(239, 68, 68, 0.16)',
        color: '#f87171',
        border: '1px solid rgba(239, 68, 68, 0.34)'
      };
    }
    if (status === 'reserved') {
      return {
        background: 'rgba(245, 158, 11, 0.16)',
        color: '#fbbf24',
        border: '1px solid rgba(245, 158, 11, 0.34)'
      };
    }
    return {
      background: 'rgba(34, 197, 94, 0.16)',
      color: 'var(--veg-color)',
      border: '1px solid rgba(34, 197, 94, 0.34)'
    };
  };

  return (
    <div>
      {/* Header & Add Button */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tables & QR Code Center</h1>
          <p className="page-subtitle">Manage dining tables, print tabletop QR stands, and monitor occupancy</p>
        </div>

        {isAdmin && (
          <button type="button" className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            <span>Add New Table</span>
          </button>
        )}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading dining tables...
        </div>
      ) : tables.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <QrCode size={42} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
          <h3>No tables registered</h3>
          <p style={{ fontSize: '13px', marginTop: '6px' }}>Click "Add New Table" to generate table QR codes.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: '16px'
          }}
        >
          {tables.map((table) => (
            <div
              key={table._id}
              className="glass-panel"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '14px',
                backgroundColor: 'rgba(20, 28, 48, 0.88)'
              }}
            >
              {/* Table Header */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Seats {table.capacity}</span>
                </div>

                <select
                  aria-label={`Table ${table.tableNumber} status`}
                  value={table.status}
                  onChange={(e) => handleUpdateStatus(table.tableNumber, e.target.value)}
                  style={{
                    ...getStatusSelectStyle(table.status),
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              {/* Table Number Title */}
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Table #{table.tableNumber}</h3>
                <a
                  href={`/table/${table.tableNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--accent-primary)',
                    marginTop: '3px'
                  }}
                >
                  <span>Open Customer View</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* QR Code Container */}
              <div
                style={{
                  background: '#ffffff',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  width: '176px',
                  height: '176px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img
                  src={table.qrCodeDataUrl}
                  alt={`QR Code for Table ${table.tableNumber}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleDownloadQR(table)}
                  style={{ fontSize: '12px', padding: '8px' }}
                  title="Download PNG for menu card printing"
                >
                  <Download size={14} />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handlePrintTableStand(table)}
                  style={{ fontSize: '12px', padding: '8px', background: 'rgba(245, 158, 11, 0.14)', color: 'var(--accent-primary)', borderColor: 'rgba(245, 158, 11, 0.34)' }}
                  title="Print tabletop tent card stand"
                >
                  <Printer size={14} />
                  <span>Print Stand</span>
                </button>
              </div>

              {isAdmin && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(table.tableNumber)}
                    style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px' }}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Table Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)} role="dialog" aria-modal="true" aria-label="Add restaurant table">
          <div className="modal-panel animate-fade-in" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Add Restaurant Table</h2>
              <button type="button" className="btn-icon" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTable}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {modalError && (
                  <div role="alert" style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', fontSize: '13px' }}>
                    {modalError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Table Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field"
                    placeholder="e.g. 9"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field"
                    placeholder="e.g. 4"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate Table & QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Dining Table?"
        message={`Are you sure you want to delete Table #${deleteTarget} and invalidate its QR stand?`}
        confirmLabel="Delete Table"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const num = deleteTarget;
          setDeleteTarget(null);
          if (num !== null) handleDeleteTable(num);
        }}
      />
    </div>
  );
};
