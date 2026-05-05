import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const data = await documentAPI.getAll();
      setDocuments(data);
    } catch (err) {
      setError('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await documentAPI.upload(formData);
      await fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await documentAPI.delete(id);
      await fetchDocuments();
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleSelectDoc = (doc) => {
    localStorage.setItem('activeDocumentId', doc.id);
    localStorage.setItem('activeDocumentName', doc.filename);
    navigate('/chat');
  };

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>My Documents</h2>
        <div className="upload-btn-wrapper">
          <button className="btn-primary btn-next-hover" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload PDF'}
            {!uploading && <span className="btn-arrow">→</span>}
          </button>
          <input type="file" name="myfile" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="documents-grid">
        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>Ready to start studying?</h3>
            <p>Upload your first PDF to generate summaries, quizzes, and chat with AI.</p>
          </div>
        ) : (
          documents.map(doc => {
            const isActive = doc.id === localStorage.getItem('activeDocumentId');
            return (
              <div 
                key={doc.id} 
                className={`document-card ${isActive ? 'active-doc' : ''}`} 
                style={{cursor: 'pointer'}} 
                onClick={() => handleSelectDoc(doc)}
              >
                <div className="doc-icon">
                  {isActive ? '⭐️' : '📄'}
                </div>
                <div className="doc-info">
                  <h3>{doc.filename}</h3>
                  <p>{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                {isActive && <div className="active-badge">Active</div>}
                <button className="btn-delete" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}>Delete</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
