import { handler } from './lambda';

// Mock multipart form data event
const mockEvent = {
  body: '', // We'll populate this
  isBase64Encoded: true,
  headers: {
    'content-type': 'multipart/form-data; boundary=---------------------------123456789'
  }
};

async function testLocal() {
  try {
    // Test file path
    const testFile = './test.glb'; // Put a test glb file here
    
    // Create multipart form data
    const boundary = '-----------------------------123456789';
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test.glb"',
      'Content-Type: application/octet-stream',
      '',
      await Bun.file(testFile).text(),
      `--${boundary}--`
    ].join('\r\n');

    // Create mock event
    const event = {
      ...mockEvent,
      body: Buffer.from(formData).toString('base64')
    };

    // Call handler
    const result = await handler(event as any);
    console.log('Result:', result);

    // If successful, write the USDZ file
    if (result.statusCode === 200 && result.isBase64Encoded) {
      const usdzContent = Buffer.from(result.body, 'base64');
      await Bun.write('test-output.usdz', new Uint8Array(usdzContent));
      console.log('USDZ file written to test-output.usdz');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLocal(); 