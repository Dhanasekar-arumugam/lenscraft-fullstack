from django.db import models
class Contact(models.Model):
 name=models.CharField(max_length=100);email=models.EmailField();phone=models.CharField(max_length=20)
 service=models.CharField(max_length=100);preferred_date=models.DateField(null=True,blank=True)
 location=models.CharField(max_length=200,blank=True);message=models.TextField();created_at=models.DateTimeField(auto_now_add=True)
 def __str__(self):return f'{self.name} - {self.service}'
