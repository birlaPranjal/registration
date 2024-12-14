'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import axios from 'axios';

export default function OptimizedQRCodeScanner() {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameras, setCameras] = useState<{id: string, label: string}[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);

  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-code-scanner';

  // Initialize cameras
  useEffect(() => {
    const initializeCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        setCameras(devices);
      } catch (err) {
        console.error('Error getting cameras:', err);
        setError('Unable to access camera devices');
      }
    };

    initializeCameras();
  }, []);

  // Start QR Code scanning
  const startScanning = async () => {
    // Reset previous states
    setError(null);
    setResult(null);

    if (cameras.length === 0) {
      setError('No cameras available');
      return;
    }

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      });

      qrCodeScannerRef.current = html5QrCode;

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: 250,
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          deviceId: cameras[currentCameraIndex].id
        }
      };

      await html5QrCode.start(
        cameras[currentCameraIndex].id, 
        config, 
        onScanSuccess, 
        onScanFailure
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start QR code scanner');
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    try {
      if (qrCodeScannerRef.current) {
        await qrCodeScannerRef.current.stop();
        qrCodeScannerRef.current.clear();
        qrCodeScannerRef.current = null;
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  // Handle successful QR code scan
  const onScanSuccess = async (decodedText: string) => {
    try {
      // Flexible parsing with multiple fallback options
      const qrData = JSON.parse(
        decodedText.replace(/'/g, '"').replace(/\\/g, '')
      );

      if (!qrData.name || !qrData.email) {
        throw new Error('Invalid QR code structure');
      }

      // Use axios with timeout for quick API response
      const response = await axios.post('/api/scan', qrData, {
        timeout: 5000, // 5-second timeout
      });

      if (response.data.success) {
        setResult(`Scan successful for ${qrData.name}!`);
        // Optional: Stop scanning after successful registration
        await stopScanning();
      } else {
        setError(response.data.message || 'Scan processing failed');
      }
    } catch (error) {
      console.error('QR processing error:', error);
      
      // Detailed error handling
      if (axios.isAxiosError(error)) {
        if (error.response) {
          setError(error.response.data.message || 'Server error during scan');
        } else if (error.request) {
          setError('No response from server. Check network connection.');
        } else {
          setError('Error preparing scan request');
        }
      } else {
        setError(
          error instanceof Error 
            ? error.message 
            : 'Unexpected error during scan'
        );
      }
    }
  };

  // Handle scan failure (optional)
  const onScanFailure = (error?: string) => {
    // Typically, you don't want to set an error for every failed scan
    console.debug('Scan error:', error);
  };

  // Switch to next camera
  const switchCamera = () => {
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    // Restart scanning with new camera if currently scanning
    if (isScanning) {
      stopScanning().then(() => {
        startScanning();
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Event Registration Scanner</h1>

      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div className="mb-4 flex space-x-2">
          <button
            onClick={switchCamera}
            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            Switch Camera
          </button>
          <span className="self-center">
            Current Camera: {cameras[currentCameraIndex].label || `Camera ${currentCameraIndex + 1}`}
          </span>
        </div>
      )}

      {/* QR Code Scanner Container */}
      <div 
        id={scannerContainerId} 
        className="mb-4 w-full h-64 bg-gray-200 rounded-lg overflow-hidden"
      />

      {/* Scanning Controls */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={startScanning}
          disabled={isScanning || cameras.length === 0}
          className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isScanning ? 'Scanning...' : 'Start Scanning'}
        </button>
        <button
          onClick={stopScanning}
          disabled={!isScanning}
          className="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:bg-red-300"
        >
          Stop Scanning
        </button>
      </div>

      {/* Status and Error Displays */}
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
          {result}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
          {error}
        </div>
      )}
    </div>
  );
}