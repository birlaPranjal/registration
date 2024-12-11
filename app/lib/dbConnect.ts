import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://birlapranjal460:CcPMWXRkNm8uin6a@cluster0.rr7mh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'eventregistrations';

const dbConnect = async () => {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Failed to connect to MongoDB', error);
    }
};

export default dbConnect;