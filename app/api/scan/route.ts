import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Registration from '@/app/models/User';

export async function POST(request: NextRequest) {
    await dbConnect();

    try {
        const body = await request.json();
        const name = body.name.trim();  // Trim to avoid trailing spaces
        const email = body.email;

        if (!name || !email) {
            return NextResponse.json({ 
                success: false, 
                message: 'Name and email are required' 
            }, { status: 400 });
        }

        const updatedRegistration = await Registration.findOneAndUpdate(
            { 
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                email: { $regex: new RegExp(`^${email}$`, 'i') }
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
                message: 'Registration not found' 
            }, { status: 404 });
        }

        return NextResponse.json({ 
            success: true,
            data: updatedRegistration 
        });
    } catch (error) {
        console.error('Error updating registration:', error);
        return NextResponse.json({ 
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        }, { status: 500 });
    }
}
