from django.contrib import admin
from django.urls import path
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt


from graphene_file_upload.django import FileUploadGraphQLView


from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "graphql/",
        csrf_exempt(FileUploadGraphQLView.as_view(graphiql=True))
        if settings.DEBUG
        else FileUploadGraphQLView.as_view(graphiql=False),
    ),
]

if settings.DEBUG or not settings.USE_CLOUDINARY_STORAGE:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
