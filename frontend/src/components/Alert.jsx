import { AlertCircle, CheckCircle } from 'lucide-react';

export default function Alert({ message, type = 'error' }) {
  if (!message) return null;

  return (
    <div className={`alert alert-${type}`} role="alert">
      <div className="alert-icon">
        {type === 'success' ? (
          <CheckCircle size={18} />
        ) : (
          <AlertCircle size={18} />
        )}
      </div>
      <div className="alert-content">
        {message}
      </div>
    </div>
  );
}
