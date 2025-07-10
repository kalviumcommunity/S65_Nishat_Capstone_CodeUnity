const config = {
  backendUrl: import.meta.env.PROD 
    ? 'https://cu-669q.onrender.com'
    : 'http://localhost:8080',
  frontendUrl: import.meta.env.PROD
    ? 'https://cu-sandy.vercel.app'
    : 'http://localhost:5173'
};

export default config;
