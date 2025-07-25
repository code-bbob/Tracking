from .models import Enterprise,Person, Branch
from rest_framework import serializers


class EnterpriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enterprise
        fields = '__all__'

class PersonSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField(read_only=True)
    name = serializers.SerializerMethodField(read_only=True)
    email = serializers.SerializerMethodField(read_only=True)
    enterprise_name = serializers.SerializerMethodField(read_only=True)
    branch_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Person
        fields = ['user', 'username', 'name', 'email', 'role', 'enterprise_name', 'branch_name']

    def get_username(self, obj):
        return obj.user.username if hasattr(obj.user, 'username') else obj.user.email
    
    def get_name(self, obj):
        return obj.user.name if obj.user else None
    
    def get_email(self, obj):
        return obj.user.email if obj.user else None
    
    def get_enterprise_name(self, obj):
        return obj.enterprise.name if obj.enterprise else None
    
    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None

class BranchSerializer(serializers.ModelSerializer):
    enterprise_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Branch
        fields = '__all__'

    def get_enterprise_name(self, obj):
        return obj.enterprise.name if obj.enterprise else None