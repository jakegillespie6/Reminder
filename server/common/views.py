from rest_framework import viewsets

class ActionPermissionViewSet(viewsets.ViewSet):
    permission_action_classes = {}
    permission_classes = []

    def get_permissions(self):
        permission_classes = self.permission_action_classes.get(
            self.action,
            self.permission_classes,
        )
        return [permission() for permission in permission_classes]