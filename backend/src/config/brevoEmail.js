import SibApiV3Sdk from "sib-api-v3-sdk";

// 🔹 Initialize Brevo Client
const client = SibApiV3Sdk.ApiClient.instance;

const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// 🔹 Create API Instance
const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

//email sender
export const sendEmail = async ({
  to,
  subject,
  htmlContent,
}) => {
  try {
    if (!to || !subject || !htmlContent) {
      throw new Error("Missing required email fields");
    }

    const response = await tranEmailApi.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_FROM,
        name: process.env.EMAIL_FROM_NAME,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    console.log("Email sent Successfully", response?.messageId);
    return response;
  } catch (error) {
    console.error(
      "Brevo Email Error:",
      error.response?.body || error.message
    );
    throw new Error("Email sending failed");
  }
};