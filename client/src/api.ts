export async function convertFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('YOUR_API_GATEWAY_URL', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Conversion failed');
  }

  // Download the USDZ file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name.replace(/\.[^/.]+$/, ".usdz");
  a.click();
} 