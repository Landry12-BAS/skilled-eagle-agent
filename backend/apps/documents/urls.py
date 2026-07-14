from django.urls import path
from .views import DocumentUploadView, DocumentListView, DocumentDeleteView, DocumentScrapeView

app_name = 'documents'

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('list/', DocumentListView.as_view(), name='document-list'),
    path('<uuid:pk>/', DocumentDeleteView.as_view(), name='document-delete'),
    path('scrape/', DocumentScrapeView.as_view(), name='document-scrape'),
]
