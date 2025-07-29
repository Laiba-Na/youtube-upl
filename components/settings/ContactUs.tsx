'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function ContactUs() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('Message sent successfully!');
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-textBlack dark:text-white mb-6">Contact Us</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Have a question or feedback? Send us a message and we'll get back to you as soon as possible.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-primaryPurple focus:border-primaryPurple bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="John Doe"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-primaryPurple focus:border-primaryPurple bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="john@example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-primaryPurple focus:border-primaryPurple bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Help with my account"
            required
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            className="w-full px-4 py-2 border rounded-lg focus:ring-primaryPurple focus:border-primaryPurple bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Your message here..."
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primaryPurple hover:bg-highlightBlue text-white font-medium rounded-lg transition-colors duration-300"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
          <Send className={`h-5 w-5 ${isSubmitting ? 'animate-pulse' : ''}`} />
        </button>
      </form>
    </div>
  );
}