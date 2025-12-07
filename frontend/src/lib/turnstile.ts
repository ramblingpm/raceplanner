/**
 * Verify Cloudflare Turnstile token on the server side
 * @param token - The Turnstile token from the client
 * @returns Promise<boolean> - true if valid, false if invalid
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('❌ TURNSTILE_SECRET_KEY is not configured');
    return false;
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    console.log('🔐 Turnstile verification result:', {
      success: data.success,
      errorCodes: data['error-codes'],
    });

    return data.success === true;
  } catch (error) {
    console.error('❌ Error verifying Turnstile token:', error);
    return false;
  }
}
