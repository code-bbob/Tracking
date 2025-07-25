from .models import Enterprise,Person, Branch
from rest_framework import serializers


class EnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enterprise
        fields = '__all__'

class BranchSerializer(serializers.ModelSerializer):
    enterprise_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Branch
        fields = '__all__'

    def get_enterprise_name(self, obj):
        return obj.enterprise.name if obj.enterprise else None