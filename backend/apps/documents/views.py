import os
import uuid
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import chromadb

from .models import Document
from apps.ai.tools import fetch_page

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {'.txt', '.md', '.pdf', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp'}
# Maximum characters sent back to the frontend for AI context injection
CONTENT_PREVIEW_LIMIT = 12000

# Initialize ChromaDB client.
CHROMA_DB_DIR = os.environ.get('CHROMA_DB_DIR', os.path.join(settings.BASE_DIR, 'chroma_db'))
os.makedirs(CHROMA_DB_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)


def _extract_text(file_obj) -> str:
    """Extract plain text from .txt, .md, .pdf, or .docx file objects."""
    filename = file_obj.name
    ext = os.path.splitext(filename)[1].lower()
    raw = file_obj.read()

    # Reset file pointer after reading so it can be saved to FileField
    file_obj.seek(0)

    if ext in ('.txt', '.md'):
        return raw.decode('utf-8', errors='replace')

    if ext == '.pdf':
        import fitz  # PyMuPDF
        doc = fitz.open(stream=raw, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
        return "\n\n".join(pages)

    if ext == '.docx':
        import docx
        import io
        document = docx.Document(io.BytesIO(raw))
        return "\n".join(para.text for para in document.paragraphs)

    raise ValueError(f"Unsupported file type: {ext}")


class DocumentUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

        filename = file_obj.name
        ext = os.path.splitext(filename)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            return Response(
                {'error': f'Unsupported file type "{ext}". Supported: {", ".join(sorted(SUPPORTED_EXTENSIONS))}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_image = ext in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        file_type = 'image' if is_image else ('pdf' if ext == '.pdf' else 'text')

        content = ""
        if not is_image:
            try:
                content = _extract_text(file_obj)
            except Exception as e:
                logger.error(f"Document extraction error: {e}")
                return Response({'error': f'Failed to read file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

            if not content.strip():
                return Response({'error': 'File is empty or contains no readable text.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save to Postgres
        document = Document.objects.create(
            user=request.user,
            file=file_obj,
            filename=filename,
            file_type=file_type,
            extracted_text=content if not is_image else ""
        )

        # Chunk by ~1000 words for ChromaDB storage (if text)
        if not is_image:
            words = content.split()
            chunks = [" ".join(words[i:i + 1000]) for i in range(0, len(words), 1000)]
            try:
                collection = chroma_client.get_or_create_collection(name="documents_collection")
                collection.add(
                    documents=chunks,
                    metadatas=[{"filename": filename, "chunk_index": i, "document_id": str(document.id)} for i in range(len(chunks))],
                    ids=[f"{document.id}_{i}" for i in range(len(chunks))],
                )
            except Exception as e:
                logger.error(f"ChromaDB storage error: {e}")

        preview = ""
        if not is_image:
            preview = content if len(content) <= CONTENT_PREVIEW_LIMIT else content[:CONTENT_PREVIEW_LIMIT] + "\n\n... [document truncated]"

        return Response({
            'message': 'File processed successfully.',
            'id': str(document.id),
            'filename': filename,
            'file_type': file_type,
            'content': preview,
        }, status=status.HTTP_201_CREATED)


class DocumentListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        docs = Document.objects.filter(user=request.user).order_by('-created_at')
        data = []
        for d in docs:
            data.append({
                'id': str(d.id),
                'filename': d.filename,
                'file_type': d.file_type,
                'file_url': request.build_absolute_uri(d.file.url) if d.file else None,
                'created_at': d.created_at.isoformat()
            })
        return Response(data)


class DocumentDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, user=request.user)
            # File is automatically handled if you use django-cleanup, else you'd doc.file.delete()
            if doc.file:
                doc.file.delete(save=False)
            
            # Optionally remove from chroma DB here if you want
            try:
                collection = chroma_client.get_collection(name="documents_collection")
                collection.delete(where={"document_id": str(doc.id)})
            except Exception:
                pass
                
            doc.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Document.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)


class DocumentScrapeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        url = request.data.get('url')
        if not url:
            return Response({'error': 'URL is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            content = fetch_page(url)
            if not content:
                return Response({'error': 'Could not fetch content from URL.'}, status=status.HTTP_400_BAD_REQUEST)
                
            document = Document.objects.create(
                user=request.user,
                filename=url,
                file_type='text',
                extracted_text=content
            )
            
            # ChromaDB storage
            words = content.split()
            chunks = [" ".join(words[i:i + 1000]) for i in range(0, len(words), 1000)]
            if chunks:
                try:
                    collection = chroma_client.get_or_create_collection(name="documents_collection")
                    collection.add(
                        documents=chunks,
                        metadatas=[{"filename": url, "chunk_index": i, "document_id": str(document.id)} for i in range(len(chunks))],
                        ids=[f"{document.id}_{i}" for i in range(len(chunks))],
                    )
                except Exception as e:
                    logger.error(f"ChromaDB storage error: {e}")
                
            return Response({
                'id': str(document.id),
                'filename': url,
                'file_type': 'text'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Scrape error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
