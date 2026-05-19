import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

export const initializeEmailService = () => {
  try {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailHost || !emailPort || !emailUser || !emailPass) {
      throw new Error('Email configuration missing in environment variables');
    }

    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: false, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    console.log('✅ Email service initialized successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email service:', error);
    throw error;
  }
};

export const getEmailTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    return initializeEmailService();
  }
  return transporter;
};

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderId: string;
  orderDate: Date;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export const sendOrderConfirmationEmail = async (data: OrderEmailData): Promise<void> => {
  try {
    const emailTransporter = getEmailTransporter();

    const itemsHtml = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">Size: ${item.size}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">×${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>
    `
      )
      .join('');

    const mailOptions = {
      from: `"Leena Collection" <${process.env.EMAIL_USER}>`,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Dear ${data.customerName},</p>
            <p style="font-size: 16px; margin-bottom: 20px;">Thank you for shopping with Leena Collection! Your order has been confirmed and is being processed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h2 style="color: #667eea; margin-top: 0;">Order Details</h2>
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${data.orderId}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #667eea; margin-top: 0;">Order Items</h2>
              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
                  <td style="padding: 10px; text-align: right;">₹${data.subtotal.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Shipping:</strong></td>
                  <td style="padding: 10px; text-align: right;">${data.shipping === 0 ? 'FREE' : `₹${data.shipping}`}</td>
                </tr>
                <tr style="background: #f0f0f0;">
                  <td colspan="3" style="padding: 15px; text-align: right; font-size: 18px;"><strong>Total:</strong></td>
                  <td style="padding: 15px; text-align: right; font-size: 18px; color: #667eea;"><strong>₹${data.total.toLocaleString()}</strong></td>
                </tr>
              </table>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #667eea; margin-top: 0;">Shipping Address</h2>
              <p style="margin: 5px 0;">${data.shippingAddress.fullName}</p>
              <p style="margin: 5px 0;">${data.shippingAddress.phone}</p>
              <p style="margin: 5px 0;">${data.shippingAddress.address}</p>
              <p style="margin: 5px 0;">${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}</p>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404;"><strong>⚠️ Important:</strong> Please note that all sales are final. We do not accept returns or exchanges.</p>
            </div>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">If you have any questions about your order, please contact us at . support@leena.com</p>
            
            <p style="font-size: 16px; margin-top: 30px;">Thank you for choosing Leena Collection!</p>
            <p style="font-size: 14px; color: #666;">Best regards,<br>Leena Collection Team</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Leena Collection. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${data.customerEmail}`);
  } catch (error) {
    console.error('❌ Failed to send order confirmation email:', error);
    // Don't throw error - email failure shouldn't break the order flow
  }
};

export { OrderEmailData };
