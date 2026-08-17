import { getRequiredSmtpVariables, isEmailServiceConfigured, sendEmailTestMessage } from "../src/services/emailService.js";

async function main() {
  if (!isEmailServiceConfigured()) {
    console.error(`SMTP is not configured. Missing one or more of: ${getRequiredSmtpVariables().join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const result = await sendEmailTestMessage();
  if (!result.ok) {
    console.error(`SMTP is not configured. Missing one or more of: ${result.requiredEnvVars.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log("White Angels email test message sent successfully.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Email test failed.");
  process.exitCode = 1;
});
