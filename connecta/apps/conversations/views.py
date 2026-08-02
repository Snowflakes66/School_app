import cloudinary.uploader
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import CursorPagination

from apps.accounts.models import User
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, CreateConversationSerializer,
    MessageSerializer, SendMessageSerializer
)


class MessageCursorPagination(CursorPagination):
    page_size = 50
    ordering = 'created_at'
    cursor_query_param = 'cursor'


class ConversationListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        convos = Conversation.objects.filter(
            members=request.user
        ).prefetch_related('members', 'messages')
        serializer = ConversationSerializer(convos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        is_group = data.get('is_group', False)
        member_ids = data['member_ids']

        members = User.objects.filter(id__in=member_ids)
        if members.count() != len(member_ids):
            return Response(
                {'detail': 'One or more users not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # For DMs: return existing conversation if it already exists
        if not is_group:
            other_user = members.first()
            existing = Conversation.objects.filter(
                is_group=False,
                members=request.user
            ).filter(members=other_user)
            if existing.exists():
                return Response(
                    ConversationSerializer(existing.first()).data,
                    status=status.HTTP_200_OK
                )

        convo = Conversation.objects.create(
            is_group=is_group,
            name=data.get('name', ''),
            created_by=request.user
        )
        convo.members.add(request.user, *members)

        return Response(
            ConversationSerializer(convo).data,
            status=status.HTTP_201_CREATED
        )


class ConversationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        return get_object_or_404(Conversation, pk=pk, members=user)

    def get(self, request, pk):
        convo = self.get_object(pk, request.user)
        return Response(ConversationSerializer(convo).data)

    def patch(self, request, pk):
        convo = self.get_object(pk, request.user)
        if not convo.is_group:
            return Response(
                {'detail': 'Cannot rename a direct message.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        for field in ['name', 'icon_url']:
            if field in request.data:
                setattr(convo, field, request.data[field])
        convo.save()
        return Response(ConversationSerializer(convo).data)


class MemberManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        convo = get_object_or_404(Conversation, pk=pk, members=request.user)
        if not convo.is_group:
            return Response(
                {'detail': 'Cannot add members to a DM.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user_id = request.data.get('user_id')
        user = get_object_or_404(User, pk=user_id)
        convo.members.add(user)
        return Response({'detail': f'{user.name} added to {convo.name}.'})

    def delete(self, request, pk, uid):
        convo = get_object_or_404(Conversation, pk=pk, members=request.user)
        if not convo.is_group:
            return Response(
                {'detail': 'Cannot remove members from a DM.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user = get_object_or_404(User, pk=uid)
        convo.members.remove(user)
        return Response({'detail': f'{user.name} removed from {convo.name}.'})


class MessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_conversation(self, pk, user):
        return get_object_or_404(Conversation, pk=pk, members=user)

    def get(self, request, pk):
        convo = self.get_conversation(pk, request.user)
        paginator = MessageCursorPagination()
        messages = Message.objects.filter(conversation=convo)
        page = paginator.paginate_queryset(messages, request)
        serializer = MessageSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, pk):
        convo = self.get_conversation(pk, request.user)
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=convo,
            sender=request.user,
            **serializer.validated_data
        )
        convo.save()

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )


class MessageStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        message = get_object_or_404(
            Message, pk=pk, conversation__members=request.user
        )
        new_status = request.data.get('status')
        valid = [Message.StatusChoices.DELIVERED, Message.StatusChoices.READ]
        if new_status not in valid:
            return Response(
                {'detail': 'Invalid status.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        message.status = new_status
        message.save(update_fields=['status'])
        return Response(MessageSerializer(message).data)


class FileUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    FILE_TYPE_MAP = {
        'image/jpeg': 'image',
        'image/png': 'image',
        'image/gif': 'image',
        'image/webp': 'image',
        'application/pdf': 'pdf',
        'application/msword': 'document',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
    }

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'detail': 'No file provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        content_type = file.content_type
        resource_type = 'image' if content_type.startswith('image/') else 'raw'
        file_type = self.FILE_TYPE_MAP.get(content_type, 'other')

        result = cloudinary.uploader.upload(
            file,
            folder='connecta/files',
            resource_type=resource_type,
            use_filename=True,
            unique_filename=True,
        )

        return Response({
            'file_url': result['secure_url'],
            'file_name': file.name,
            'file_type': file_type,
        })