// Simple test script to test the email API endpoint
// Run with: node test-email.js

const testEmail = 'your-email@example.com'; // Change this to your email

fetch('http://localhost:3000/api/beta-signup-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: testEmail }),
})
  .then(response => response.json())
  .then(data => {
    console.log('✅ Response:', data);
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
