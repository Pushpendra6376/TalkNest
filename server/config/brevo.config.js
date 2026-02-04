import SibApiV3Sdk from 'sib-api-v3-sdk';
import dotenv from 'dotenv';
dotenv.config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_SECRET_KEY;

const transactionalEmailsApi = new SibApiV3Sdk.TransactionalEmailsApi();

export { transactionalEmailsApi };