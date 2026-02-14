from django.contrib import admin
from django.urls import path
from graphene_django.views import GraphQLView
from celery import shared_task

@shared_task
def trigger_error():
    1 / 0

urlpatterns = [
    path("admin/", admin.site.urls),
    path("graphql/", GraphQLView.as_view(graphiql=True)),
]
