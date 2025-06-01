import { readFileSync } from 'fs';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';

async function testConversion() {
  const form = new FormData();
  const file = await fileFromPath('./test.glb'); // Put a test.glb file in your server directory
  form.append('file', file);

  const response = await fetch('http://127.0.0.1:3000/convert', {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    console.error('Error:', response.status, await response.text());
    return;
  }

  const buffer = await response.arrayBuffer();
  // Save the USDZ file
  await Bun.write('./output.usdz', buffer);
  console.log('Conversion successful! Check output.usdz');
}

testConversion().catch(console.error); 