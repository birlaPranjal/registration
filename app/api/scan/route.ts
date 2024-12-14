import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Registration from '@/app/models/User';

export async function POST(request: NextRequest) {
    // Ensure database connection
    await dbConnect();

    try {
        const body = await request.json();
        const { name, email } = body;

        // Enhanced input validation
        if (!name || !email) {
            return NextResponse.json({ 
                success: false, 
                message: 'Name and email are required' 
            }, { status: 400 });
        }

        // Case-insensitive and trimmed matching
        const updatedRegistration = await Registration.findOneAndUpdate(
            { 
                name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }, 
                email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
            }, 
            { 
                isScanned: true, 
                scannedAt: new Date() 
            }, 
            { 
                new: true,  
                runValidators: true  
            }
        );

        if (!updatedRegistration) {
            return NextResponse.json({ 
                success: false, 
                message: 'No matching registration found. Please check details.' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true, 
            message: `Successfully registered ${name}`,
            data: {
                name: updatedRegistration.name,
                email: updatedRegistration.email,
                scannedAt: updatedRegistration.scannedAt
            }
        });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }, { status: 500 });
    }
}