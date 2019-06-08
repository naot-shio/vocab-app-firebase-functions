const messageForNoInput = 'Must be filled in';

const notFilledIn = (string) => {
  if (string.trim() === '') return true;
  return false;
}

const isValidEmailAddress = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  return false;
}

const emailValidation = (user, errors) => {
  if (notFilledIn(user.email)) {
    errors.email = messageForNoInput
  } else if (!isValidEmailAddress(user.email)) {
    errors.email = 'Invalid email address'
  };
}

const passwordValidation = (user, errors) => {
  if (notFilledIn(user.password)) errors.password = messageForNoInput;
  if (user.password.length < 6) errors.password = 'Password must be at least 6 characters'
}

exports.signUpValidator = (data) => {
  let errors = {};

  emailValidation(data, errors);
  passwordValidation(data, errors);

  if (data.password !== data.confirmPassword) errors.confirmPassword = 'Password confirmation does not match with password';
  if (notFilledIn(data.name)) errors.name = messageForNoInput;

  return {
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}

exports.loginValidator = (data) => {
  let errors = {};

  emailValidation(data, errors);
  passwordValidation(data, errors);

  return { 
    errors,
    valid: Object.keys(errors).length === 0 ? true : false
  }
}