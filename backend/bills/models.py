from django.db import models

# Create your models here.

class Bill(models.Model):
    code = models.CharField(max_length=20)
    customer_name = models.CharField(max_length=100)
    date_issued = models.DateTimeField(auto_now_add=True)
    amount = models.FloatField()
    issue_location = models.CharField(max_length=100)
    issued_by = models.ForeignKey('enterprise.Person', on_delete=models.CASCADE, related_name='bills_issued')
    vehicle_number = models.CharField(max_length=20)
    material = models.CharField(max_length=100, choices=[
        ('roda', 'Roda'),
        ('baluwa', 'Baluwa'),
        ('dhunga', 'Dhunga'),
        ('gravel', 'Gravel'),
        ('chips', 'Chips'),
        ('dust', 'Dust'),
        ('mato','Mato'),
        ('base/subbase', 'Base/Subbase'),
        ('itta', 'Itta'),
        ('kawadi', 'Kawadi'),
        ('kaath/daura', 'Kaath/Daura'),
        ('other', 'Other'),
    ])
    destination = models.CharField(max_length=100)
    vehicle_size = models.CharField(max_length=20, choices=[
        ('420 cubic feet', '420 cubic feet'),
        ('260 cubic feet', '260 cubic feet'),
        ('160 cubic feet', '160 cubic feet'),
        ('100 cubic feet', '100 cubic feet'),
        ('other', 'Other'),
    ])
    region = models.CharField(max_length=50, choices=[
        ('local', 'Local'),
        ('crossborder', 'Crossborder'),
    ])
    eta = models.DateTimeField()
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ], default='pending')
    remark = models.TextField(blank=True, null=True)
    modified_by = models.ForeignKey('enterprise.Person', on_delete=models.CASCADE, related_name='bills_modified', null=True, blank=True)
    modified_date = models.DateTimeField(null=True, blank=True)
    # paid = models.BooleanField(default=False)

    class Meta:
        # Add database indexes for performance optimization
        indexes = [
            models.Index(fields=['status', 'issued_by']),
            models.Index(fields=['date_issued']),
            models.Index(fields=['modified_date']),
            models.Index(fields=['status', 'date_issued']),
            models.Index(fields=['code']),
            models.Index(fields=['vehicle_number']),
        ]
        # Order by latest first by default
        ordering = ['-date_issued']

    def __str__(self):
        return f"Bill {self.code} - {self.vehicle_number}"
