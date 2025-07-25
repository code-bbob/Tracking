from django.db import models

# Create your models here.

class Barcode(models.Model):
    code = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=[
        ('issued', 'Issued'),
        ('active', 'Active'),
        ('used', 'Used'),
        ('cancelled', 'Cancelled'),
    ], default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    associated_bill = models.ForeignKey('bills.Bill', on_delete=models.CASCADE, related_name='barcodes', null=True, blank=True)
    def __str__(self):
        return f"Code: {self.code} - Description: {self.description[:50]}"


class Assignment(models.Model):
    barcode_from = models.IntegerField()
    barcode_to = models.IntegerField()
    assigned_to = models.ForeignKey('enterprise.Person', on_delete=models.CASCADE, related_name='assignment_to')
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey('enterprise.Person', on_delete=models.CASCADE, related_name='assignment_by')
    def __str__(self):
        return f"Assignment of {self.barcode.code} to {self.assigned_to.username}"