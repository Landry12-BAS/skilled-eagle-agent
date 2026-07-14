import uuid
from django.db import models
from django.conf import settings

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    file = models.FileField(upload_to='documents/', null=True, blank=True)
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50) # image, text, pdf, etc.
    extracted_text = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.filename
