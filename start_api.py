import os
import sys
from http.server import ThreadingHTTPServer

# Ensure we can import from the api folder
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.predict import handler

if __name__ == "__main__":
    port = 8000
    server_address = ('', port)
    
    print(f"🚀 Starting local Python API server on http://localhost:{port}")
    print("This allows Next.js 'npm run dev' to proxy /api/predict correctly.")
    print("Press Ctrl+C to stop.")
    
    try:
        httpd = ThreadingHTTPServer(server_address, handler)
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
