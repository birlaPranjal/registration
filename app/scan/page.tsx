'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import axios from 'axios';

export default function OptimizedQRCodeScanner() {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Optimize device enumeration
  const initializeDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(
        (device) => device.kind === 'videoinput'
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setError('Could not access camera devices');
    }
  }, []);

  // Optimize QR code scanning
  const startQRScanning = useCallback(() => {
    if (!webcamRef.current?.video || !selectedDeviceId) return;

    // Configure decoding hints for faster scanning
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      'QR_CODE', 
      'DATA_MATRIX', 
      'AZTEC'
    ]);

    const codeReader = new BrowserMultiFormatReader(hints);
    codeReaderRef.current = codeReader;

    const videoElement = webcamRef.current.video!;

    // Frequent but lightweight scanning
    scanIntervalRef.current = setInterval(() => {
      try {
        codeReader.decodeFromVideoElement(videoElement, (result, error) => {
          if (result) {
            handleQRCodeScan(result.getText());
            stopScanning(); // Stop after successful scan
          }
          if (error) {
            console.debug('Scanning debug:', error);
          }
        });
      } catch (scanError) {
        console.error('Scanning error:', scanError);
      }
    }, 200); // Check every 200ms
  }, [selectedDeviceId]);

  // Optimized scan handler with error parsing
  const handleQRCodeScan = useCallback(async (scannedText: string) => {
    try {
      // Flexible parsing with multiple fallback options
      const qrData = JSON.parse(
        scannedText.replace(/'/g, '"').replace(/\\/g, '')
      );

      if (!qrData._id) {
        throw new Error('Invalid QR code structure');
      }

      // Use axios with timeout for quick API response
      const response = await axios.post('/api/scan', qrData, {
        timeout: 2000, // 2-second timeout
      });

      if (response.data.success) {
        setResult('Scan successful!');
      }
    } catch (error) {
      console.error('QR processing error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Scan processing failed'
      );
    }
  }, []);

  // Cleanup and stop scanning
  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }
  }, []);

  // Initialize devices on component mount
  useEffect(() => {
    initializeDevices();
    return () => stopScanning();
  }, []);

  // Start scanning automatically when camera is ready
  useEffect(() => {
    if (selectedDeviceId) {
      startQRScanning();
    }
    return () => stopScanning();
  }, [selectedDeviceId, startQRScanning]);

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>

      {/* Camera Selection */}
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
      <div className="mb-4 w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
        {selectedDeviceId && (
          <Webcam
            ref={webcamRef}
            videoConstraints={{
              deviceId: selectedDeviceId,
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment'
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
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