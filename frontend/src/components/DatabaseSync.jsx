import React, { useState } from 'react';

export default function DatabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); 
  const [statusMessage, setStatusMessage] = useState("");

  const handleCloudBackup = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/admin/database/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        setSyncStatus("success");
        setStatusMessage("PostgreSQL data successfully mirrored to Firebase NoSQL.");
      } else {
        setSyncStatus("error");
        setStatusMessage(data.detail || "Failed to synchronize with Firebase.");
      }
    } catch (error) {
      setSyncStatus("error");
      setStatusMessage("Network error: Could not connect to the backend server.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudRecovery = async () => {
    const confirmRestore = window.confirm(
      "⚠️ DISASTER RECOVERY: This will pull the latest data from Firebase and overwrite your local PostgreSQL database. Do you want to proceed?"
    );
    
    if (!confirmRestore) return;

    setIsRestoring(true);
    setSyncStatus(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/admin/database/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to restore database.");
      }

      alert("✅ " + data.message);
      window.location.reload(); 

    } catch (error) {
      setSyncStatus("error");
      setStatusMessage("Recovery Failed: " + error.message);
      setIsRestoring(false);
    } 
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="px-8 py-6 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">cloud_sync</span>
            Cloud Database Synchronization
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Manage 1-to-1 data mirroring between PostgreSQL (Local) and Firebase Firestore (Cloud).
          </p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleCloudRecovery}
            disabled={isRestoring || isSyncing}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-600 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isRestoring ? 'hourglass_empty' : 'settings_backup_restore'}
            </span>
            {isRestoring ? 'Recovering...' : 'Emergency Cloud Recovery'}
          </button>

          <button 
            onClick={handleCloudBackup} 
            disabled={isSyncing || isRestoring}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                Syncing to Cloud...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">backup</span>
                Generate Cloud Snapshot
              </>
            )}
          </button>
        </div>
      </div>

      {syncStatus === "success" && (
        <div className="px-8 py-4 bg-emerald-50 border-t border-emerald-100 flex items-center gap-3 text-emerald-800">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span className="text-sm font-semibold">{statusMessage}</span>
        </div>
      )}
      {syncStatus === "error" && (
        <div className="px-8 py-4 bg-red-50 border-t border-red-100 flex items-center gap-3 text-red-800">
            <span className="material-symbols-outlined text-red-600">error</span>
            <span className="text-sm font-semibold">{statusMessage}</span>
        </div>
      )}
    </div>
  );
}