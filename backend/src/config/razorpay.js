const Razorpay = require('razorpay');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.warn('Razorpay keys missing in .env (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET). Payment APIs will run in Test/Simulated mode.');
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret
    });
  }

  return razorpayInstance;
};

module.exports = {
  getRazorpayInstance
};
