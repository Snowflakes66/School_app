import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope['user']
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'conversation_{self.conversation_id}'

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        is_member = await self.check_membership()
        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.set_online(True)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user.presence',
                'user_id': str(self.user.id),
                'display_name': self.user.name,
                'is_online': True,
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.set_online(False)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user.presence',
                    'user_id': str(self.user.id),
                    'display_name': self.user.name,
                    'is_online': False,
                }
            )
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON.')
            return

        event_type = data.get('type')

        if event_type == 'chat.message':
            await self.handle_new_message(data)
        elif event_type == 'chat.status':
            await self.handle_status_update(data)
        else:
            await self.send_error(f'Unknown event type: {event_type}')

    async def handle_new_message(self, data):
        content = data.get('content', '').strip()
        file_url = data.get('file_url')
        file_name = data.get('file_name')
        file_type = data.get('file_type')

        if not content and not file_url:
            await self.send_error('Message must have content or a file.')
            return

        message = await self.save_message(content, file_url, file_name, file_type)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat.message',
                'message_id': str(message.id),
                'conversation_id': self.conversation_id,
                'sender_id': str(self.user.id),
                'sender_name': self.user.name,
                'sender_avatar': self.user.avatar_url or '',
                'content': content,
                'file_url': file_url or '',
                'file_name': file_name or '',
                'file_type': file_type or '',
                'status': 'sent',
                'created_at': message.created_at.isoformat(),
            }
        )

    async def handle_status_update(self, data):
        message_id = data.get('message_id')
        new_status = data.get('status')

        if new_status not in ('delivered', 'read'):
            await self.send_error('Invalid status.')
            return

        await self.update_message_status(message_id, new_status)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat.status',
                'message_id': message_id,
                'status': new_status,
                'updated_by': str(self.user.id),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({'type': 'chat.message', **event}))

    async def chat_status(self, event):
        await self.send(text_data=json.dumps({'type': 'chat.status', **event}))

    async def user_presence(self, event):
        await self.send(text_data=json.dumps({'type': 'user.presence', **event}))

    @database_sync_to_async
    def check_membership(self):
        from apps.conversations.models import Conversation
        return Conversation.objects.filter(
            id=self.conversation_id,
            members=self.user
        ).exists()

    @database_sync_to_async
    def save_message(self, content, file_url, file_name, file_type):
        from apps.conversations.models import Conversation, Message
        convo = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=convo,
            sender=self.user,
            content=content or None,
            file_url=file_url or None,
            file_name=file_name or None,
            file_type=file_type or None,
            status='sent',
        )
        convo.save()
        return message

    @database_sync_to_async
    def update_message_status(self, message_id, new_status):
        from apps.conversations.models import Message
        Message.objects.filter(id=message_id).update(status=new_status)

    @database_sync_to_async
    def set_online(self, is_online):
        self.user.is_online = is_online
        self.user.last_seen = timezone.now()
        self.user.save(update_fields=['is_online', 'last_seen'])

    async def send_error(self, message):
        await self.send(text_data=json.dumps({'type': 'error', 'message': message}))