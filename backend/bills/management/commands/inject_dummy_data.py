from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from bills.models import Bill
from codes.models import Barcode
from enterprise.models import Person
from userauth.models import User


class Command(BaseCommand):
    help = 'Inject dummy data for bills and barcodes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--bills',
            type=int,
            default=20,
            help='Number of bills to create (default: 20)'
        )
        parser.add_argument(
            '--barcodes',
            type=int,
            default=30,
            help='Number of barcodes to create (default: 30)'
        )

    def handle(self, *args, **options):
        bills_count = options['bills']
        barcodes_count = options['barcodes']

        # First, ensure we have at least one user and person
        self.create_sample_users()
        
        # Create dummy barcodes
        self.create_dummy_barcodes(barcodes_count)
        
        # Create dummy bills
        self.create_dummy_bills(bills_count)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {bills_count} bills and {barcodes_count} barcodes'
            )
        )

    def create_sample_users(self):
        """Create sample users and persons if they don't exist"""
        sample_users = [
            {'email': 'john@example.com', 'name': 'John Doe'},
            {'email': 'jane@example.com', 'name': 'Jane Smith'},
            {'email': 'admin@example.com', 'name': 'Admin User'},
        ]
        
        for user_data in sample_users:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'name': user_data['name'],
                    'is_staff': True,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {user.email}')
            
            # Create person if it doesn't exist
            person, person_created = Person.objects.get_or_create(user=user)
            if person_created:
                self.stdout.write(f'Created person for user: {user.email}')

    def create_dummy_barcodes(self, count):
        """Create dummy barcodes"""
        persons = list(Person.objects.all())
        if not persons:
            self.stdout.write(self.style.ERROR('No persons found. Please create users first.'))
            return

        statuses = ['issued', 'active', 'used', 'cancelled']
        
        for i in range(count):
            code = f"BC{1000 + i:04d}"
            
            # Skip if barcode already exists
            if Barcode.objects.filter(code=code).exists():
                continue
                
            assigned_to = random.choice(persons)
            assigned_by = random.choice(persons)
            status = random.choice(statuses)
            
            # Create barcode with random date in the past 30 days
            created_date = timezone.now() - timedelta(days=random.randint(1, 30))
            
            barcode = Barcode.objects.create(
                code=code,
                status=status,
                assigned_to=assigned_to,
                assigned_by=assigned_by,
                assigned_at=created_date
            )
            
            # Manually set created_at to our random date
            barcode.created_at = created_date
            barcode.save(update_fields=['created_at'])
            
        self.stdout.write(f'Created {count} dummy barcodes')

    def create_dummy_bills(self, count):
        """Create dummy bills"""
        persons = list(Person.objects.all())
        if not persons:
            self.stdout.write(self.style.ERROR('No persons found. Please create users first.'))
            return

        materials = ['roda', 'baluwa', 'dhunga', 'gravel', 'chips', 'dust', 'mato', 'base/subbase', 'itta', 'kawadi', 'kaath/daura', 'other']
        vehicle_sizes = ['260 cubic feet', '160 cubic feet', '100 cubic feet', 'other']
        regions = ['local', 'crossborder']
        statuses = ['pending', 'completed', 'cancelled']
        
        # Sample customer names
        customers = ['ABC Construction', 'XYZ Builder', 'Nepal Infrastructure', 'Mountain Construction', 'Valley Builders', 'Himalayan Projects']
        
        # Sample locations
        locations = ['Kathmandu', 'Bhaktapur', 'Lalitpur', 'Pokhara', 'Chitwan', 'Biratnagar']
        destinations = ['Kathmandu Ring Road', 'Tribhuvan Highway', 'Prithvi Highway', 'East-West Highway', 'Postal Highway', 'Local Road']
        
        # Sample vehicle numbers
        vehicle_prefixes = ['BA', 'KO', 'GA', 'LU', 'ME', 'JA']
        
        for i in range(count):
            code = f"BILL{2000 + i:04d}"
            
            # Skip if bill already exists
            if Bill.objects.filter(code=code).exists():
                continue
            
            issued_by = random.choice(persons)
            modified_by = random.choice(persons) if random.random() > 0.3 else None
            
            # Generate random dates
            date_issued = timezone.now() - timedelta(days=random.randint(1, 60))
            eta_offset = random.randint(1, 7)  # ETA within 1-7 days from issue date
            eta = date_issued + timedelta(days=eta_offset)
            
            modified_date = None
            if modified_by:
                # Modified date should be after issue date
                modified_date = date_issued + timedelta(days=random.randint(1, 10))
            
            # Generate vehicle number
            prefix = random.choice(vehicle_prefixes)
            number = random.randint(10, 99)
            suffix = random.randint(1000, 9999)
            vehicle_number = f"{prefix} {number} {suffix}"
            
            status = random.choice(statuses)
            
            bill = Bill.objects.create(
                code=code,
                customer_name=random.choice(customers),
                amount=round(random.uniform(5000, 50000), 2),
                issue_location=random.choice(locations),
                issued_by=issued_by,
                vehicle_number=vehicle_number,
                material=random.choice(materials),
                destination=random.choice(destinations),
                vehicle_size=random.choice(vehicle_sizes),
                region=random.choice(regions),
                eta=eta,
                status=status,
                remark=f"Sample remark for bill {code}" if random.random() > 0.5 else "",
                modified_by=modified_by,
                modified_date=modified_date
            )
            
            # Manually set date_issued to our random date
            bill.date_issued = date_issued
            bill.save(update_fields=['date_issued'])
            
            # Create associated barcode for some bills
            if random.random() > 0.4:  # 60% chance of having a barcode
                # Try to find an unused barcode or create a new one
                available_barcodes = Barcode.objects.filter(
                    status__in=['issued', 'active'],
                    associated_bill__isnull=True
                )
                
                if available_barcodes.exists():
                    barcode = available_barcodes.first()
                    barcode.associated_bill = bill
                    if status == 'completed':
                        barcode.status = 'used'
                    else:
                        barcode.status = 'active'
                    barcode.save()
                else:
                    # Create a new barcode for this bill
                    barcode_code = f"BC{code[-4:]}"
                    if not Barcode.objects.filter(code=barcode_code).exists():
                        barcode_status = 'used' if status == 'completed' else 'active'
                        Barcode.objects.create(
                            code=barcode_code,
                            status=barcode_status,
                            assigned_to=issued_by,
                            assigned_by=issued_by,
                            assigned_at=date_issued,
                            associated_bill=bill
                        )
            
        self.stdout.write(f'Created {count} dummy bills')
