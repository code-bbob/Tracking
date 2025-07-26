from rest_framework import serializers
from .models import Bill
from codes.models import Barcode
from enterprise.models import Person

class BillSerializer(serializers.ModelSerializer):
    issued_by_name = serializers.SerializerMethodField()
    modified_by_name = serializers.SerializerMethodField()
    class Meta:
        model = Bill
        fields = '__all__'

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
        print(validated_data)
        print("code", code)
        if code:
            barcode = Barcode.objects.get(code=code)
            print("barcode", barcode)
            if barcode and barcode.status == 'active':
                if status == 'completed':
                    barcode.status = 'used'
                elif status == 'cancelled':
                    barcode.status = 'cancelled'
                else:
                    raise serializers.ValidationError("Invalid status for bill.")
                barcode.save()
                print(barcode.status)
                print("HERE FOR THE FIRST TIME")
            else:
                raise serializers.ValidationError("Barcode is either not active or already expired.")
        else:
            raise serializers.ValidationError("Barcode code is required for updating the bill.")
        for attr, value in validated_data.items():
            print("HERE AS WELL", attr, value)
            setattr(instance, attr, value)
        instance.save()
        print("DONE",instance.status)
        return instance
    
    def get_issued_by_name(self, obj):
        if obj.issued_by:
            return obj.issued_by.user.name
        return None
    
    def get_modified_by_name(self, obj):
        if obj.modified_by:
            return obj.modified_by.user.name
        return None