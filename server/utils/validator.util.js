export const isEmail = (identifier) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(identifier);
};

// Simple phone regex (adjust based on country)
export const isPhone = (identifier) => {
  const phoneRegex = /^[0-9]{10,15}$/; 
  return phoneRegex.test(identifier);
};