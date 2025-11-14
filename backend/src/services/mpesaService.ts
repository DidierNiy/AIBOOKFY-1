import axios from 'axios';
import dotenv from 'dotenv';

interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

dotenv.config();

const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const MPESA_PASSKEY = process.env.MPESA_PASSKEY;
const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE;
const MPESA_ENV = process.env.MPESA_ENV || 'sandbox';

const BASE_URL = MPESA_ENV === 'sandbox' 
  ? 'https://sandbox.safaricom.co.ke' 
  : 'https://api.safaricom.co.ke';

export class MpesaService {
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    
    try {
      const response = await axios.get<MpesaAuthResponse>(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to get Mpesa access token');
    }
  }

  async initiateSTKPush(phoneNumber: string, amount: number, callbackUrl: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

      const response = await axios.post(
        `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: MPESA_SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: amount,
          PartyA: phoneNumber,
          PartyB: MPESA_SHORTCODE,
          PhoneNumber: phoneNumber,
          CallBackURL: callbackUrl,
          AccountReference: 'AIBookify Hotel',
          TransactionDesc: 'Hotel Manager Subscription'
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error initiating STK push:', error);
      throw new Error('Failed to initiate Mpesa payment');
    }
  }

  async handleCallback(callbackData: any): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
  }> {
    try {
      const { Body } = callbackData;
      
      if (Body.stkCallback.ResultCode === 0) {
        // Payment successful
        const items = Body.stkCallback.CallbackMetadata.Item;
        const transactionId = items.find((item: any) => item.Name === 'MpesaReceiptNumber').Value;
        
        return {
          success: true,
          message: 'Payment successful',
          transactionId
        };
      }
      
      return {
        success: false,
        message: Body.stkCallback.ResultDesc
      };
    } catch (error) {
      console.error('Error processing callback:', error);
      return {
        success: false,
        message: 'Failed to process payment callback'
      };
    }
  }
}