const fs = require('fs');
const csv = require('csv-parser');
const QRCode = require('qrcode');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
const { default: Registration } = require(path.join(__dirname, '../app/models/User.ts'));

// Hardcoded credentials
const CLOUDINARY_CLOUD_NAME = 'travelee';
const CLOUDINARY_API_KEY = '884793152861746';
const CLOUDINARY_API_SECRET = '-UjW9F9RS7Syyz6crou5_otGggg';
const MONGODB_URI = 'mongodb+srv://birlapranjal460:y2UqJBMjvbX7aFob@admivo.chkfr3y.mongodb.net/test?retryWrites=true&w=majority&appName=admivo';
const EMAIL_USER = 'Marketing@admivo.in';
const EMAIL_PASS = 'jwvj nuti oqnr nans';

// Cloudinary config
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
});

// Alternative transporter (not used by default, but can be swapped in if needed)
const alternativeTransporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // SSL
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

const logoUrl = 'https://hackmivo.admeet.in/logo.png';
// const mapIframe = `<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3679.0766797955866!2d75.88520867616639!3d22.762535425980573!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd34120d6119%3A0x14c53843ab835caa!2sAdmivo%20%7C%20German%20Public%20University%20%7C%20Ivy%20League%20Expert%20%7C%20Scholarship%20Mentor!5e0!3m2!1sen!2sin!4v1749321527956!5m2!1sen!2sin" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
const footerImgUrl = 'https://ci3.googleusercontent.com/mail-sig/AIorK4zpsXvkgHAvw9G96bt_aV66ThEijQLLo241X6sOwfVn0DMU5nXumKUfkw1PaLspcQ21RXsH5mGkhA9u';
// const termsPdfUrl = 'https://your-domain.com/scripts/Terms&Conditions.pdf'; // <-- Replace with your actual public URL

const mailContent = `
  <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;text-align:center;">
    <img src="${logoUrl}" alt="Hackmivo Logo" style="width:200px;display:block;margin:24px auto 16px auto;"/>
    <h2 style="margin-bottom:8px;">Welcome to Hackmivo Hackathon 2025!</h2>
    <p style="font-size:1.1em;">We're thrilled to have you join us for a day of innovation, collaboration, and creativity. Get ready to build, learn, and compete with the brightest minds!</p>
    <hr style="margin:24px 0;">
    <h3 style="margin-bottom:4px;">Event Highlights</h3>
    <ul style="display:inline-block;text-align:left;margin:0 auto 16px auto;padding-left:20px;">
      <li>🚀 <b>Venue:</b> <a href="https://maps.app.goo.gl/nm1tvunfj3Ce4jJh7" target="_blank">Click for the Venue</a></li>
      <li>🕘 <b>Arrival Time:</b> 9:15 AM sharp – Don't be late!</li>
      <li>☕ <b>Refreshments:</b> Provided throughout the event</li>
      <li>📋 <b>Check-in:</b> Show your QR code at the entrance</li>
    </ul>
    <p style="margin:16px 0;">Please ensure all your team members review the event guidelines before the event day.</p>
    <div style="margin:24px 0;">
      <b>Your QR Code for Check-in:</b><br>
      <img src="__QR_URL__" alt="QR Code" style="width:180px;display:block;margin:16px auto;"/>
    </div>
    <hr style="margin:24px 0;">
    <div style="margin-bottom:16px;">
      <b>Contact Us:</b><br>
      If you have any questions, reply to this email or contact the event organizers at <a href="mailto:marketing@admivo.in">marketing@admivo.in</a>.
    </div>
    <img src="${footerImgUrl}" alt="Footer" style="width:300px;display:block;margin:24px auto 0 auto;"/>
    <div style="font-size:0.9em;color:#888;margin-top:8px;">See you at Hackmivo 2025!<br>— The Hackmivo Team</div>
  </div>
`;

async function generateAndUploadQR(text) {
  const qrDataUrl = await QRCode.toDataURL(text);
  // Convert base64 to buffer
  const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, 'base64');
  // Upload to Cloudinary
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'hackmivo_qr' }, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    }).end(buffer);
  });
}

async function processTeams() {
  await mongoose.connect(MONGODB_URI);
  const teams = [];
  fs.createReadStream(__dirname + '/test.csv')
    .pipe(csv())
    .on('data', (row) => teams.push(row))
    .on('end', async () => {
      console.log(`Processing ${teams.length} teams...`);
      for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        try {
          const name = team['Member Name'];
          const email = team['Email'];
          const role = team['Team Name'];
          console.log(`Processing ${i + 1}/${teams.length}: ${name} - ${email}`);
          // Generate QR code for name and email
          const qrText = `${name} - ${email}`;
          const qrUrl = await generateAndUploadQR(qrText);
          // Save to MongoDB with correct schema
          await Registration.create({
            name,
            email,
            role,
            image: qrUrl,
            isScanned: false,
            scannedAt: null,
            currentProfession: '',
            investmentField: '',
          });
          console.log("Saved in DB team: ", name, email, qrUrl);
          // Send email with retry logic
          const html = mailContent.replace('__QR_URL__', qrUrl);
          const mailOptions = {
            from: `Hackmivo <${EMAIL_USER}>`,
            to: email,
            subject: 'Hackmivo Hackathon 2025 – Important Info & QR Code',
            html,
            attachments: [
              {
                filename: 'Terms&Conditions.pdf',
                content: fs.readFileSync(__dirname + '/Terms&Conditions.pdf'),
                contentType: 'application/pdf'
              }
            ]
          };
          // Retry logic for email sending
          let emailSent = false;
          let retryCount = 0;
          const maxRetries = 3;
          while (!emailSent && retryCount < maxRetries) {
            try {
              await transporter.sendMail(mailOptions);
              console.log(`✅ Email sent successfully to: ${email}`);
              emailSent = true;
            } catch (emailError) {
              retryCount++;
              console.log(`❌ Email attempt ${retryCount} failed for ${email}:`, emailError.message);
              if (retryCount < maxRetries) {
                console.log(`⏳ Retrying in 5 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
              } else {
                console.error(`❌ Failed to send email to ${email} after ${maxRetries} attempts`);
                // Log failed email for manual follow-up
                console.log(`FAILED EMAIL: ${name} - ${email} - QR: ${qrUrl}`);
              }
            }
          }
          // Add delay between processing to avoid overwhelming the SMTP server
          if (i < teams.length - 1) {
            console.log('⏳ Waiting 2 seconds before next email...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (err) {
          console.error(`Error processing ${team['Email']}:`, err);
        }
      }
      console.log('✅ All teams processed!');
      mongoose.disconnect();
    });
}

processTeams(); 