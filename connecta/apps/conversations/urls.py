from django.urls import path
from .views import (
    ConversationListCreateView, ConversationDetailView,
    MemberManagementView, MessageListCreateView,
    MessageStatusView, FileUploadView
)

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='conversation-list'),
    path('conversations/<uuid:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<uuid:pk>/members/', MemberManagementView.as_view(), name='conversation-members'),
    path('conversations/<uuid:pk>/members/<uuid:uid>/', MemberManagementView.as_view(), name='conversation-member-remove'),
    path('conversations/<uuid:pk>/messages/', MessageListCreateView.as_view(), name='message-list'),
    path('messages/<uuid:pk>/status/', MessageStatusView.as_view(), name='message-status'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
]