"use client";
import Link from 'next/link';
const QRScanner = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 py-10 px-5">
      <Link href="/scan">
        <div className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Scan</div>
      </Link>
      <Link href="/participants">
        <div className="bg-green-500 text-white px-4 py-2 rounded">Participants</div>
      </Link>
    </div>
  );
};
export default QRScanner;