'use client';

import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/browser';
import axios from 'axios';

export default function QRCodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  // Fetch available video devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
      const videoDevices = mediaDevices.filter(
        (device) => device.kind === 'videoinput'
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  // Start scanning
  useEffect(() => {
    if (scanning && selectedDeviceId && webcamRef.current?.video) {
      const videoElement = webcamRef.current.video!;
      codeReader.current.decodeFromVideoElement(videoElement, (result, err) => {
        if (result) {
          handleScan(result.getText());
        }
        if (err) {
          console.log('Decoding error:', err);
        }
      });
    }

  }, [scanning, selectedDeviceId]);

  const handleScan = async (scannedText: string) => {
    try {

      // Parse QR Code Data
      let qrData;
      try {
        qrData = JSON.parse(scannedText);
      } catch {
        try {
          qrData = JSON.parse(scannedText.replace(/'/g, '"'));
        } catch {
          throw new Error('Unable to parse QR code data.');
        }
      }

      if (!qrData._id) {
        throw new Error('Invalid QR code: Missing ID.');
      }

      // Call API to process the scanned data
      const response = await axios.post('/api/scan', {
        name: qrData.name,
        email: qrData.email,
      });

      if (response.data.success) {
        setResult('QR Code scanned and updated successfully!');
        setTimeout(() => restartScanner(), 3000);
      }
    } catch (processingError) {
      console.error('QR Code Processing Error:', processingError);
      setError(
        processingError instanceof Error
          ? processingError.message
          : 'Failed to process QR code.'
      );
      setTimeout(() => restartScanner(), 3000);
    }
  };

  const restartScanner = () => {
    setResult(null);
    setError(null);
    setScanning(true);
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {/* Device Selector */}
      {devices.length > 1 && (
        <div className="mb-4">
          <label className="block mb-2 font-medium">Select Camera:</label>
          <select
            className="p-2 border rounded w-full"
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            value={selectedDeviceId || ''}
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Webcam Feed */}
      <div
        className="mb-4 w-full h-64 bg-gray-200 relative"
        style={{
          borderRadius: '8px',
          border: '2px solid #ccc',
        }}
      >
        {selectedDeviceId && (
          <Webcam
            ref={webcamRef}
            videoConstraints={{
              deviceId: selectedDeviceId,
              facingMode: 'environment',
            }}
            style={{ width: '100%', height: '100%' }}
          />
        )}
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

      {/* Scan Button */}
      {!scanning && (
        <button
          onClick={() => setScanning(true)}
          className="w-full bg-blue-500 text-white p-2 rounded mt-4"
        >
          Start Scanning
        </button>
      )}
    </div>
  );
}
