import React, { useState } from 'react';
import { X, Crown, Book, Zap, Star, Check } from 'lucide-react';

export default function PremiumModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const premiumPrice = 499; // Price in INR

  const premiumFeatures = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "Unlimited eBooks",
      description: "Access to our entire catalog of premium eBooks"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Ad-Free Experience",
      description: "Enjoy reading without any interruptions"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Early Access",
      description: "Get new releases before everyone else"
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "Exclusive Content",
      description: "Premium-only books and author interviews"
    }
  ];

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to subscribe');
        return;
      }

      // Load Razorpay script
      const loaded = await loadRazorpay();
      if (!loaded) {
        setError('Failed to load payment gateway. Please try again.');
        return;
      }

      // Create order
      const orderResponse = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: premiumPrice,
          currency: 'INR'
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        setError(orderData.message || 'Failed to create order');
        return;
      }

      // Razorpay options
      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Novelle Premium',
        description: 'Premium Subscription - 1 Month',
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await fetch('http://localhost:5000/api/payment/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: orderData.order.amount,
                currency: orderData.order.currency
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Update localStorage with new user data
              localStorage.setItem('user', JSON.stringify(verifyData.user));
              
              // Call success callback
              if (onSuccess) {
                onSuccess(verifyData.user);
              }
              
              // Show success message
              alert('🎉 Welcome to Novelle Premium! Your subscription is now active.');
              
              // Reload page to update UI
              window.location.reload();
            } else {
              setError(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Failed to verify payment. Please contact support.');
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem('user'))?.fullname || '',
          email: JSON.parse(localStorage.getItem('user'))?.email || ''
        },
        theme: {
          color: '#f97316'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.error('Subscription error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 p-8 text-white rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <Crown className="w-12 h-12" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-center mb-2">Upgrade to Premium</h2>
          <p className="text-center text-white/90">Unlock unlimited access to our entire library</p>
        </div>

        {/* Features */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {premiumFeatures.map((feature, index) => (
              <div 
                key={index}
                className="flex items-start space-x-4 p-4 bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl"
              >
                <div className="p-3 bg-gradient-to-br from-orange-400 to-pink-400 rounded-xl text-white flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Premium Plan</h3>
                <p className="text-sm text-gray-600">Billed monthly</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-gray-900">₹{premiumPrice}</div>
                <p className="text-sm text-gray-600">per month</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Access to 10,000+ premium eBooks</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Download books for offline reading</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Priority customer support</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                <span>Subscribe Now</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            This is a test payment. No real money will be charged.
          </p>
        </div>
      </div>
    </div>
  );
}