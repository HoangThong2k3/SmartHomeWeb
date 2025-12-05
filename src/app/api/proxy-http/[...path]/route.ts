import { NextRequest, NextResponse } from "next/server";

// Danh sách các base URL backend để thử lần lượt
// Ưu tiên lấy từ biến môi trường NEXT_PUBLIC_API_URL
// Ví dụ: NEXT_PUBLIC_API_URL=https://smarthomes-fdbehwcuaaexaggv.eastasia-01.azurewebsites.net/api
const ENV_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

const BACKEND_URLS = [
  ...(ENV_BACKEND_URL ? [ENV_BACKEND_URL] : []),
  // Fallbacks nếu env chưa được set
  "https://smarthomes-fdbehwcuaaexaggv.eastasia-01.azurewebsites.net/api",
  "https://smarthomes-fdbehwcuaaexaggv.eastasia-01.azurewebsites.net",
];

export async function GET(request: NextRequest) {
  return handleRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, "DELETE");
}

async function handleRequest(request: NextRequest, method: string) {
  const { searchParams, pathname } = new URL(request.url);
  const endpoint = pathname.replace("/api/proxy", "");

  // Try each backend URL until one works
  for (const baseUrl of BACKEND_URLS) {
    try {
      const url = `${baseUrl}${endpoint}${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;

      console.log(`Trying ${method} request to: ${url}`);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // Forward authorization header if present
      const authHeader = request.headers.get("authorization");
      if (authHeader) {
        headers["Authorization"] = authHeader;
      }

      const config: RequestInit = {
        method,
        headers,
      };

      // Add body for POST/PUT requests
      if (method === "POST" || method === "PUT") {
        const body = await request.text();
        if (body) {
          config.body = body;
        }
      }

      console.log(`Request config:`, {
        method,
        url,
        headers,
        hasBody: !!config.body,
      });

      const response = await fetch(url, config);

      console.log(
        `Backend response status: ${response.status} from ${baseUrl}`
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorDetails = "";

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
          errorDetails = JSON.stringify(errorData, null, 2);
        } catch (parseError) {
          const errorText = await response.text();
          errorMessage = response.statusText || errorMessage;
          errorDetails = errorText;
        }

        console.error(`Backend error from ${baseUrl}:`, {
          status: response.status,
          message: errorMessage,
          details: errorDetails,
        });

        // If this is the last URL, return the error
        if (baseUrl === BACKEND_URLS[BACKEND_URLS.length - 1]) {
          return NextResponse.json(
            {
              error: errorMessage,
              details: errorDetails,
              status: response.status,
              backendUrl: baseUrl,
            },
            { status: response.status }
          );
        }

        // Otherwise, try the next URL
        continue;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log(`Success from ${baseUrl}:`, data);
        return NextResponse.json(data);
      } else {
        const text = await response.text();
        console.log(`Success from ${baseUrl}:`, text);
        return NextResponse.json({ message: text });
      }
    } catch (error: any) {
      console.error(`Error with ${baseUrl}:`, {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause,
      });

      // If this is the last URL, return the error
      if (baseUrl === BACKEND_URLS[BACKEND_URLS.length - 1]) {
        return NextResponse.json(
          {
            error: `Proxy error: ${error.message}`,
            type: error.name,
            details: error.stack,
            backendUrl: baseUrl,
          },
          { status: 500 }
        );
      }

      // Otherwise, try the next URL
      continue;
    }
  }

  // This should never be reached, but just in case
  return NextResponse.json(
    { error: "All backend URLs failed" },
    { status: 500 }
  );
}
