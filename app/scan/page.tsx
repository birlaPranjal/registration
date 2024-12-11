"use client";
import React, { useRef, useEffect, useState } from 'react';
import jsQR from 'jsqr';
import axios from 'axios';

export default function QRCodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error('Camera permission error:', err);
        setError('Failed to access camera. Please check permissions.');
      }
    };

    startVideo();

    return () => {
      // Stop the video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }

      // Cancel animation frame
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, []);

  const sendScanData = async (data: string) => {
    try {
      // Try parsing the QR code data
      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        // Fallback parsing attempt
        try {
          parsedData = JSON.parse(data.replace(/'/g, '"'));
        } catch {
          throw new Error('Unable to parse QR code data');
        }
      }

      // Validate required fields
      if (!parsedData.name || !parsedData.email) {
        throw new Error('Missing name or email in QR code');
      }

      // Send data to scan route
      const response = await axios.post('/api/scan', {
        name: parsedData.name,
        email: parsedData.email
      });

      if (response.data.success) {
        setResult('QR Code scanned successfully!');
      } else {
        throw new Error(response.data.message || 'Scan processing failed');
      }
    } catch (err) {
      console.error('Scan data send error:', err);
      setError(
        err instanceof Error 
          ? `Scan Error: ${err.message}` 
          : 'Failed to process scan data'
      );
    }
  };

  const scanQRCode = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    // Set canvas dimensions to match video
    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) return;

      // Draw the video frame onto the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data from the canvas
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Decode the QR code
      const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

      if (qrCode) {
        console.log('QR Code Data:', qrCode.data);
        
        // Stop further scanning to prevent multiple calls
        if (requestIdRef.current) {
          cancelAnimationFrame(requestIdRef.current);
        }

        // Send scan data to API
        sendScanData(qrCode.data);
      } else {
        // Continue scanning if no QR code found
        requestIdRef.current = requestAnimationFrame(scanQRCode);
      }
    }
  };

  const handleVideoPlay = () => {
    // Start scanning once the video is playing
    scanQRCode();
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    // Restart scanning
    scanQRCode();
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {/* Video element */}
      <video
        ref={videoRef}
        onPlay={handleVideoPlay}
        className="w-full h-auto"
        style={{ border: '2px solid #ccc', borderRadius: '8px' }}
      />

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Result Display */}
      {result && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {result}
          <button 
            onClick={resetScanner}
            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded"
          >
            Scan Again
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={resetScanner}
            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}