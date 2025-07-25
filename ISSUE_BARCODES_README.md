# Issue Barcodes Feature

## Overview
The Issue Barcodes feature allows administrators to generate and assign barcodes to team members within their enterprise. This is a role-based feature that is only accessible to users with Admin privileges.

## Backend Implementation

### API Endpoints

#### 1. Issue Barcode - `POST /codes/issue-barcode/`
- **Access**: Admin only
- **Purpose**: Generate and assign new barcodes
- **Request Body**:
  ```json
  {
    "assigned_to": 1,        // User ID of person receiving barcodes
    "assigned_by": 2,        // User ID of person issuing barcodes (admin)
    "count": 5               // Number of barcodes to generate (1-1000)
  }
  ```
- **Response**:
  ```json
  {
    "issued_codes": ["123456789012", "234567890123", ...]
  }
  ```

#### 2. Get Persons - `GET /enterprise/persons/`
- **Access**: Admin only
- **Purpose**: Fetch all persons in the same enterprise for assignment dropdown
- **Response**:
  ```json
  [
    {
      "user": 1,
      "username": "john@example.com",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "Admin",
      "enterprise_name": "ABC Company",
      "branch_name": "Main Branch"
    }
  ]
  ```

#### 3. Get User Role - `GET /enterprise/role/`
- **Access**: Authenticated users
- **Purpose**: Get current user's role for authorization
- **Response**: `"Admin"` or `"Staff"`

### Models

#### Barcode Model
```python
class Barcode(models.Model):
    code = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=[
        ('issued', 'Issued'),
        ('active', 'Active'),
        ('used', 'Used'),
        ('cancelled', 'Cancelled'),
    ], default='issued')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    assigned_to = models.ForeignKey('enterprise.Person', on_delete=models.CASCADE, related_name="assigned_barcodes")
    assigned_at = models.DateTimeField(default=timezone.now)
    assigned_by = models.ForeignKey('enterprise.Person', on_delete=models.CASCADE, related_name="assigned_barcodes_by")
    associated_bill = models.ForeignKey('bills.Bill', on_delete=models.CASCADE, related_name='barcodes', null=True, blank=True)
```

## Frontend Implementation

### Pages

#### Issue Barcodes Page (`/issue-barcodes`)
- **Access**: Admin only (automatically redirects non-admins)
- **Features**:
  - Form to select assigned person, assigning person, and barcode count
  - Real-time validation and error handling
  - Success feedback with list of generated codes
  - Professional UI with animations and responsive design
  - Role-based access control

### Components Used
- Custom UI components (Button, Input, Label, Card, Select)
- Framer Motion for animations
- Lucide React for icons
- Tailwind CSS for styling

### Role-Based Access
- Home page shows "Issue Codes" button only for admins
- Issue Barcodes page redirects non-admins to home
- All API calls include proper authorization headers

## Security Features

1. **Backend Authorization**:
   - All endpoints check user authentication
   - Admin-only endpoints verify user role
   - Database queries filtered by enterprise

2. **Frontend Protection**:
   - Role checking on page load
   - Automatic redirection for unauthorized access
   - JWT token validation

3. **Data Validation**:
   - Input validation on both frontend and backend
   - Unique barcode generation with collision detection
   - Count limits (1-1000 barcodes per request)

## How to Use

### For Administrators:

1. **Access the Feature**:
   - Log in with admin credentials
   - Navigate to home page
   - Click "Issue Codes" button (only visible to admins)

2. **Issue Barcodes**:
   - Select the person to assign barcodes to
   - Select the admin issuing the barcodes
   - Enter the number of barcodes (1-1000)
   - Click "Issue Barcodes"

3. **View Results**:
   - Successful issuance shows generated barcode numbers
   - Recent codes appear in the sidebar
   - Form resets for next issuance

### For Developers:

1. **Testing**:
   - Create test users with different roles
   - Test role-based access restrictions
   - Verify barcode uniqueness
   - Test edge cases (invalid counts, permissions)

2. **Extending**:
   - Add barcode tracking features
   - Implement barcode usage analytics
   - Add bulk operations
   - Integrate with external barcode systems

## Environment Setup

### Backend
```bash
cd backend
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm run dev
```

### Environment Variables
Create `frontend/.env`:
```
VITE_BACKEND_URL=http://localhost:8000
```

## Database Schema

The barcode system uses these key relationships:
- `Barcode.assigned_to` → `Person` (who receives the barcode)
- `Barcode.assigned_by` → `Person` (admin who issued it)
- `Person.enterprise` → `Enterprise` (enterprise scope)
- `Person.user` → `User` (authentication link)

## API Response Examples

### Successful Barcode Issuance
```json
{
  "issued_codes": [
    "123456789012",
    "234567890123", 
    "345678901234"
  ]
}
```

### Permission Denied
```json
{
  "error": "You do not have permission to issue barcodes."
}
```

### Validation Error
```json
{
  "error": "Count must be between 1 and 1000."
}
```

## Future Enhancements

1. **Barcode Management**:
   - View all issued barcodes
   - Barcode status tracking
   - Bulk status updates

2. **Reporting**:
   - Issuance reports
   - Usage analytics
   - Export functionality

3. **Integration**:
   - Barcode scanning integration
   - Mobile app support
   - Third-party barcode services

4. **Notifications**:
   - Email notifications on issuance
   - Real-time updates
   - Assignment confirmations
