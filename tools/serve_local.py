import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4175
ThreadingHTTPServer(("127.0.0.1", port), QuietHandler).serve_forever()
