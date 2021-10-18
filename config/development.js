module.exports = {
  apiBaseURL: 'http://localhost:3000',
  authSignInURL: '/users/auth/sign_in.json',
  authSignOutURL: '/users/auth/sign_out.json',
  authUserURL: '/users/auth/validate_token.json',
  singUpUrl: '/users/auth/sign_up.json',
  confirmationUrl: '/users/auth/confirmation.json',
  unlockUrl: '/users/auth/unlock.json',
  frontBaseURL: 'http://localhost:5000',
  singUpConfirmSuccessUrl: '/users/sign_in',
  confirmationConfirmSuccessUrl: '/users/sign_in',
  unlockRedirectUrl: '/users/sign_in'
}
