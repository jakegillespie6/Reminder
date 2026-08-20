# apps/auth/permissions.py

from rest_framework.permissions import BasePermission


class IsAccountUser(BasePermission):
    """
    Allows authenticated Account users, but not guests.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and not getattr(request.user, "is_guest", False)
        )