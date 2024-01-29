const code = 'en'
const messages = {
  // _default: 'The {field} is not valid',
  // alpha: 'May only contain alphabetic characters', // "The {field} field may only contain alphabetic characters",
  // alpha_num: 'May only contain alpha-numeric characters', // "The {field} field may only contain alpha-numeric characters",
  // alpha_dash: 'May contain alpha-numeric characters as well as dashes and underscores', // "The {field} field may contain alpha-numeric characters as well as dashes and underscores",
  // alpha_spaces: 'May only contain alphabetic characters as well as spaces', // "The {field} field may only contain alphabetic characters as well as spaces",
  // between: 'Must be between 0:{min} and 1:{max}', // "The {field} field must be between 0:{min} and 1:{max}",
  // confirmed: 'Confirmation does not match', // "The {field} field confirmation does not match",
  confirmed_password: 'Password does not match.',
  confirmed_new_password: 'Does not match new password.',
  // digits: 'Must be numeric and exactly contain 0:{length} digits', // "The {field} field must be numeric and exactly contain 0:{length} digits",
  // dimensions: 'Must be 0:{width} pixels by 1:{height} pixels', // "The {field} field must be 0:{width} pixels by 1:{height} pixels",
  email: 'Must be a valid email', // "The {field} field must be a valid email",
  // not_one_of: 'Does not a valid value', // "The {field} field is not a valid value",
  // ext: 'Does not a valid file', // "The {field} field is not a valid file",
  // image: 'Must be an image', // "The {field} field must be an image",
  // integer: 'Must be an integer', // "The {field} field must be an integer",
  // "is": 'Does not match',
  // length: 'Must be 0:{length} long', // "The {field} field must be 0:{length} long",
  // max_value: 'Must be 0:{max} or less', // "The {field} field must be 0:{max} or less",
  max: 'May not be greater than 0:{length} characters', // "The {field} field may not be greater than 0:{length} characters",
  // mimes: 'Must have a valid file type', // "The {field} field must have a valid file type",
  // min_value: 'Must be 0:{min} or more', // "The {field} field must be 0:{min} or more",
  min: 'Must be at least 0:{length} characters', // "The {field} field must be at least 0:{length} characters",
  // numeric: 'May only contain numeric characters', // "The {field} field may only contain numeric characters",
  // one_of: 'Does not a valid value', // "The {field} field is not a valid value",
  // regex: 'Format is invalid', // "The {field} field format is invalid",
  // required_if: 'Required', // "The {field} field is required",
  required: 'Required', // "The {field} field is required",
  // size: 'Size must be less than 0:{size}KB', // "The {field} field size must be less than 0:{size}KB",
  size_20MB: 'Size must be less than 20MB'
  // url: 'Does not a valid URL', // "The {field} field is not a valid URL"
}

export default {
  code,
  messages
}
