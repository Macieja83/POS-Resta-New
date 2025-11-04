import React, { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { handleError } from '../../lib/errorHandler';

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  className?: string;
  onGenerate?: (dataUrl: string) => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  url,
  size = 200,
  className = '',
  onGenerate
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = async () => {
    if (!url) {
      setError('URL is required to generate QR code');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      // Generate QR code
      await QRCode.toCanvas(canvas, url, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Get data URL
      const dataUrl = canvas.toDataURL('image/png');
      setQrCodeDataUrl(dataUrl);

      if (onGenerate) {
        onGenerate(dataUrl);
      }
    } catch (err) {
      const error = handleError(err, false);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    if (!qrCodeDataUrl) return;

    try {
      await navigator.clipboard.writeText(url);
      alert('URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className={`qr-code-generator ${className}`}>
      <div className="qr-code-controls">
        <button
          onClick={generateQRCode}
          disabled={isGenerating || !url}
          className="btn btn-primary"
        >
          {isGenerating ? 'Generating...' : 'Generate QR Code'}
        </button>
        
        {qrCodeDataUrl && (
          <div className="qr-code-actions">
            <button onClick={downloadQRCode} className="btn btn-secondary">
              Download
            </button>
            <button onClick={copyToClipboard} className="btn btn-secondary">
              Copy URL
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          {error}
        </div>
      )}

      <div className="qr-code-display">
        <canvas
          ref={canvasRef}
          style={{ display: qrCodeDataUrl ? 'block' : 'none' }}
          className="qr-code-canvas"
        />
        
        {!qrCodeDataUrl && !isGenerating && (
          <div className="qr-code-placeholder">
            <div className="placeholder-icon">📱</div>
            <p>Click "Generate QR Code" to create a QR code for this URL</p>
          </div>
        )}
      </div>

      {url && (
        <div className="qr-code-info">
          <p><strong>URL:</strong> {url}</p>
          <p><strong>Size:</strong> {size}x{size}px</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
