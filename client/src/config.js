const config = {
  backendUrl: import.meta.env.PROD 
    ? 'https://s65-nishat-capstone-codeunity-swbt.onrender.com'
    : 'http://localhost:8080',
  frontendUrl: import.meta.env.PROD
    ? 'https://cunity.vercel.app'
    : 'http://localhost:5173'
};

export default config;
