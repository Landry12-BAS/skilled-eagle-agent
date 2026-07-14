from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # In a real SaaS, filter by user/workspace
        return super().get_queryset()
