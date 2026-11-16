from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsReviewOwnerOrStaff(BasePermission):

    message = "You do not have permission to modify this review."

    def has_object_permission(self, request, view, obj):

        if request.method in SAFE_METHODS:
            return (
                obj.status == "approved"
                or (
                    request.user.is_authenticated
                    and (
                        obj.customer_id == request.user.id
                        or request.user.is_staff
                    )
                )
            )

        if not request.user.is_authenticated:
            return False

        return (
            obj.customer_id == request.user.id
            or request.user.is_staff
        )


class IsStaffUser(BasePermission):

    message = "Only authorized staff can perform this action."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.is_staff
        )