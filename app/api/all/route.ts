// /C:/Users/birla/OneDrive/Desktop/register/app/api/all/route.tsx
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Registration from '@/app/models/User';

export async function GET() {
    await dbConnect();

    try {
        const registrations = await Registration.find({}, {
          name: 1,
          email: 1,
          role: 1,
          image: 1,
          isScanned: 1,
          scannedAt: 1,
          _id: 0
        }).sort({ createdAt: -1 });
        return NextResponse.json({ data: registrations });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
