const { CognitoIdentityServiceProvider } = require("aws-sdk");
const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();
const USER_POOL_ID = "us-east-2_9lr3hAFLH";
const stripe = require("stripe")("sk_test_51Q6JNtHtmVPEjv1JVLkeyaHa3WiZkmyLr6ABO6NMXcVGJBInz1oB31QtnZdFtgw0T0Zyca0N6qVBPECkgOvGXSCO009PdNsf8a");

const getUserEmail = async (event) => {
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: event.identity.claims.username
  };
  const user = await cognitoIdentityServiceProvider.adminGetUser(params).promise();
  const { Value: email } = user.UserAttributes.find((attr) => {
    if (attr.Name === "email") {
      return attr.Value;
    }
  });
  return email;
};

/*
 * Get the total price of the order
 * Charge the customer
 */
exports.handler = async (event) => {
  try {
    const { id, cart, total, address, token } = event.arguments.input;
    const { username } = event.identity.claims;
    const email = await getUserEmail(event);

    await stripe.charges.create({
      amount: total * 100,
      currency: "usd",
      source: token,
      description: `Order ${new Date()} by ${username} with ${email} email`
    });
    return { id, cart, total, address, username, email };
  } catch (err) {
    throw new Error(err);
  }
};

