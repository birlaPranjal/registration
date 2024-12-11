"use client";
import React from 'react';
import { useSearchParams } from "next/navigation";
import Link from "next/link"; // Add this import
import Registrations from "@/public/data";

const WelcomePage = () => {
    const searchParams = useSearchParams();
    
    // Extract parameters from searchParams
    const name = searchParams.get('name') || 'Guest';
    const email = searchParams.get('email') || 'N/A';
    const profession = searchParams.get('profession') || 'N/A';


    // Call the update function when component mounts
    React.useEffect(() => {
        updateRegistration();
    }, []);

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 py-10 px-5">
            <h1 className="text-4xl font-bold text-blue-600 mb-6">Welcome, {name}!</h1>
            <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
                <div className="mb-4">
                    <p className="text-gray-600 font-semibold">Name:</p>
                    <p className="text-xl">{name}</p>
                </div>
                
                <div className="mb-4">
                    <p className="text-gray-600 font-semibold">Email:</p>
                    <p className="text-xl">{email}</p>
                </div>
                
                <div className="mb-4">
                    <p className="text-gray-600 font-semibold">Profession:</p>
                    <p className="text-xl">{profession}</p>
                </div>

                <Link href="/scan" className="block w-full">
                    <button className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        Scan Next
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default WelcomePage;