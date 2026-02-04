import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';

// Google Client setup
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID Token
 * @param {string} idToken - Token received from Frontend
 */
export const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    
    const payload = ticket.getPayload();
    
    return {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      providerId: payload.sub, // Google ka unique User ID
      emailVerified: payload.email_verified
    };
  } catch (error) {
    throw new Error('Invalid Google Token');
  }
};

/**
 * Verify Facebook Access Token
 * @param {string} accessToken - Token received from Frontend
 */
export const verifyFacebookToken = async (accessToken) => {
  try {
    // Facebook Graph API call
    const { data } = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken,
      },
    });

    return {
      name: data.name,
      email: data.email,
      picture: data.picture?.data?.url,
      providerId: data.id, // Facebook ka unique User ID
      emailVerified: true // Facebook verified maana jata hai usually
    };
  } catch (error) {
    throw new Error('Invalid Facebook Token');
  }
};