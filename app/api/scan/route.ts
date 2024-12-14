import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Registration from '@/app/models/User';

export async function POST(request: NextRequest) {
    // Ensure database connection
    await dbConnect();

    try {
        // Parse the request body
        const body = await request.json();
        const { name, email } = body;

        // Validate input
        if (!name || !email) {
            return NextResponse.json({ 
                success: false, 
                message: 'Name and email are required' 
            }, { status: 400 });
        }

        // Find and update the document
        const updatedRegistration = await Registration.findOneAndUpdate(
            { name, email }, 
            { 
                isScanned: true, 
                scannedAt: new Date() 
            }, 
            { 
                new: true,  // Return the updated document
                runValidators: true  // Run model validations
            }
        );

        // Handle case where no document is found
        if (!updatedRegistration) {
            return NextResponse.json({ 
                success: false, 
                message: 'Registration not found' 
            }, { status: 404 });
        }

        // Successful response
        return NextResponse.json({ 
            success: true, 
            data: updatedRegistration 
        });
    } catch (error) {
        // Handle any unexpected errors
        console.error('Update error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        }, { status: 500 });
    }
}