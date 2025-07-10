const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS  
    }
  });
};

const createCustomTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

router.post('/share-room', async (req, res) => {
  try {
    const { 
      recipientEmail, 
      recipientName, 
      senderName, 
      roomId, 
      roomUrl, 
      message 
    } = req.body;

    if (!recipientEmail || !roomId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email and room ID are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured. Please contact administrator.'
      });
    }

    const transporter = createTransporter();

    const subject = `${senderName || 'Someone'} invited you to collaborate on CodeUnity`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 8px 8px 0 0; 
          }
          .content { 
            background: #f8fafc; 
            padding: 30px; 
            border: 1px solid #e2e8f0; 
          }
          .footer { 
            background: #2d3748; 
            color: white; 
            padding: 20px; 
            text-align: center; 
            border-radius: 0 0 8px 8px; 
            font-size: 14px; 
          }
          .btn { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
            font-weight: bold; 
          }
          .room-info { 
            background: white; 
            border: 1px solid #e2e8f0; 
            border-radius: 6px; 
            padding: 16px; 
            margin: 20px 0; 
          }
          .room-id { 
            font-family: monospace; 
            background: #f1f5f9; 
            padding: 8px; 
            border-radius: 4px; 
            font-size: 14px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚀 CodeUnity Collaboration Invitation</h1>
          <p>You've been invited to join a collaborative coding session!</p>
        </div>
        
        <div class="content">
          <h2>Hi ${recipientName || 'there'}! 👋</h2>
          
          <p><strong>${senderName || 'Someone'}</strong> has invited you to collaborate on a coding project using CodeUnity.</p>
          
          ${message ? `<p><em>"${message}"</em></p>` : ''}
          
          <div class="room-info">
            <h3>📍 How to Join:</h3>
            <p><strong>Room ID:</strong> <span class="room-id">${roomId}</span></p>
            <p>1. Go to <a href="https://codeunity.dev" style="color: #667eea;">CodeUnity</a></p>
            <p>2. Enter the Room ID above to join the collaboration session</p>
          </div>
          
          <div style="text-align: center;">
            <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>Room ID: ${roomId}</strong><br>
              <small>Copy this ID and enter it on CodeUnity to join the session</small>
            </p>
          </div>
          
          <h3>✨ What you can do:</h3>
          <ul>
            <li>💻 Write and edit code together in real-time</li>
            <li>💬 Chat with your team members</li>
            <li>🤖 Get AI-powered code assistance</li>
            <li>▶️ Run and test code collaboratively</li>
            <li>📁 Manage files and projects together</li>
          </ul>
          
          <p><small>💡 <strong>Tip:</strong> Save the Room ID for easy access to continue collaborating!</small></p>
        </div>
        
        <div class="footer">
          <p>This invitation was sent via CodeUnity - AI-Powered Collaborative Coding Platform</p>
          <p>🌐 <a href="https://codeunity.dev" style="color: #cbd5e0;">codeunity.dev</a></p>
        </div>
      </body>
      </html>
    `;

    const textContent = `
${senderName || 'Someone'} invited you to collaborate on CodeUnity!

Hi ${recipientName || 'there'}!

${senderName || 'Someone'} has invited you to join a collaborative coding session on CodeUnity.

${message ? `Message: "${message}"` : ''}

How to Join:
- Room ID: ${roomId}
- Go to CodeUnity (https://codeunity.dev)
- Enter the Room ID above to join the collaboration session

What you can do:
- Write and edit code together in real-time
- Chat with your team members  
- Get AI-powered code assistance
- Run and test code collaboratively
- Manage files and projects together

This invitation was sent via CodeUnity - AI-Powered Collaborative Coding Platform
Visit: https://codeunity.dev
    `;

    const mailOptions = {
      from: {
        name: 'CodeUnity',
        address: process.env.EMAIL_USER
      },
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);

    res.json({
      success: true,
      message: 'Invitation email sent successfully!',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    if (error.code === 'EAUTH') {
      return res.status(500).json({
        success: false,
        message: 'Email authentication failed. Please check email configuration.'
      });
    }
    
    if (error.code === 'ENOTFOUND') {
      return res.status(500).json({
        success: false,
        message: 'Email server not found. Please check your internet connection.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send email. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/test', async (req, res) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        message: 'Email configuration missing. Please set EMAIL_USER and EMAIL_PASS environment variables.'
      });
    }

    const transporter = createTransporter();
    
    await transporter.verify();
    
    res.json({
      success: true,
      message: 'Email configuration is valid and ready to use!'
    });
    
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
