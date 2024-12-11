'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { Result } from '@zxing/library';
import axios from 'axios';

export default function QRCodeScanner() {
  const [scanning, setScanning] = useState(false);
  console.log(scanning);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);

  // Request camera permissions and initialize scanner
  const requestCameraPermissions = async () => {
    try {
      // Check if camera permissions are granted
      await navigator.mediaDevices.getUserMedia({ video: true });

      // Initialize scanner after permission is granted
      initializeScanner();
    } catch (err) {
      console.error('Camera permission error:', err);
      setError('Camera permission is required to scan QR codes.');
    }
  };

  // Initialize QR code reader
  const initializeScanner = async () => {
    try {
      // Create a new QR code reader
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;

      // Check if video element exists
      if (!videoRef.current) return;

      // Request camera access and start scanning
      const constraints = { 
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 }, // Set ideal width for mobile
          height: { ideal: 720 }, // Set ideal height for mobile
        } 
      };

      const controls = await reader.decodeFromConstraints(
        constraints, 
        videoRef.current, 
        (result: Result | undefined) => {
          if (result) {
            handleScan(result);
          }
        }
      );
      controlsRef.current = controls;
      setScanning(true);
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setError('Could not initialize camera. Ensure camera permissions are granted.');
    }
  };

  useEffect(() => {
    // Request camera permissions on mount
    requestCameraPermissions();

    // Cleanup function
    return () => {
      // Stop the scanner and release the camera
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, []);

  // Handle successful QR code scan
  const handleScan = async (scanResult: Result) => {
    if (scanResult) {
      try {
        // Stop scanning to prevent multiple attempts
        if (controlsRef.current) {
          controlsRef.current.stop();
        }
        setScanning(false);

        // Get the scanned text
        const scannedText = scanResult.getText();
        console.log('Raw Scanned Data:', scannedText);

        // Parse the QR code data
        let qrData;
        try {
          qrData = JSON.parse(scannedText);
        } catch {
          // Attempt alternative parsing
          try {
            qrData = JSON.parse(scannedText.replace(/'/g, '"'));
          } catch {
            throw new Error('Unable to parse QR code data');
          }
        }

        // Validate required fields
        if (!qrData._id) {
          throw new Error('Invalid QR code: Missing ID');
        }

        // Call API to update the document
        const response = await axios.post('/api/scan', {
          name: qrData.name,
          email: qrData.email,
        });

        if (response.data.success) {
          setResult('QR Code scanned and updated successfully!');

          // Optional: Restart scanning after a delay
          setTimeout(() => {
            reinitializeScanner();
          }, 3000);
        }
      } catch (processingError) {
        console.error('QR Code Processing Error:', processingError);
        setError(
          processingError instanceof Error
            ? processingError.message
            : 'Failed to process QR code'
        );

        // Restart scanning
        setTimeout(() => {
          reinitializeScanner();
        }, 3000);
      }
    }
  };

  // Reinitialize the scanner
  const reinitializeScanner = async () => {
    // Reset states
    setScanning(true);
    setError(null);
    setResult(null);

    // Cleanup existing scanner if any
    if (controlsRef.current) {
      controlsRef.current.stop();
    }

    // Reinitialize
    try {
      if (!videoRef.current || !readerRef.current) return;

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 }, // Mobile optimized width
          height: { ideal: 720 }, // Mobile optimized height
        },
      };

      const controls = await readerRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result: Result | undefined) => {
          if (result) {
            handleScan(result);
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      console.error('Scanner reinitialization error:', err);
      setError('Failed to restart scanner');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {/* Video element for scanning */}
      <div className="mb-4 w-full relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{
            transform: 'scaleX(-1)', // Mirror the video
            borderRadius: '8px',
            border: '2px dashed #ccc',
          }}
        />

        {/* Scanning overlay */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          w-48 h-48 border-4 border-green-500 border-dashed pointer-events-none"
        ></div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4">
          {result}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
