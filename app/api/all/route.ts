// /C:/Users/birla/OneDrive/Desktop/register/app/api/all/route.tsx
import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Registration from '@/app/models/User';

export async function GET() {
    await dbConnect();

    try {
        const registrations = await Registration.find({});
        return NextResponse.json({ data: registrations });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
