module.exports = {
  apiBaseURL: 'http://localhost:3000',
  authSignInURL: '/users/auth/sign_in.json',
  authSignOutURL: '/users/auth/sign_out.json',
  authUserURL: '/users/auth/validate_token.json',
  singUpUrl: '/users/auth/sign_up.json',
  confirmationNewUrl: '/users/auth/confirmation.json',
  unlockNewUrl: '/users/auth/unlock.json',
  passwordNewUrl: '/users/auth/password.json',
  passwordUpdateUrl: '/users/auth/password/update.json',
  userShowUrl: '/users/auth/show.json',
  userImageUpdateUrl: '/users/auth/image/update.json',
  userImageDestroyUrl: '/users/auth/image/destroy.json',
  userInfoUpdateUrl: '/users/auth/update.json',
  userDeleteUrl: '/users/auth/delete.json',
  userUndoDeleteUrl: '/users/auth/undo_delete.json',
  frontBaseURL: 'http://localhost:5000',
  singUpSuccessUrl: '/users/sign_in',
  confirmationSuccessUrl: '/users/sign_in',
  unlockRedirectUrl: '/users/sign_in',
  passwordRedirectUrl: '/users/password'
}
