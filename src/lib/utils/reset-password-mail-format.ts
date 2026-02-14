export const resetPasswordMailFormat = (name: string, link: string) => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #0a0a0a;
        margin: 0;
        padding: 40px 20px;
      }
      .container {
        max-width: 520px;
        margin: 0 auto;
        background-color: #1a1a1a;
        padding: 48px 40px;
        border-radius: 20px;
        text-align: center;
      }
      h1 {
        color: #ffffff;
        font-size: 28px;
        font-weight: 600;
        margin: 0 0 16px 0;
      }
      .subtitle {
        color: #888888;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 36px 0;
      }
      .greeting {
        color: #cccccc;
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 12px 0;
      }
      .btn {
        display: inline-block;
        padding: 14px 48px;
        margin: 8px 0 32px 0;
        background-color: #2a2a2a;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 500;
        border: 1px solid #333333;
        transition: background-color 0.2s;
      }
      .divider {
        border: none;
        border-top: 1px solid #2a2a2a;
        margin: 28px 0;
      }
      .footer {
        color: #555555;
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
      }
      .team {
        color: #777777;
        font-size: 14px;
        margin: 24px 0 0 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Reset password</h1>
      <p class="subtitle">Hi ${name}, we received a request to reset your password. Click the button below to set a new one.</p>
      <a href="${link}" class="btn">Reset password</a>
      <hr class="divider">
      <p class="footer">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p class="team">RedCloud Team</p>
    </div>
  </body>
</html>`;
};
