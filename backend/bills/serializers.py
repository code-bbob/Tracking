from rest_framework import serializers
from .models import Bill
from codes.models import Barcode
from enterprise.models import Person

class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = '__all__'
        extra_kwargs = {
            'issued_by': {'required': False}  # Make it optional in the API
        }

    def create(self, validated_data):
        code = validated_data.get('code')
        issued_by = validated_data.get('issued_by')
        print("haha",code)
        if code:
            barcode = Barcode.objects.filter(code=code).first()
            if barcode.assigned_to != issued_by:
                raise serializers.ValidationError("This barcode was not issued to you")

            if barcode and barcode.status == 'issued':
                barcode.status = 'active'
                barcode.save()
            else:
            # If no barcode is found or it's not issued, return with an error
                raise serializers.ValidationError("Barcode is either not issued or already expired.")

        bill = Bill.objects.create(**validated_data)
        return bill
    
    def update(self, instance, validated_data):

        # Handle issued_by field - use first Person or create a default one
        status = validated_data.get('status')
        code = validated_data.get('code')
        if code:
            barcode = Barcode.objects.get(code=code)
            if barcode and barcode.status == 'active':
                if status == 'completed':
                    barcode.status = 'used'
                elif status == 'cancelled':
                    barcode.status = 'cancelled'
                else:
                    raise serializers.ValidationError("Invalid status for bill.")
                barcode.save()
            else:
                raise serializers.ValidationError("Barcode is either not issued or already expired.")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance