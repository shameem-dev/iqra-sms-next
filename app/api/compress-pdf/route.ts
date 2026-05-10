
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {

  
    const formData = await req.formData();

    const uploadedFile =
      formData.get('file') as globalThis.File | null;

    if (!uploadedFile) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

 
    if (uploadedFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }


    const publicKey =
      process.env.ILOVEPDF_PUBLIC_KEY;

    const secretKey =
      process.env.ILOVEPDF_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return NextResponse.json(
        { error: 'Missing iLovePDF API keys' },
        { status: 500 }
      );
    }


    const token = jwt.sign(
      {
        jti: publicKey,
      },
      secretKey,
      {
        algorithm: 'HS256',
        expiresIn: '2h',
      }
    );


    const startRes = await axios.get(
      'https://api.ilovepdf.com/v1/start/compress',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const task = startRes.data.task;

    const server = startRes.data.server;

    console.log('TASK:', task);
    console.log('SERVER:', server);


    const arrayBuffer =
      await uploadedFile.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

  
    const uploadForm = new FormData();

    uploadForm.append('task', task);

    uploadForm.append(
      'file',
      buffer,
      uploadedFile.name
    );

    const uploadRes = await axios.post(
      `https://${server}/v1/upload`,
      uploadForm,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...uploadForm.getHeaders(),
        },
        maxBodyLength: Infinity,
      }
    );

    console.log(
      'UPLOAD RESPONSE:',
      JSON.stringify(uploadRes.data, null, 2)
    );


    const serverFilename =
      uploadRes.data.server_filename ||
      uploadRes.data.files?.[0]?.server_filename;

    console.log(
      'SERVER FILENAME:',
      serverFilename
    );

    if (!serverFilename) {
      throw new Error(
        'Failed to get server filename from upload response'
      );
    }


const processRes = await axios.post(
  `https://${server}/v1/process`,
  {
    task,
    tool: 'compress',
    files: [
      {
        server_filename: serverFilename,
        filename: uploadedFile.name,
      },
    ],
compression_level: 'recommended',  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

console.log(
  'PROCESS RESPONSE:',
  JSON.stringify(processRes.data, null, 2)
);

    console.log(
      'PROCESS RESPONSE:',
      JSON.stringify(processRes.data, null, 2)
    );

   
    const downloadRes = await axios.get(
      `https://${server}/v1/download/${task}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'arraybuffer',
      }
    );


    return new NextResponse(
      Buffer.from(downloadRes.data),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition':
            `attachment; filename="compressed_${uploadedFile.name}"`,
        },
      }
    );

  } catch (err: any) {

    console.error(
      'ILOVEPDF_ERROR:',
      err?.response?.data || err
    );

    return NextResponse.json(
      {
        error:
          err?.response?.data?.error?.message ||
          err?.message ||
          'Compression failed',
      },
      {
        status: 500,
      }
    );
  }
}