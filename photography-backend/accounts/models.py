from django.contrib.auth.models import AbstractUser,BaseUserManager
from django.db import models
from django.utils import timezone
class UserManager(BaseUserManager):
 def create_user(self,email,password=None,**extra):
  if not email: raise ValueError('Email is required')
  user=self.model(email=self.normalize_email(email),**extra)
  user.set_password(password);user.save(using=self._db);return user
 def create_superuser(self,email,password=None,**extra):
  extra.setdefault('is_staff',True);extra.setdefault('is_superuser',True)
  if not extra['is_staff'] or not extra['is_superuser']:raise ValueError('Superuser must be staff and superuser')
  return self.create_user(email,password,**extra)
class User(AbstractUser):
 username=None
 email=models.EmailField(unique=True)
 phone=models.CharField(max_length=20,blank=True)
 USERNAME_FIELD='email';REQUIRED_FIELDS=[]
 objects=UserManager()
 def __str__(self):return self.email
class EmailVerificationOTP(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="email_verification",
    )
    otp_hash = models.CharField(max_length=255)
    expires_at = models.DateTimeField()
    last_sent_at = models.DateTimeField(default=timezone.now)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"Email verification for {self.user.email}"

