from rest_framework import serializers
from apps.accounts.serializers import PublicUserSerializer
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender = PublicUserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender',
            'content', 'file_url', 'file_name', 'file_type',
            'status', 'created_at'
        ]
        read_only_fields = ['id', 'sender', 'status', 'created_at', 'conversation']


class SendMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content', 'file_url', 'file_name', 'file_type']

    def validate(self, attrs):
        if not attrs.get('content') and not attrs.get('file_url'):
            raise serializers.ValidationError('A message must have either text content or a file.')
        return attrs


class ConversationSerializer(serializers.ModelSerializer):
    members = PublicUserSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'is_group', 'name', 'icon_url',
            'members', 'member_count', 'last_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()


class CreateConversationSerializer(serializers.Serializer):
    is_group = serializers.BooleanField(default=False)
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
    )

    def validate(self, attrs):
        if attrs.get('is_group') and not attrs.get('name'):
            raise serializers.ValidationError({'name': 'Group chats require a name.'})
        return attrs