import io, json, zipfile
from http.server import HTTPServer, BaseHTTPRequestHandler
from pypdf import PdfReader
from xml.etree import ElementTree

LIMIT = 5_000_000
ORIGINS = {'http://localhost:4175', 'http://127.0.0.1:4175'}

def extract(data, kind):
    if not 0 < len(data) < LIMIT:
        raise ValueError('Choose a non-empty file smaller than 5 MB.')
    if kind == 'pdf':
        if not data.startswith(b'%PDF-'):
            raise ValueError('This file is not a readable PDF.')
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            raise ValueError('This PDF is encrypted. Export an unlocked copy and try again.')
        if len(reader.pages) > 60:
            raise ValueError('Please upload a resume with no more than 60 pages.')
        text = '\n\n'.join(page.extract_text() or '' for page in reader.pages)
    elif kind == 'docx':
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            if sum(item.file_size for item in archive.infolist()) > 25_000_000:
                raise ValueError('The expanded Word file is too large. Export a smaller copy.')
            names = ['word/document.xml'] + [n for n in archive.namelist() if n.startswith(('word/header','word/footer')) and n.endswith('.xml')]
            lines = []
            for name in names:
                xml = archive.read(name)
                if b'<!DOCTYPE' in xml or b'<!ENTITY' in xml:
                    raise ValueError('Unsupported XML declarations in Word file.')
                root = ElementTree.fromstring(xml)
                ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
                for paragraph in root.iter(ns+'p'):
                    lines.append(''.join(node.text or '' for node in paragraph.iter(ns+'t')))
            text = '\n'.join(lines)
    else:
        raise ValueError('Use PDF or Word (.docx). For legacy .doc files, save as .docx first.')
    if len(text.strip()) < 40:
        raise ValueError('Not enough readable text was found. This may be a scanned document. Export a searchable PDF or a DOCX file; OCR is not available yet.')
    if len(text) > 100_000:
        raise ValueError('Extracted text is too long. Please upload a shorter resume.')
    return text

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, value):
        data = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        origin = self.headers.get('Origin','')
        if origin in ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Vary','Origin')
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.send_header('Content-Length',str(len(data)))
        self.end_headers()
        self.wfile.write(data)
    def do_OPTIONS(self):
        self.send_response(204)
        if self.headers.get('Origin') in ORIGINS:
            self.send_header('Access-Control-Allow-Origin',self.headers['Origin'])
            self.send_header('Access-Control-Allow-Methods','POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers','Content-Type')
        self.end_headers()
    def do_POST(self):
        if self.headers.get('Origin') not in ORIGINS:
            self.reply(403, {'error':'This local service only accepts the resume preview.'}); return
        try:
            if self.path not in ('/parse/pdf','/parse/docx'):
                self.reply(404, {'error':'Unsupported format.'}); return
            size = int(self.headers.get('Content-Length','0'))
            if not 0 < size < LIMIT:
                self.reply(413, {'error':'The file must be smaller than 5 MB.'}); return
            self.connection.settimeout(20)
            data = self.rfile.read(size)
            self.reply(200, {'text':extract(data,self.path.rsplit('/',1)[1])})
        except ValueError as error:
            self.reply(422, {'error':str(error)})
        except Exception:
            self.reply(422, {'error':'This file could not be read. It may be damaged, encrypted or not a supported document. Export a new PDF or DOCX and retry.'})
    def log_message(self, *args):
        pass

if __name__ == '__main__':
    HTTPServer(('127.0.0.1',4177),Handler).serve_forever()

