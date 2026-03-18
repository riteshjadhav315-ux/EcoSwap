import fetch from 'node-fetch';

async function test() {
  console.log('Waiting 5 seconds for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  try {
    const res = await fetch('http://0.0.0.0:3000/api/health');
    const data = await res.json();
    console.log('Health Check:', data);
    
    const productsRes = await fetch('http://0.0.0.0:3000/api/products');
    const products = await productsRes.json();
    console.log('Products:', products);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
