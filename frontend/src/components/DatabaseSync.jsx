import React, { useState, useEffect } from 'react';

export default function DatabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); 
  const [statusMessage, setStatusMessage] = useState("");
  
  // No more localStorage! We start empty and fetch from the real database.
  const [snapshots, setSnapshots] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // FETCH HISTORY ON LOAD
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/admin/database/backup/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data);
      }
    } catch (error) {
      console.error("Failed to load backup history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Run fetchHistory exactly once when the component loads
  useEffect(() => {
    fetchHistory();
  }, []);

  // HANDLE THE MANUAL BACKUP
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
        // Immediately fetch the fresh history from the database to update the table!
        fetchHistory(); 
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

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
      <div className="px-8 py-6 border-b border-slate-200 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">cloud_sync</span>
            Cloud Database Synchronization
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Manage 1-to-1 data mirroring between PostgreSQL (Local) and Firebase Firestore (Cloud).
          </p>
        </div>
        
        <button 
          onClick={handleCloudBackup} 
          disabled={isSyncing}
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

      {syncStatus === "success" && (
        <div className="px-8 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 text-emerald-800">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span className="text-sm font-semibold">{statusMessage}</span>
        </div>
      )}
      {syncStatus === "error" && (
        <div className="px-8 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-800">
            <span className="material-symbols-outlined text-red-600">error</span>
            <span className="text-sm font-semibold">{statusMessage}</span>
        </div>
      )}

      <div className="p-0 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">Snapshot ID</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">Date & Time</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">Trigger Type</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">Integrity</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingHistory ? (
              <tr>
                <td colSpan="5" className="px-8 py-8 text-center text-slate-400 font-medium">
                  <span className="material-symbols-outlined animate-spin mr-2 align-middle">refresh</span>
                  Loading audit logs from PostgreSQL...
                </td>
              </tr>
            ) : snapshots.length === 0 ? (
               <tr>
                <td colSpan="5" className="px-8 py-8 text-center text-slate-400 font-medium">
                  No cloud snapshots have been generated yet.
                </td>
              </tr>
            ) : (
              snapshots.map((snap, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 text-sm font-semibold text-slate-800 font-mono">{snap.id}</td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-700">
                      {snap.date} <span className="text-slate-400 ml-1">{snap.time}</span>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-slate-600">
                      <span className={`px-2 py-1 rounded-md text-[11px] uppercase tracking-wider font-bold ${snap.type.includes('Manual') ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                          {snap.type}
                      </span>
                  </td>
                  <td className="px-8 py-4 text-sm">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                          <span className="material-symbols-outlined text-[14px]">verified_user</span> {snap.status}
                      </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                      <button 
                          onClick={() => alert("Enterprise Safety Lock: Direct restoration requires root database privileges. Please contact the system administrator to mount this snapshot.")}
                          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1 ml-auto shadow-sm"
                      >
                          <span className="material-symbols-outlined text-[16px]">settings_backup_restore</span> Restore
                      </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}