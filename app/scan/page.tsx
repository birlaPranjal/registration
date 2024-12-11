'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

export default function QRCodeScanner() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'html5qr-code-scanner';

  useEffect(() => {
    // Initialize the QR Code scanner
    const html5QrCode = new Html5Qrcode(scannerContainerId);
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10, // Frames per second
      qrbox: { width: 250, height: 250 }, // Size of the scanning box
    };

    html5QrCode
      .start(
        { facingMode: 'environment' }, // Use back camera
        config,
        handleScanSuccess,
        handleScanFailure
      )
      .catch(err => {
        console.error('Failed to start scanner:', err);
        setError('Could not initialize the scanner. Ensure camera permissions are granted.');
      });

    // Cleanup on component unmount
    return () => {
      html5QrCode.stop().catch(err => console.error('Error stopping the scanner:', err));
    };
  }, []);

  const handleScanSuccess = async (decodedText: string, decodedResult: any) => {
    console.log('Scanned data:', decodedText);
    try {
      // Parse the QR code data
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch {
        // Attempt alternative parsing
        qrData = JSON.parse(decodedText.replace(/'/g, '"'));
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
      } else {
        throw new Error('Failed to update document on the server');
      }
    } catch (processingError) {
      console.error('QR Code Processing Error:', processingError);
      setError(
        processingError instanceof Error
          ? processingError.message
          : 'Failed to process QR code'
      );
    }
  };

  const handleScanFailure = (errorMessage: string) => {
    console.warn('Scan failure:', errorMessage);
    // You can use this to show temporary messages or handle failures
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {/* Scanner Container */}
      <div
        id={scannerContainerId}
        className="w-full h-80 border border-gray-300 rounded"
      ></div>

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
