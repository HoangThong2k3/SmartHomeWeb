import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  "https://smarthome-bnauatedb7bucncy.eastasia-01.azurewebsites.net/api";

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
  try {
    const { searchParams, pathname } = new URL(request.url);
    const endpoint = pathname.replace("/api/proxy", "");
    const url = `${BACKEND_URL}${endpoint}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;

    console.log(`Proxying ${method} request to: ${url}`);

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
      // Disable SSL verification for development
      // @ts-expect-error - rejectUnauthorized is a valid option for https agent
      rejectUnauthorized: false,
    };

    // Add body for POST/PUT requests
    if (method === "POST" || method === "PUT") {
      const body = await request.text();
      if (body) {
        config.body = body;
        console.log(`Request body:`, body);
      } else {
        console.log(`No body in ${method} request`);
      }
    }

    console.log(`Request config:`, {
      method,
      url,
      headers: Object.fromEntries(Object.entries(headers)),
      hasBody: !!config.body,
      bodyLength: config.body ? (typeof config.body === 'string' ? config.body.length : 'non-string') : 0,
    });

    let response: Response;
    try {
      response = await fetch(url, config);
      console.log(`Backend response status: ${response.status}`);
      console.log(
        `Backend response headers:`,
        Object.fromEntries(response.headers.entries())
      );
    } catch (fetchError: any) {
      // Network error or fetch failed
      console.error("Fetch failed:", fetchError);
      return NextResponse.json(
        {
          error: `Network error: ${fetchError.message}`,
          detail: `Failed to connect to backend: ${url}`,
          message: `Network error: ${fetchError.message}`,
          details: `Failed to connect to backend: ${url}`,
          status: 500,
        },
        { status: 200 } // Return 200 so client can read error body
      );
    }

    // Check content length
    const contentLength = response.headers.get("content-length");
    // If content-length is explicitly 0, there's no content
    // If it's missing, we'll try to read and handle errors
    const hasContent = contentLength !== null ? parseInt(contentLength) > 0 : undefined;

    // Handle 204 No Content
    if (response.status === 204) {
      console.log(`204 No Content response`);
      return NextResponse.json({ success: true, message: "Operation completed successfully" }, { status: 200 });
    }

    // Handle explicitly empty successful responses (content-length: 0)
    if (response.ok && hasContent === false) {
      console.log(`Empty successful response (content-length: 0)`);
      return NextResponse.json({ success: true, message: "Operation completed successfully" }, { status: 200 });
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      let errorDetails = "";

      // Only try to parse error body if we know there's content or if content-length is unknown
      if (hasContent !== false) {
        try {
          // Read response as text first, then parse as JSON if needed
          // This avoids the issue where we can't read response again after json() fails
          const errorText = await response.text();
          
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.detail || errorData.error || errorMessage;
              errorDetails = JSON.stringify(errorData, null, 2);
            } catch (parseError) {
              // Not JSON, use as plain text
              errorMessage = response.statusText || errorMessage;
              errorDetails = errorText || "";
            }
          } else {
            errorMessage = response.statusText || `HTTP ${response.status}`;
            errorDetails = "";
          }
        } catch (textError) {
          // Response might be completely empty or unreadable
          errorMessage = response.statusText || `HTTP ${response.status}`;
          errorDetails = "";
        }
      } else {
        // Empty error response - provide more context
        errorMessage = response.statusText || `HTTP ${response.status}: Server returned empty response`;
        errorDetails = "Backend returned an error with no error message. This usually indicates a server-side issue.";
      }

      console.error(`Backend error:`, {
        status: response.status,
        message: errorMessage,
        details: errorDetails,
        url: url,
        method: method,
      });

      // Return error with status 200 so client can read the error details
      // Client-side will throw based on the error field
      return NextResponse.json(
        {
          error: errorMessage,
          detail: errorDetails,
          message: errorMessage,
          details: errorDetails,
          status: response.status,
        },
        { status: 200 } // Return 200 so client can read error body
      );
    }

    // Handle successful response - check if explicitly empty
    if (hasContent === false) {
      console.log(`Empty successful response (content-length: 0)`);
      return NextResponse.json({ success: true, message: "Operation completed successfully" });
    }

    // Read response as text first, then parse as JSON if needed
    // This avoids the issue where we can't read response again after json() fails
    const contentType = response.headers.get("content-type");
    try {
      const text = await response.text();
      
      if (contentType && contentType.includes("application/json")) {
        try {
          const data = text ? JSON.parse(text) : {};
          console.log(`Response data:`, data);
          return NextResponse.json(data);
        } catch (parseError) {
          // JSON parse failed, use as plain text
          console.warn(`Failed to parse as JSON, using as text`);
          console.log(`Response text:`, text);
          return NextResponse.json({ message: text || "Success" });
        }
      } else {
        console.log(`Response text:`, text);
        return NextResponse.json({ message: text || "Success" });
      }
    } catch (textError) {
      // Even text parsing failed, return success
      console.warn(`Failed to read response text`);
      return NextResponse.json({ success: true, message: "Operation completed successfully" });
    }
  } catch (error: any) {
    console.error("Proxy error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause,
    });

    // ALWAYS return 200 with error field so client can read error message
    // Never return 500 as it prevents client from reading error details
    return NextResponse.json(
      {
        error: `Proxy error: ${error.message}`,
        detail: error.stack || error.message,
        message: `Proxy error: ${error.message}`,
        details: error.stack || error.message,
        type: error.name,
        status: 500,
      },
      { status: 200 } // Return 200 so client can read error body
    );
  }
}
