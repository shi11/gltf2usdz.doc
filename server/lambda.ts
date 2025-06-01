import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { parse } from "path";
import { mkdir } from "fs/promises";

// Use /tmp directory in Lambda for file operations
const FILES_FOLDER = "/tmp/gltf2usdz/files";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Ensure temp directory exists
    await mkdir(FILES_FOLDER, { recursive: true });

    // Parse multipart form data from event.body
    const { filename, buffer } = parseMultipartFormData(event);

    if (!filename || !(filename.endsWith(".gltf") || filename.endsWith(".glb"))) {
      throw new Error("You must upload a glb/gltf file.");
    }

    const filepath = `${FILES_FOLDER}/${filename}`;
    await Bun.write(filepath, new Uint8Array(buffer));

    const output = convertFile(filepath);

    // Return the USDZ file as base64
    const usdzContent = await Bun.file(output).arrayBuffer();
    const base64Content = Buffer.from(usdzContent).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${parse(output).base}"`
      },
      body: base64Content,
      isBase64Encoded: true
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: String(error) })
    };
  }
}

function convertFile(filepath: string) {
  const { ext, name } = parse(filepath);
  const output = filepath.replace(ext, ".usdz");

  const { stderr } = Bun.spawnSync([`usd_from_gltf`, filepath, output]);
  
  const stderrString = stderr.toString();
  if (stderrString) {
    console.warn(stderrString);
  }

  const outputFile = Bun.file(output);
  if (!outputFile.exists()) {
    throw new Error("Failed to create USDZ file");
  }

  return output;
}

interface ParsedFormData {
  filename: string;
  buffer: Buffer;
}

function parseMultipartFormData(event: APIGatewayProxyEvent): ParsedFormData {
  if (!event.body) throw new Error('No body in request');
  
  const body = event.isBase64Encoded 
    ? Buffer.from(event.body, 'base64')
    : Buffer.from(event.body);

  const contentType = event.headers['content-type'] || event.headers['Content-Type'];
  const boundary = contentType?.split('boundary=')[1];
  if (!boundary) throw new Error('No boundary in content-type');

  const boundaryBuffer = Buffer.from(`\r\n--${boundary}`);
  const parts = body.toString().split(boundaryBuffer.toString());

  for (const part of parts) {
    const match = part.match(/name="file";\s+filename="([^"]+)"/);
    if (match) {
      const filename = match[1];
      const contentStart = part.indexOf('\r\n\r\n') + 4;
      const contentEnd = part.lastIndexOf('\r\n');
      const content = part.slice(contentStart, contentEnd);
      
      return {
        filename,
        buffer: Buffer.from(content)
      };
    }
  }

  throw new Error('No file found in form data');
} 